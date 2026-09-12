import { Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { checkStockAvailability } from '../services/inventoryService.js';

const getOrCreateWishlist = async (userId: string) => {
  const existing = await pool.query(
    `
    SELECT id, user_id, created_at
    FROM wishlists
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const wishlistId = `wishlist_${userId}`;

  const created = await pool.query(
    `
    INSERT INTO wishlists (
      id,
      user_id
    )
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING id, user_id, created_at
    `,
    [wishlistId, userId]
  );

  return created.rows[0];
};

const loadWishlistItems = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      wi.id,
      wi.wishlist_id,
      wi.product_id,
      wi.created_at,

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
      p.updated_at AS p_updated_at,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', pv.id,
              'productId', pv.product_id,
              'sku', pv.sku,
              'variantName', pv.variant_name,
              'color', pv.color,
              'colorCode', pv.color_code,
              'size', pv.size,
              'storage', pv.storage,
              'ram', pv.ram,
              'weight', pv.weight,
              'mrp', pv.mrp,
              'price', pv.price,
              'stockQuantity', pv.stock_quantity,
              'imageUrl', pv.image_url
            )
            ORDER BY pv.created_at
          )
          FROM product_variants pv
          WHERE pv.product_id = p.id
        ),
        '[]'::json
      ) AS variants,

      COALESCE(
        (
          SELECT json_agg(
            pi.image_url
            ORDER BY pi.display_order, pi.created_at
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        ),
        '[]'::json
      ) AS images

    FROM wishlist_items wi

    INNER JOIN wishlists w
      ON w.id = wi.wishlist_id

    INNER JOIN products p
      ON p.id = wi.product_id

    LEFT JOIN categories c
      ON c.id = p.category_id

    LEFT JOIN subcategories sc
      ON sc.id = p.subcategory_id

    LEFT JOIN brands b
      ON b.id = p.brand_id

    LEFT JOIN sellers s
      ON s.id = p.seller_id

    WHERE w.user_id = $1
    ORDER BY wi.created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    wishlistId: row.wishlist_id,
    productId: row.product_id,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString(),

    product: {
      id: row.p_id,
      title: row.p_title,
      slug: row.p_slug,
      sku: row.p_sku,
      shortDescription: row.p_short_description ?? undefined,
      description: row.p_description,
      categoryId: row.p_category_id,
      categoryName: row.p_category_name ?? undefined,
      categorySlug: row.p_category_slug ?? undefined,
      subcategoryId: row.p_subcategory_id ?? undefined,
      subcategoryName: row.p_subcategory_name ?? undefined,
      brandId: row.p_brand_id ?? undefined,
      brandName: row.p_brand_name || 'Generic',
      sellerId: row.p_seller_id,
      sellerStoreName: row.p_seller_store_name ?? undefined,
      mrp: Number(row.p_mrp),
      price: Number(row.p_price),
      discountPercent: Number(row.p_discount_percent || 0),
      taxPercent: Number(row.p_tax_percent || 0),
      stockQuantity: Number(row.p_stock_quantity || 0),
      thumbnailUrl: row.p_thumbnail_url,
      images: Array.isArray(row.images) ? row.images : [],
      variants: Array.isArray(row.variants) ? row.variants : [],
      rating: Number(row.p_rating || 0),
      ratingCount: Number(row.p_rating_count || 0),
      reviewCount: Number(row.p_review_count || 0),
      isActive: Boolean(row.p_is_active),
      isFeatured: Boolean(row.p_is_featured),
      isDealOfTheDay: Boolean(row.p_is_deal_of_the_day),
      approvalStatus: row.p_approval_status,
      warrantyInfo: row.p_warranty_info ?? undefined,
      returnPolicy: row.p_return_policy ?? undefined,
      deliveryInfo: row.p_delivery_info ?? undefined,
      specifications: row.p_specifications ?? [],
      tags: row.p_tags ?? [],
      createdAt: new Date(row.p_created_at).toISOString(),
      updatedAt: new Date(row.p_updated_at).toISOString(),
    },
  }));
};

export const getWishlist = async (
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
    const items = await loadWishlistItems(req.user.id);

    return res.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error(
      'Get wishlist error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load wishlist.',
    });
  }
};

export const toggleWishlist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required.',
    });
  }

  try {
    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [productId]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive.',
      });
    }

    const wishlist = await getOrCreateWishlist(
      req.user.id
    );

    const existingResult = await pool.query(
      `
      SELECT id
      FROM wishlist_items
      WHERE wishlist_id = $1
        AND product_id = $2
      LIMIT 1
      `,
      [wishlist.id, productId]
    );

    if (existingResult.rows[0]) {
      await pool.query(
        `
        DELETE FROM wishlist_items
        WHERE id = $1
        `,
        [existingResult.rows[0].id]
      );

      return res.json({
        success: true,
        message: 'Item removed from wishlist',
        data: {
          isAdded: false,
        },
      });
    }

    await pool.query(
      `
      INSERT INTO wishlist_items (
        id,
        wishlist_id,
        product_id
      )
      VALUES ($1, $2, $3)
      `,
      [
        `wsh_${Date.now()}_${Math.floor(
          Math.random() * 100000
        )}`,
        wishlist.id,
        productId,
      ]
    );

    return res.json({
      success: true,
      message: 'Item added to wishlist',
      data: {
        isAdded: true,
      },
    });
  } catch (error: any) {
    console.error(
      'Toggle wishlist error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to update wishlist.',
    });
  }
};

export const moveToCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const { productId, variantId } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required.',
    });
  }

  try {
    const wishlist = await getOrCreateWishlist(
      req.user.id
    );

    const wishlistItemResult = await pool.query(
      `
      SELECT id
      FROM wishlist_items
      WHERE wishlist_id = $1
        AND product_id = $2
      LIMIT 1
      `,
      [wishlist.id, productId]
    );

    if (wishlistItemResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found.',
      });
    }

    const stockCheck =
      await checkStockAvailability(
        productId,
        variantId || undefined,
        1
      );

    if (!stockCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          stockCheck.message ||
          'Requested item is out of stock.',
      });
    }

    const cartResult = await pool.query(
      `
      SELECT id
      FROM cart
      WHERE user_id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    let cart = cartResult.rows[0];

    if (!cart) {
      const createdCart = await pool.query(
        `
        INSERT INTO cart (
          id,
          user_id
        )
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id
        `,
        [
          `cart_${req.user.id}`,
          req.user.id,
        ]
      );

      cart = createdCart.rows[0];
    }

    const existingCartItem = await pool.query(
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
        variantId || null,
      ]
    );

    if (existingCartItem.rows[0]) {
      const newQuantity =
        Number(existingCartItem.rows[0].quantity) + 1;

      const quantityStockCheck =
        await checkStockAvailability(
          productId,
          variantId || undefined,
          newQuantity
        );

      if (!quantityStockCheck.isAvailable) {
        return res.status(400).json({
          success: false,
          message:
            quantityStockCheck.message ||
            'Cannot increase cart quantity.',
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
        [
          newQuantity,
          existingCartItem.rows[0].id,
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
        VALUES ($1, $2, $3, $4, 1)
        `,
        [
          `cartitem_${Date.now()}_${Math.floor(
            Math.random() * 100000
          )}`,
          cart.id,
          productId,
          variantId || null,
        ]
      );
    }

    await pool.query(
      `
      DELETE FROM wishlist_items
      WHERE id = $1
      `,
      [wishlistItemResult.rows[0].id]
    );

    await pool.query(
      `
      UPDATE cart
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [cart.id]
    );

    return res.json({
      success: true,
      message: 'Item moved from wishlist to cart!',
    });
  } catch (error: any) {
    console.error(
      'Move wishlist item to cart error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to move wishlist item to cart.',
    });
  }
};