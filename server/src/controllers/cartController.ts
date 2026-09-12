import { Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { checkStockAvailability } from '../services/inventoryService.js';

const getOrCreateCart = async (userId: string) => {
  const existing = await pool.query(
    `
    SELECT id, user_id, created_at, updated_at
    FROM cart
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const cartId = `cart_${userId}`;

  const created = await pool.query(
    `
    INSERT INTO cart (
      id,
      user_id
    )
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id, user_id, created_at, updated_at
    `,
    [cartId, userId]
  );

  return created.rows[0];
};

const parseArrayValue = (value: unknown): any[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const mapVariant = (row: any) => ({
  id: row.id,
  productId: row.product_id,
  sku: row.sku,
  variantName: row.variant_name,
  color: row.color ?? undefined,
  colorCode: row.color_code ?? undefined,
  size: row.size ?? undefined,
  storage: row.storage ?? undefined,
  ram: row.ram ?? undefined,
  weight: row.weight ?? undefined,
  mrp: Number(row.mrp),
  price: Number(row.price),
  stockQuantity: Number(row.stock_quantity || 0),
  imageUrl: row.image_url ?? undefined,
});

const mapProduct = (row: any, variants: any[] = [], images: any[] = []) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  slugBackup: row.slug_backup ?? undefined,
  sku: row.sku,
  shortDescription: row.short_description ?? undefined,
  description: row.description,
  categoryId: row.category_id,
  categoryName: row.category_name ?? undefined,
  categorySlug: row.category_slug ?? undefined,
  subcategoryId: row.subcategory_id ?? undefined,
  subcategoryName: row.subcategory_name ?? undefined,
  brandId: row.brand_id ?? undefined,
  brandName: row.brand_name || 'Generic',
  sellerId: row.seller_id,
  sellerStoreName: row.seller_store_name ?? undefined,
  mrp: Number(row.mrp),
  price: Number(row.price),
  discountPercent: Number(row.discount_percent || 0),
  taxPercent: Number(row.tax_percent || 0),
  stockQuantity: Number(row.stock_quantity || 0),
  thumbnailUrl: row.thumbnail_url,
  images,
  variants,
  rating: Number(row.rating || 0),
  ratingCount: Number(row.rating_count || 0),
  reviewCount: Number(row.review_count || 0),
  isActive: Boolean(row.is_active),
  isFeatured: Boolean(row.is_featured),
  isDealOfTheDay: Boolean(row.is_deal_of_the_day),
  approvalStatus: row.approval_status,
  warrantyInfo: row.warranty_info ?? undefined,
  returnPolicy: row.return_policy ?? undefined,
  deliveryInfo: row.delivery_info ?? undefined,
  specifications: parseArrayValue(row.specifications),
  tags: parseArrayValue(row.tags),
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

const loadCartItems = async (userId: string) => {
  const cartResult = await pool.query(
    `
    SELECT id, user_id
    FROM cart
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  const cart = cartResult.rows[0];

  if (!cart) {
    return [];
  }

  const itemResult = await pool.query(
    `
    SELECT
      ci.id,
      ci.cart_id,
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.created_at,
      ci.updated_at,

      p.id AS p_id,
      p.title AS p_title,
      p.slug AS p_slug,
      p.sku AS p_sku,
      p.short_description AS p_short_description,
      p.description AS p_description,
      p.category_id AS p_category_id,
      c.name AS p_category_name,
      c.slug AS p_category_slug,
      p.subcategory_id AS p_subcategory_id,
      sc.name AS p_subcategory_name,
      p.brand_id AS p_brand_id,
      COALESCE(b.name, p.brand_name) AS p_brand_name,
      p.seller_id AS p_seller_id,
      s.store_name AS p_seller_store_name,
      p.mrp AS p_mrp,
      p.price AS p_price,
      p.discount_percent AS p_discount_percent,
      p.tax_percent AS p_tax_percent,
      p.stock_quantity AS p_stock_quantity,
      p.thumbnail_url AS p_thumbnail_url,
      p.rating AS p_rating,
      p.rating_count AS p_rating_count,
      p.review_count AS p_review_count,
      p.is_active AS p_is_active,
      p.is_featured AS p_is_featured,
      p.is_deal_of_the_day AS p_is_deal_of_the_day,
      p.approval_status AS p_approval_status,
      p.warranty_info AS p_warranty_info,
      p.return_policy AS p_return_policy,
      p.delivery_info AS p_delivery_info,
      p.specifications AS p_specifications,
      p.tags AS p_tags,
      p.created_at AS p_created_at,
      p.updated_at AS p_updated_at

    FROM cart_items ci

    INNER JOIN products p
      ON p.id = ci.product_id

    LEFT JOIN categories c
      ON c.id = p.category_id

    LEFT JOIN subcategories sc
      ON sc.id = p.subcategory_id

    LEFT JOIN brands b
      ON b.id = p.brand_id

    LEFT JOIN sellers s
      ON s.id = p.seller_id

    WHERE ci.cart_id = $1
    ORDER BY ci.created_at ASC
    `,
    [cart.id]
  );

  if (itemResult.rows.length === 0) {
    return [];
  }

  const productIds = [
    ...new Set(itemResult.rows.map((row) => row.product_id)),
  ];

  const variantResult = await pool.query(
    `
    SELECT
      id,
      product_id,
      sku,
      variant_name,
      color,
      color_code,
      size,
      storage,
      ram,
      weight,
      mrp,
      price,
      stock_quantity,
      image_url
    FROM product_variants
    WHERE product_id = ANY($1::varchar[])
    ORDER BY created_at ASC
    `,
    [productIds]
  );

  const imageResult = await pool.query(
    `
    SELECT
      product_id,
      image_url,
      display_order
    FROM product_images
    WHERE product_id = ANY($1::varchar[])
    ORDER BY display_order ASC, created_at ASC
    `,
    [productIds]
  );

  const variantsByProduct = new Map<string, any[]>();

for (const row of variantResult.rows) {
  const list = variantsByProduct.get(row.product_id) || [];

  list.push({
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    variantName: row.variant_name,
    color: row.color ?? undefined,
    colorCode: row.color_code ?? undefined,
    size: row.size ?? undefined,
    storage: row.storage ?? undefined,
    ram: row.ram ?? undefined,
    weight: row.weight ?? undefined,
    mrp: Number(row.mrp),
    price: Number(row.price),
    stockQuantity: Number(row.stock_quantity || 0),
    imageUrl: row.image_url ?? undefined,
  });

  variantsByProduct.set(row.product_id, list);
}

  const imagesByProduct = new Map<string, string[]>();

  for (const row of imageResult.rows) {
    const list = imagesByProduct.get(row.product_id) || [];
    list.push(row.image_url);
    imagesByProduct.set(row.product_id, list);
  }

  return itemResult.rows.map((row) => {
    const product = mapProduct(
      {
        id: row.p_id,
        title: row.p_title,
        slug: row.p_slug,
        sku: row.p_sku,
        short_description: row.p_short_description,
        description: row.p_description,
        category_id: row.p_category_id,
        category_name: row.p_category_name,
        category_slug: row.p_category_slug,
        subcategory_id: row.p_subcategory_id,
        subcategory_name: row.p_subcategory_name,
        brand_id: row.p_brand_id,
        brand_name: row.p_brand_name,
        seller_id: row.p_seller_id,
        seller_store_name: row.p_seller_store_name,
        mrp: row.p_mrp,
        price: row.p_price,
        discount_percent: row.p_discount_percent,
        tax_percent: row.p_tax_percent,
        stock_quantity: row.p_stock_quantity,
        thumbnail_url: row.p_thumbnail_url,
        rating: row.p_rating,
        rating_count: row.p_rating_count,
        review_count: row.p_review_count,
        is_active: row.p_is_active,
        is_featured: row.p_is_featured,
        is_deal_of_the_day: row.p_is_deal_of_the_day,
        approval_status: row.p_approval_status,
        warranty_info: row.p_warranty_info,
        return_policy: row.p_return_policy,
        delivery_info: row.p_delivery_info,
        specifications: row.p_specifications,
        tags: row.p_tags,
        created_at: row.p_created_at,
        updated_at: row.p_updated_at,
      },
      variantsByProduct.get(row.product_id) || [],
      imagesByProduct.get(row.product_id) || []
    );

    const selectedVariant = row.variant_id
      ? variantsByProduct
          .get(row.product_id)
          ?.find((variant) => variant.id === row.variant_id)
      : undefined;

    return {
      id: row.id,
      cartId: row.cart_id,
      productId: row.product_id,
      variantId: row.variant_id ?? undefined,
      quantity: Number(row.quantity),
      createdAt: row.created_at
        ? new Date(row.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: row.updated_at
        ? new Date(row.updated_at).toISOString()
        : new Date().toISOString(),
      product,
      variant: selectedVariant
        ? mapVariant(selectedVariant)
        : undefined,
    };
  });
};

const buildCartResponse = async (userId: string) => {
  const items = await loadCartItems(userId);

  let totalMrp = 0;
  let totalSellingPrice = 0;

  for (const item of items) {
    const unitMrp = item.variant
      ? item.variant.mrp
      : item.product.mrp;

    const unitPrice = item.variant
      ? item.variant.price
      : item.product.price;

    totalMrp += unitMrp * item.quantity;
    totalSellingPrice += unitPrice * item.quantity;
  }

  const totalDiscount = Math.max(
    0,
    totalMrp - totalSellingPrice
  );

  const deliveryFee =
    totalSellingPrice >= 500 ||
    totalSellingPrice === 0
      ? 0
      : 40;

  const packagingFee =
    totalSellingPrice > 0
      ? 29
      : 0;

  const grandTotal =
    totalSellingPrice +
    deliveryFee +
    packagingFee;

  return {
    items,
    summary: {
      itemCount: items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      totalMrp,
      totalSellingPrice,
      totalDiscount,
      deliveryFee,
      packagingFee,
      grandTotal,
      isFreeDelivery:
        deliveryFee === 0 &&
        totalSellingPrice > 0,
    },
  };
};

export const getCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  try {
    const data = await buildCartResponse(req.user.id);

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(
      'Get cart error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load cart.',
    });
  }
};

export const addToCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const userId = req.user.id;
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required.',
    });
  }

  const qtyToAdd = Math.max(
    1,
    parseInt(String(quantity), 10) || 1
  );

  try {
    const stockCheck = await checkStockAvailability(
      productId,
      variantId,
      qtyToAdd
    );

    if (!stockCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          stockCheck.message ||
          'Requested item is out of stock.',
      });
    }

    const cart = await getOrCreateCart(userId);

    const existingResult = await pool.query(
      `
      SELECT id, quantity
      FROM cart_items
      WHERE cart_id = $1
        AND product_id = $2
        AND (
          variant_id = $3
          OR (
            variant_id IS NULL
            AND $3 IS NULL
          )
        )
      LIMIT 1
      `,
      [
        cart.id,
        productId,
        variantId ?? null,
      ]
    );

    if (existingResult.rows[0]) {
      const existing = existingResult.rows[0];
      const newQty =
        Number(existing.quantity) +
        qtyToAdd;

      const totalStockCheck =
        await checkStockAvailability(
          productId,
          variantId,
          newQty
        );

      if (!totalStockCheck.isAvailable) {
        return res.status(400).json({
          success: false,
          message:
            `Cannot add more. ${
              totalStockCheck.message || ''
            }`,
        });
      }

      await pool.query(
        `
        UPDATE cart_items
        SET
          quantity = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND cart_id = $3
        `,
        [
          newQty,
          existing.id,
          cart.id,
        ]
      );
    } else {
      await pool.query(
        `
        INSERT INTO cart_items (
          id,
          cart_id,
          product_id,
          variant_id,
          quantity
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        `,
        [
          `cartitem_${Date.now()}_${Math.floor(
            Math.random() * 100000
          )}`,
          cart.id,
          productId,
          variantId ?? null,
          qtyToAdd,
        ]
      );

      await pool.query(
        `
        UPDATE cart
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [cart.id]
      );
    }

    const data = await buildCartResponse(userId);

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(
      'Add to cart error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to add item to cart.',
    });
  }
};

export const updateCartItem = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const { id } = req.params;
  const targetQty = parseInt(
    String(req.body.quantity),
    10
  );

  try {
    const itemResult = await pool.query(
      `
      SELECT
        ci.id,
        ci.product_id,
        ci.variant_id,
        ci.quantity
      FROM cart_items ci
      INNER JOIN cart c
        ON c.id = ci.cart_id
      WHERE ci.id = $1
        AND c.user_id = $2
      LIMIT 1
      `,
      [id, req.user.id]
    );

    const item = itemResult.rows[0];

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    if (
      Number.isNaN(targetQty) ||
      targetQty <= 0
    ) {
      await pool.query(
        `
        DELETE FROM cart_items
        WHERE id = $1
        `,
        [id]
      );

      return getCart(req, res);
    }

    const stockCheck =
      await checkStockAvailability(
        item.product_id,
        item.variant_id ?? undefined,
        targetQty
      );

    if (!stockCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          stockCheck.message ||
          'Cannot increase quantity due to stock limits.',
      });
    }

    await pool.query(
      `
      UPDATE cart_items
      SET
        quantity = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [targetQty, id]
    );

    await pool.query(
      `
      UPDATE cart c
      SET updated_at = CURRENT_TIMESTAMP
      WHERE c.user_id = $1
      `,
      [req.user.id]
    );

    return getCart(req, res);
  } catch (error: any) {
    console.error(
      'Update cart item error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to update cart item.',
    });
  }
};

