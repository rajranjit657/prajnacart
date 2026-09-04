import { Request, Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Product } from '../types/index.js';

export const getProducts = async (req: Request, res: Response) => {
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

  let filtered = dbStore.products.filter(p => p.isActive && p.approvalStatus === 'approved');

  // Search Query
  if (q && typeof q === 'string') {
    const searchTerms = q.toLowerCase().trim().split(/\s+/);
    filtered = filtered.filter(p => {
      const matchString = `${p.title} ${p.shortDescription || ''} ${p.brandName} ${p.categoryName || ''} ${p.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => matchString.includes(term));
    });
  }

  // Category filter (slug or id)
  if (category && typeof category === 'string') {
    filtered = filtered.filter(p => p.categoryId === category || p.categorySlug === category);
  }

  // Subcategory filter
  if (subcategory && typeof subcategory === 'string') {
    filtered = filtered.filter(p => p.subcategoryId === subcategory);
  }

  // Brand filter (multiple brands support: brand=apple,samsung)
  if (brand && typeof brand === 'string') {
    const brandList = brand.toLowerCase().split(',');
    filtered = filtered.filter(p => brandList.includes(p.brandName.toLowerCase()) || (p.brandId && brandList.includes(p.brandId)));
  }

  // Price range filter
  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) filtered = filtered.filter(p => p.price >= min);
  }
  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) filtered = filtered.filter(p => p.price <= max);
  }

  // Rating filter
  if (minRating) {
    const r = Number(minRating);
    if (!isNaN(r)) filtered = filtered.filter(p => p.rating >= r);
  }

  // Discount percentage filter
  if (minDiscount) {
    const d = Number(minDiscount);
    if (!isNaN(d)) filtered = filtered.filter(p => p.discountPercent >= d);
  }

  // In-stock only
  if (inStock === 'true') {
    filtered = filtered.filter(p => p.stockQuantity > 0);
  }

  // Featured / Deal filters
  if (featured === 'true') {
    filtered = filtered.filter(p => p.isFeatured);
  }
  if (dealOfTheDay === 'true') {
    filtered = filtered.filter(p => p.isDealOfTheDay);
  }

  // Sorting
  switch (sortBy) {
    case 'price_asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
      break;
    case 'discount':
      filtered.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popularity':
    default:
      filtered.sort((a, b) => b.ratingCount - a.ratingCount);
      break;
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limitNum);
  const offset = (pageNum - 1) * limitNum;
  const paginatedProducts = filtered.slice(offset, offset + limitNum);

  // Available brands in the current filter context for faceted search UI
  const availableBrands = Array.from(new Set(dbStore.products.map(p => p.brandName))).filter(Boolean);

  return res.json({
    success: true,
    data: {
      products: paginatedProducts,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      availableBrands,
    },
  });
};

export const getProductByIdOrSlug = async (req: Request, res: Response) => {
  const { identifier } = req.params;

  const product = dbStore.products.find(
    p => (p.id === identifier || p.slug === identifier) && p.isActive
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found or has been discontinued.',
    });
  }

  // Fetch reviews for this product
  const reviews = dbStore.reviews.filter(r => r.productId === product.id);

  // Fetch related products in the same category
  const relatedProducts = dbStore.products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.isActive)
    .slice(0, 6);

  // Fetch seller info
  const seller = dbStore.sellers.find(s => s.id === product.sellerId);

  return res.json({
    success: true,
    data: {
      ...product,
      sellerInfo: seller ? {
        id: seller.id,
        storeName: seller.storeName,
        rating: seller.rating,
        ratingCount: seller.ratingCount,
      } : undefined,
      reviews,
      relatedProducts,
    },
  });
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
