import { Request, Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Coupon } from '../types/index.js';

export const validateCoupon = async (req: Request, res: Response) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required.' });
  }

  const amount = Number(orderAmount) || 0;
  const coupon = dbStore.coupons.find(
    c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
  );

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Invalid coupon code. Please verify and try again.',
    });
  }

  if (amount < coupon.minOrderValue) {
    return res.status(400).json({
      success: false,
      message: `Coupon '${coupon.code}' requires a minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}.`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((amount * coupon.discountValue) / 100);
    if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
      discount = coupon.maxDiscountValue;
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, amount);

  return res.json({
    success: true,
    message: `Coupon '${coupon.code}' applied successfully! You saved ₹${discount.toLocaleString('en-IN')}.`,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      description: coupon.description,
    },
  });
};

export const getCoupons = async (req: Request, res: Response) => {
  const activeCoupons = dbStore.coupons.filter(c => c.isActive);
  return res.json({ success: true, data: activeCoupons });
};

// Admin Coupon Management
export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
  const {
    code,
    description,
    discountType = 'percentage',
    discountValue,
    minOrderValue = 0,
    maxDiscountValue,
    usageLimit = 1000,
    perUserLimit = 1,
  } = req.body;

  if (!code || !discountValue) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code and discount value are required.',
    });
  }

  const existing = dbStore.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
  }

  const newCoupon: Coupon = {
    id: `c_${Date.now()}`,
    code: code.toUpperCase(),
    description: description || `Get ${discountValue}${discountType === 'percentage' ? '%' : ' INR'} off`,
    discountType,
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue),
    maxDiscountValue: maxDiscountValue ? Number(maxDiscountValue) : undefined,
    usageLimit: Number(usageLimit),
    usedCount: 0,
    perUserLimit: Number(perUserLimit),
    isActive: true,
  };

  dbStore.coupons.push(newCoupon);
  return res.status(201).json({ success: true, message: 'Coupon created successfully!', data: newCoupon });
};

export const deleteCoupon = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = dbStore.coupons.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  dbStore.coupons.splice(idx, 1);
  return res.json({ success: true, message: 'Coupon deleted successfully.' });
};
