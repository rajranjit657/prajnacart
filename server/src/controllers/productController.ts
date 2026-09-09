import { Request, Response } from 'express';
import { pool, dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Product, Review } from '../types/index.js';

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
  stockQuantity: Number(row.stock_quantity),
  imageUrl: row.image_url ?? undefined,
});

const mapReview = (row: any): Review => ({
  id: row.id,
  productId: row.product_id,
  userId: row.user_id,
  userName:
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    row.user_name ||
    'Customer',
  userAvatar: row.user_avatar ?? undefined,
  orderId: row.order_id ?? undefined,
  rating: Number(row.rating),
  title: row.title ?? undefined,
  comment: row.comment,
  isVerifiedPurchase: Boolean(row.is_verified_purchase),
  isApproved: Boolean(row.is_approved),
  helpfulVotes: Number(row.helpful_votes || 0),
  images: Array.isArray(row.images) ? row.images : undefined,
  createdAt: new Date(row.created_at).toISOString(),
});

const buildProductFromRow = (row: any, variants: any[] = [], images: any[] = []): Product => ({
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
  images: images.map((image) => image.imageUrl),
  variants: variants.map(mapVariant),
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
  specifications: Array.isArray(row.specifications)
    ? row.specifications
    : [],
  tags: Array.isArray(row.tags) ? row.tags : [],
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

const productBaseQuery = `
  SELECT
    p.id,
    p.title,
    p.slug,
    p.sku,
    p.short_description,
    p.description,
    p.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    p.subcategory_id,
    sc.name AS subcategory_name,
    p.brand_id,
    COALESCE(b.name, p.brand_name) AS brand_name,
    p.seller_id,
    s.store_name AS seller_store_name,
    p.mrp,
    p.price,
    p.discount_percent,
    p.tax_percent,
    p.stock_quantity,
    p.thumbnail_url,
    p.rating,
    p.rating_count,
    p.review_count,
    p.is_active,
    p.is_featured,
    p.is_deal_of_the_day,
    p.approval_status,
    p.warranty_info,
    p.return_policy,
    p.delivery_info,
    p.specifications,
    p.tags,
    p.created_at,
    p.updated_at
  FROM products p
  LEFT JOIN categories c
    ON c.id = p.category_id
  LEFT JOIN subcategories sc
    ON sc.id = p.subcategory_id
  LEFT JOIN brands b
    ON b.id = p.brand_id
  LEFT JOIN sellers s
    ON s.id = p.seller_id
`;

const loadProductRelations = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return {
      variantsByProduct: new Map<string, any[]>(),
      imagesByProduct: new Map<string, any[]>(),
    };
  }

  const [variantResult, imageResult] = await Promise.all([
    pool.query(
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
    ),

    pool.query(
      `
      SELECT
        id,
        product_id,
        image_url AS "imageUrl",
        alt_text,
        display_order,
        is_thumbnail
      FROM product_images
      WHERE product_id = ANY($1::varchar[])
      ORDER BY display_order ASC, created_at ASC
      `,
      [productIds]
    ),
  ]);

  const variantsByProduct = new Map<string, any[]>();
  for (const row of variantResult.rows) {
    const list = variantsByProduct.get(row.product_id) || [];
    list.push(row);
    variantsByProduct.set(row.product_id, list);
  }

  const imagesByProduct = new Map<string, any[]>();
  for (const row of imageResult.rows) {
    const list = imagesByProduct.get(row.product_id) || [];
    list.push(row);
    imagesByProduct.set(row.product_id, list);
  }

  return {
    variantsByProduct,
    imagesByProduct,
  };
};

