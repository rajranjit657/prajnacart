import { Request, Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Category, Banner } from '../types/index.js';

export const getCategories = async (req: Request, res: Response) => {
  const categories = dbStore.categories
    .filter(c => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return res.json({
    success: true,
    data: categories,
  });
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = dbStore.categories.find(c => c.slug === slug && c.isActive);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const products = dbStore.products.filter(p => p.categoryId === category.id && p.isActive);

  return res.json({
    success: true,
    data: {
      category,
      products,
    },
  });
};

export const getBanners = async (req: Request, res: Response) => {
  const banners = dbStore.banners
    .filter(b => b.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return res.json({
    success: true,
    data: banners,
  });
};

// Admin Category Management
export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, imageUrl, iconName, displayOrder } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name,
    slug,
    description: description || '',
    imageUrl: imageUrl || '',
    iconName: iconName || 'Tag',
    displayOrder: Number(displayOrder) || dbStore.categories.length + 1,
    isActive: true,
    subcategories: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.categories.push(newCat);
  return res.status(201).json({ success: true, message: 'Category created successfully!', data: newCat });
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const category = dbStore.categories.find(c => c.id === id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const { name, description, imageUrl, iconName, displayOrder, isActive, subcategories } = req.body;
  if (name) {
    category.name = name;
    category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (description !== undefined) category.description = description;
  if (imageUrl !== undefined) category.imageUrl = imageUrl;
  if (iconName !== undefined) category.iconName = iconName;
  if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
  if (isActive !== undefined) category.isActive = Boolean(isActive);
  if (subcategories) category.subcategories = subcategories;
  category.updatedAt = new Date().toISOString();

  return res.json({ success: true, message: 'Category updated successfully!', data: category });
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = dbStore.categories.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  dbStore.categories.splice(idx, 1);
  return res.json({ success: true, message: 'Category removed successfully.' });
};