export const removeCartItem = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM cart_items ci
      USING cart c
      WHERE ci.id = $1
        AND ci.cart_id = c.id
        AND c.user_id = $2
      RETURNING ci.id
      `,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    return getCart(req, res);
  } catch (error: any) {
    console.error(
      'Remove cart item error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to remove cart item.',
    });
  }
};

export const clearCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  try {
    await pool.query(
      `
      DELETE FROM cart_items ci
      USING cart c
      WHERE ci.cart_id = c.id
        AND c.user_id = $1
      `,
      [req.user.id]
    );

    await pool.query(
      `
      UPDATE cart
      SET updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Cart cleared successfully.',
    });
  } catch (error: any) {
    console.error(
      'Clear cart error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to clear cart.',
    });
  }
};

export const syncGuestCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const { items = [] } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: 'Cart items must be an array.',
    });
  }

  const userId = req.user.id;

  try {
    const cart = await getOrCreateCart(userId);

    for (const item of items) {
      if (!item?.productId) {
        continue;
      }

      const productId = String(item.productId);
      const variantId = item.variantId
        ? String(item.variantId)
        : undefined;

      const requestedQty = Math.max(
        1,
        parseInt(String(item.quantity), 10) || 1
      );

      const stockCheck =
        await checkStockAvailability(
          productId,
          variantId,
          requestedQty
        );

      if (!stockCheck.isAvailable) {
        continue;
      }

      const existingResult = await pool.query(
        `
        SELECT id, quantity
        FROM cart_items
        WHERE cart_id = $1
          AND product_id = $2
          AND (
            variant_id = $3
            OR (
              variant_id IS NULL
              AND $3 IS NULL
            )
          )
        LIMIT 1
        `,
        [
          cart.id,
          productId,
          variantId ?? null,
        ]
      );

      if (existingResult.rows[0]) {
        const existing = existingResult.rows[0];

        const desiredQty = Math.max(
          Number(existing.quantity),
          requestedQty
        );

        const totalStockCheck =
          await checkStockAvailability(
            productId,
            variantId,
            desiredQty
          );

        if (totalStockCheck.isAvailable) {
          await pool.query(
            `
            UPDATE cart_items
            SET
              quantity = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
              desiredQty,
              existing.id,
            ]
          );
        }
      } else {
        await pool.query(
          `
          INSERT INTO cart_items (
            id,
            cart_id,
            product_id,
            variant_id,
            quantity
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          `,
          [
            `cartitem_${Date.now()}_${Math.floor(
              Math.random() * 100000
            )}`,
            cart.id,
            productId,
            variantId ?? null,
            requestedQty,
          ]
        );
      }
    }

    await pool.query(
      `
      UPDATE cart
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [cart.id]
    );

    return getCart(req, res);
  } catch (error: any) {
    console.error(
      'Sync guest cart error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to sync guest cart.',
    });
  }
};