export const getProducts = async (
  req: Request,
  res: Response
) => {
  const {
    q,
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    inStock,
    featured,
    dealOfTheDay,
    sortBy = 'relevance',
    page = '1',
    limit = '12',
  } = req.query;

  try {
    const conditions: string[] = [
      'p.is_active = TRUE',
      "p.approval_status = 'approved'",
    ];

    const params: any[] = [];

    if (q && typeof q === 'string' && q.trim()) {
      params.push(`%${q.trim()}%`);

      conditions.push(`
        (
          p.title ILIKE $${params.length}
          OR COALESCE(p.short_description, '') ILIKE $${params.length}
          OR COALESCE(p.description, '') ILIKE $${params.length}
          OR COALESCE(b.name, p.brand_name, '') ILIKE $${params.length}
          OR COALESCE(c.name, '') ILIKE $${params.length}
          OR EXISTS (
            SELECT 1
            FROM unnest(COALESCE(p.tags, '{}'::text[])) AS tag
            WHERE tag ILIKE $${params.length}
          )
        )
      `);
    }

    if (category && typeof category === 'string') {
      params.push(category);
      conditions.push(
        `(p.category_id = $${params.length} OR c.slug = $${params.length})`
      );
    }

    if (subcategory && typeof subcategory === 'string') {
      params.push(subcategory);
      conditions.push(
        `(p.subcategory_id = $${params.length} OR sc.slug = $${params.length})`
      );
    }

    if (brand && typeof brand === 'string') {
      const brandList = brand
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      if (brandList.length > 0) {
        params.push(brandList);
        conditions.push(`
          (
            LOWER(COALESCE(b.name, p.brand_name, '')) = ANY($${params.length}::text[])
            OR LOWER(p.brand_id) = ANY($${params.length}::text[])
          )
        `);
      }
    }

    if (minPrice) {
      const value = Number(minPrice);
      if (!Number.isNaN(value)) {
        params.push(value);
        conditions.push(`p.price >= $${params.length}`);
      }
    }

    if (maxPrice) {
      const value = Number(maxPrice);
      if (!Number.isNaN(value)) {
        params.push(value);
        conditions.push(`p.price <= $${params.length}`);
      }
    }

    if (minRating) {
      const value = Number(minRating);
      if (!Number.isNaN(value)) {
        params.push(value);
        conditions.push(`p.rating >= $${params.length}`);
      }
    }

    if (minDiscount) {
      const value = Number(minDiscount);
      if (!Number.isNaN(value)) {
        params.push(value);
        conditions.push(`p.discount_percent >= $${params.length}`);
      }
    }

    if (inStock === 'true') {
      conditions.push('p.stock_quantity > 0');
    }

    if (featured === 'true') {
      conditions.push('p.is_featured = TRUE');
    }

    if (dealOfTheDay === 'true') {
      conditions.push('p.is_deal_of_the_day = TRUE');
    }

    let orderBy = 'p.rating_count DESC, p.created_at DESC';

    switch (sortBy) {
      case 'price_asc':
        orderBy = 'p.price ASC, p.id ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC, p.id ASC';
        break;
      case 'rating':
        orderBy = 'p.rating DESC, p.rating_count DESC';
        break;
      case 'discount':
        orderBy = 'p.discount_percent DESC, p.rating_count DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'popularity':
      case 'relevance':
      default:
        break;
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      ${productBaseQuery.substring(productBaseQuery.indexOf('FROM'))}
      WHERE ${whereClause}
      `,
      params
    );

    const totalItems = Number(countResult.rows[0].total);

    const pageNum = Math.max(
      1,
      parseInt(String(page), 10) || 1
    );

    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(String(limit), 10) || 12)
    );

    const totalPages = Math.ceil(totalItems / limitNum);
    const offset = (pageNum - 1) * limitNum;

    const dataParams = [...params, limitNum, offset];

    const productsResult = await pool.query(
      `
      ${productBaseQuery}
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
      `,
      dataParams
    );

    const rows = productsResult.rows;

    const { variantsByProduct, imagesByProduct } =
      await loadProductRelations(rows.map((row) => row.id));

    const products = rows.map((row) =>
      buildProductFromRow(
        row,
        variantsByProduct.get(row.id) || [],
        imagesByProduct.get(row.id) || []
      )
    );

    const brandsResult = await pool.query(
      `
      SELECT DISTINCT COALESCE(b.name, p.brand_name) AS brand_name
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.is_active = TRUE
        AND p.approval_status = 'approved'
        AND COALESCE(b.name, p.brand_name) IS NOT NULL
        AND COALESCE(b.name, p.brand_name) <> ''
      ORDER BY brand_name ASC
      `
    );

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          totalItems,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        availableBrands: brandsResult.rows.map(
          (row) => row.brand_name
        ),
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to load products.',
    });
  }
};

export const getProductByIdOrSlug = async (
  req: Request,
  res: Response
) => {
  const { identifier } = req.params;

  try {
    const productResult = await pool.query(
      `
      ${productBaseQuery}
      WHERE (p.id = $1 OR p.slug = $1)
        AND p.is_active = TRUE
      LIMIT 1
      `,
      [identifier]
    );

    const row = productResult.rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or has been discontinued.',
      });
    }

    const {
      variantsByProduct,
      imagesByProduct,
    } = await loadProductRelations([row.id]);

    const product = buildProductFromRow(
      row,
      variantsByProduct.get(row.id) || [],
      imagesByProduct.get(row.id) || []
    );

    const [reviewResult, relatedResult] = await Promise.all([
      pool.query(
        `
        SELECT
          r.id,
          r.product_id,
          r.user_id,
          r.order_id,
          r.rating,
          r.title,
          r.comment,
          r.is_verified_purchase,
          r.is_approved,
          r.helpful_votes,
          r.created_at,
          p.first_name,
          p.last_name,
          u.avatar_url AS user_avatar
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        LEFT JOIN profiles p ON p.user_id = r.user_id
        WHERE r.product_id = $1
          AND r.is_approved = TRUE
        ORDER BY r.created_at DESC
        `,
        [row.id]
      ),

      pool.query(
        `
        ${productBaseQuery}
        WHERE p.category_id = $1
          AND p.id <> $2
          AND p.is_active = TRUE
          AND p.approval_status = 'approved'
        ORDER BY p.rating_count DESC, p.created_at DESC
        LIMIT 6
        `,
        [row.category_id, row.id]
      ),
    ]);

    const relatedRows = relatedResult.rows;

    const {
      variantsByProduct: relatedVariants,
      imagesByProduct: relatedImages,
    } = await loadProductRelations(
      relatedRows.map((related) => related.id)
    );

    const relatedProducts = relatedRows.map((related) =>
      buildProductFromRow(
        related,
        relatedVariants.get(related.id) || [],
        relatedImages.get(related.id) || []
      )
    );

    const reviews = reviewResult.rows.map(mapReview);

    return res.json({
      success: true,
      data: {
        ...product,
        sellerInfo: {
          id: row.seller_id,
          storeName:
            row.seller_store_name || 'Marketplace Seller',
          rating: Number(
            (
              await pool.query(
                `
                SELECT rating, rating_count
                FROM sellers
                WHERE id = $1
                LIMIT 1
                `,
                [row.seller_id]
              )
            ).rows[0]?.rating || 0
          ),
          ratingCount: Number(
            (
              await pool.query(
                `
                SELECT rating_count
                FROM sellers
                WHERE id = $1
                LIMIT 1
                `,
                [row.seller_id]
              )
            ).rows[0]?.rating_count || 0
          ),
        },
        reviews,
        relatedProducts,
      },
    });
  } catch (error: any) {
    console.error(
      'Get product details error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load product details.',
    });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  let sellerId = '';
  if (req.user.role === 'seller') {
    const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
    if (!seller || seller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your seller account must be approved before you can list products.',
      });
    }
    sellerId = seller.id;
  } else if (req.user.role === 'admin') {
    sellerId = req.body.sellerId || dbStore.sellers[0]?.id || 'seller_apex_01';
  }

  const {
    title,
    description,
    shortDescription,
    categoryId,
    subcategoryId,
    brandName,
    mrp,
    price,
    stockQuantity,
    thumbnailUrl,
    images = [],
    variants = [],
    specifications = [],
    tags = [],
    warrantyInfo,
    returnPolicy,
    deliveryInfo,
  } = req.body;

  if (!title || !description || !categoryId || !mrp || !price || !thumbnailUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields (title, description, category, MRP, Price, Thumbnail).',
    });
  }

  const numMrp = Number(mrp);
  const numPrice = Number(price);
  if (numPrice > numMrp) {
    return res.status(400).json({
      success: false,
      message: 'Selling price cannot exceed MRP.',
    });
  }

  const discountPercent = numMrp > 0 ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;
  const category = dbStore.categories.find(c => c.id === categoryId);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    title,
    slug,
    sku: req.body.sku || `SKU-${Date.now().toString().slice(-6)}`,
    shortDescription: shortDescription || '',
    description,
    categoryId,
    categoryName: category?.name || 'General',
    categorySlug: category?.slug || 'general',
    subcategoryId: subcategoryId || undefined,
    brandName: brandName || 'Generic',
    sellerId,
    sellerStoreName: dbStore.sellers.find(s => s.id === sellerId)?.storeName || 'Marketplace Seller',
    mrp: numMrp,
    price: numPrice,
    discountPercent,
    taxPercent: 18,
    stockQuantity: Number(stockQuantity) || 0,
    thumbnailUrl,
    images: images.length > 0 ? images : [thumbnailUrl],
    variants,
    rating: 5.0,
    ratingCount: 0,
    reviewCount: 0,
    isActive: true,
    isFeatured: Boolean(req.body.isFeatured),
    isDealOfTheDay: Boolean(req.body.isDealOfTheDay),
    approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending',
    warrantyInfo: warrantyInfo || '1 Year Manufacturer Warranty',
    returnPolicy: returnPolicy || '7 Days Replacement Policy',
    deliveryInfo: deliveryInfo || 'Free Delivery Available',
    specifications: specifications || [],
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.products.unshift(newProduct);

  return res.status(201).json({
    success: true,
    message: req.user.role === 'admin'
      ? 'Product created and published successfully!'
      : 'Product submitted for review! It will be live once approved by admin.',
    data: newProduct,
  });
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const product = dbStore.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  // Role check: Seller can only edit their own products
  if (req.user?.role === 'seller') {
    const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit products listed by your store.',
      });
    }
  }

  const fields = req.body;
  if (fields.title) product.title = fields.title;
  if (fields.description) product.description = fields.description;
  if (fields.shortDescription) product.shortDescription = fields.shortDescription;
  if (fields.thumbnailUrl) product.thumbnailUrl = fields.thumbnailUrl;
  if (fields.images) product.images = fields.images;
  if (fields.mrp) product.mrp = Number(fields.mrp);
  if (fields.price) product.price = Number(fields.price);
  if (fields.stockQuantity !== undefined) product.stockQuantity = Number(fields.stockQuantity);
  if (fields.specifications) product.specifications = fields.specifications;
  if (fields.variants) product.variants = fields.variants;
  if (fields.isActive !== undefined) product.isActive = Boolean(fields.isActive);
  if (fields.isFeatured !== undefined && req.user?.role === 'admin') product.isFeatured = Boolean(fields.isFeatured);
  if (fields.isDealOfTheDay !== undefined && req.user?.role === 'admin') product.isDealOfTheDay = Boolean(fields.isDealOfTheDay);

  if (product.mrp > 0 && product.price > 0) {
    product.discountPercent = Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100));
  }
  product.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Product updated successfully!',
    data: product,
  });
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = dbStore.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const product = dbStore.products[index];
  if (req.user?.role === 'seller') {
    const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own products.',
      });
    }
  }

  dbStore.products.splice(index, 1);
  return res.json({
    success: true,
    message: 'Product listing removed successfully.',
  });
};
