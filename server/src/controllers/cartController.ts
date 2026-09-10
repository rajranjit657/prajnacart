import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { CartItem } from '../types/index.js';
import { checkStockAvailability } from '../services/inventoryService.js';

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const userCartItems = dbStore.cartItems.filter(item => item.cartId === userId);

  // Populate product & variant details and compute totals
  const items = userCartItems.map(item => {
    const product = dbStore.products.find(p => p.id === item.productId);
    const variant = product?.variants?.find(v => v.id === item.variantId);
    return {
      ...item,
      product,
      variant,
    };
  }).filter(item => Boolean(item.product));

  // Compute pricing totals
  let totalMrp = 0;
  let totalSellingPrice = 0;

  for (const item of items) {
    const unitMrp = item.variant ? item.variant.mrp : item.product!.mrp;
    const unitPrice = item.variant ? item.variant.price : item.product!.price;
    totalMrp += unitMrp * item.quantity;
    totalSellingPrice += unitPrice * item.quantity;
  }

  const totalDiscount = Math.max(0, totalMrp - totalSellingPrice);
  const deliveryFee = totalSellingPrice >= 500 || totalSellingPrice === 0 ? 0 : 40;
  const packagingFee = totalSellingPrice > 0 ? 29 : 0;
  const grandTotal = totalSellingPrice + deliveryFee + packagingFee;

  return res.json({
    success: true,
    data: {
      items,
      summary: {
        itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
        totalMrp,
        totalSellingPrice,
        totalDiscount,
        deliveryFee,
        packagingFee,
        grandTotal,
        isFreeDelivery: deliveryFee === 0 && totalSellingPrice > 0,
      },
    },
  });
};

export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

  // Validate stock
  const stockCheck = await checkStockAvailability(productId, variantId, qtyToAdd);
  if (!stockCheck.isAvailable) {
    return res.status(400).json({
      success: false,
      message: stockCheck.message || 'Requested item is out of stock.',
    });
  }

  // Check if item already exists in user cart
  const existingIndex = dbStore.cartItems.findIndex(
    item => item.cartId === userId && item.productId === productId && item.variantId === (variantId || undefined)
  );

  if (existingIndex > -1) {
    const existing = dbStore.cartItems[existingIndex];
    const newQty = existing.quantity + qtyToAdd;
    const totalStockCheck = await checkStockAvailability(productId, variantId, newQty);
    if (!totalStockCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Cannot add more. ${totalStockCheck.message}`,
      });
    }
    existing.quantity = newQty;
  } else {
    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      cartId: userId,
      productId,
      variantId: variantId || undefined,
      quantity: qtyToAdd,
      createdAt: new Date().toISOString(),
    };
    dbStore.cartItems.push(newItem);
  }

  return getCart(req, res);
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  const { quantity } = req.body;
  const targetQty = parseInt(quantity, 10);

  const cartItem = dbStore.cartItems.find(item => item.id === id && item.cartId === req.user!.id);
  if (!cartItem) {
    return res.status(404).json({ success: false, message: 'Cart item not found.' });
  }

  if (targetQty <= 0) {
    dbStore.cartItems = dbStore.cartItems.filter(item => item.id !== id);
    return getCart(req, res);
  }

  const stockCheck = await checkStockAvailability(
  cartItem.productId,
  cartItem.variantId,
  targetQty
);
  if (!stockCheck.isAvailable) {
    return res.status(400).json({
      success: false,
      message: stockCheck.message || 'Cannot increase quantity due to stock limits.',
    });
  }

  cartItem.quantity = targetQty;
  return getCart(req, res);
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  dbStore.cartItems = dbStore.cartItems.filter(item => !(item.id === id && item.cartId === req.user!.id));
  return getCart(req, res);
};

export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  dbStore.cartItems = dbStore.cartItems.filter(item => item.cartId !== req.user!.id);
  return res.json({ success: true, message: 'Cart cleared successfully.' });
};

// Sync Guest Cart into User Account after Login
export const syncGuestCart = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { items = [] } = req.body;
  const userId = req.user.id;

  for (const item of items) {
    if (!item.productId) continue;
    const existing = dbStore.cartItems.find(
      ci => ci.cartId === userId && ci.productId === item.productId && ci.variantId === (item.variantId || undefined)
    );

    if (existing) {
      existing.quantity = Math.max(existing.quantity, item.quantity || 1);
    } else {
      dbStore.cartItems.push({
        id: `cart_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        cartId: userId,
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity || 1,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return getCart(req, res);
};
