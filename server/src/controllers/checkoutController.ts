import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { checkStockAvailability } from '../services/inventoryService.js';

export const validateCheckout = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { items = [], couponCode, addressId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty for checkout.' });
  }

  // Validate address if provided
  let address = null;
  if (addressId) {
    address = dbStore.addresses.find(a => a.id === addressId && a.userId === req.user!.id);
    if (!address) {
      return res.status(400).json({ success: false, message: 'Selected delivery address is invalid.' });
    }
  }

  // Calculate pricing strictly from server database records
  let totalMrp = 0;
  let totalSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = dbStore.products.find(p => p.id === item.productId && p.isActive);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product ID '${item.productId}' is unavailable or inactive.`,
      });
    }

    const variant = item.variantId ? product.variants?.find(v => v.id === item.variantId) : undefined;
    const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

    // Stock check
    const stockCheck = await checkStockAvailability(
  product.id,
  item.variantId,
  requestedQty
);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `${product.title}: ${stockCheck.message}`,
      });
    }

    const unitMrp = variant ? variant.mrp : product.mrp;
    const unitPrice = variant ? variant.price : product.price;
    const itemTotal = unitPrice * requestedQty;

    totalMrp += unitMrp * requestedQty;
    totalSubtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      variantId: variant?.id,
      sellerId: product.sellerId,
      productTitle: product.title,
      variantName: variant?.variantName,
      thumbnailUrl: variant?.imageUrl || product.thumbnailUrl,
      unitMrp,
      unitPrice,
      quantity: requestedQty,
      totalPrice: itemTotal,
    });
  }

  // Delivery fee logic
  const deliveryFee = totalSubtotal >= 500 ? 0 : 40;
  const packagingFee = 29;

  // Coupon discount calculation
  let couponDiscount = 0;
  let validCoupon = null;

  if (couponCode) {
    const coupon = dbStore.coupons.find(
      c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
    );
    if (coupon && totalSubtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = Math.round((totalSubtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountValue && couponDiscount > coupon.maxDiscountValue) {
          couponDiscount = coupon.maxDiscountValue;
        }
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, totalSubtotal);
      validCoupon = coupon;
    }
  }

  const grandTotal = Math.max(0, totalSubtotal - couponDiscount + deliveryFee + packagingFee);
  const isCodAvailable = grandTotal <= 50000; // COD limit in India

  return res.json({
    success: true,
    data: {
      items: verifiedItems,
      pricing: {
        totalMrp,
        totalSubtotal,
        discountOnMrp: Math.max(0, totalMrp - totalSubtotal),
        couponDiscount,
        couponCode: validCoupon?.code,
        deliveryFee,
        packagingFee,
        grandTotal,
        isFreeDelivery: deliveryFee === 0,
        isCodAvailable,
      },
      shippingAddress: address,
    },
  });
};
