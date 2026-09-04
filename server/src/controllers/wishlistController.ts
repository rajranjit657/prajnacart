import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { WishlistItem } from '../types/index.js';

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const userItems = dbStore.wishlistItems.filter(item => item.wishlistId === userId);

  const items = userItems.map(item => {
    const product = dbStore.products.find(p => p.id === item.productId);
    return {
      ...item,
      product,
    };
  }).filter(item => Boolean(item.product));

  return res.json({
    success: true,
    data: items,
  });
};

export const toggleWishlist = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  const existingIndex = dbStore.wishlistItems.findIndex(
    item => item.wishlistId === userId && item.productId === productId
  );

  let isAdded = false;
  if (existingIndex > -1) {
    dbStore.wishlistItems.splice(existingIndex, 1);
    isAdded = false;
  } else {
    const newItem: WishlistItem = {
      id: `wsh_${Date.now()}`,
      wishlistId: userId,
      productId,
      createdAt: new Date().toISOString(),
    };
    dbStore.wishlistItems.push(newItem);
    isAdded = true;
  }

  return res.json({
    success: true,
    message: isAdded ? 'Item added to wishlist' : 'Item removed from wishlist',
    data: { isAdded },
  });
};

export const moveToCart = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const { productId, variantId } = req.body;

  // Remove from wishlist
  dbStore.wishlistItems = dbStore.wishlistItems.filter(
    item => !(item.wishlistId === userId && item.productId === productId)
  );

  // Add to cart
  const existingCartItem = dbStore.cartItems.find(
    item => item.cartId === userId && item.productId === productId && item.variantId === (variantId || undefined)
  );

  if (existingCartItem) {
    existingCartItem.quantity += 1;
  } else {
    dbStore.cartItems.push({
      id: `cart_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      cartId: userId,
      productId,
      variantId: variantId || undefined,
      quantity: 1,
      createdAt: new Date().toISOString(),
    });
  }

  return res.json({
    success: true,
    message: 'Item moved from wishlist to cart!',
  });
};
