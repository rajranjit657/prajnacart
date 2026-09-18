import { Request, Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Coupon } from '../types/index.js';

const mapCoupon = (row: any): Coupon => ({
  id: row.id,
  code: row.code,
  description: row.description ?? '',
  discountType: row.discount_type,
  discountValue: Number(row.discount_value),
  minOrderValue: Number(row.min_order_value || 0),
  maxDiscountValue:
    row.max_discount_value !== null &&
    row.max_discount_value !== undefined
      ? Number(row.max_discount_value)
      : undefined,
  usageLimit: Number(row.usage_limit || 0),
  usedCount: Number(row.used_count || 0),
  perUserLimit: Number(row.per_user_limit || 1),
  startDate: row.start_date
    ? new Date(row.start_date).toISOString()
    : undefined,
  endDate: row.end_date
    ? new Date(row.end_date).toISOString()
    : undefined,
  isActive: Boolean(row.is_active),
});

// ============================================================
// VALIDATE COUPON
// ============================================================

export const validateCoupon = async (
  req: Request,
  res: Response
) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required.',
    });
  }

  const amount = Math.max(
    0,
    Number(orderAmount) || 0
  );

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND is_active = TRUE
      LIMIT 1
      `,
      [String(code).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Invalid coupon code. Please verify and try again.',
      });
    }

    const coupon = mapCoupon(result.rows[0]);

    if (amount < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${coupon.code}' requires a minimum order value of ₹${coupon.minOrderValue.toLocaleString(
          'en-IN'
        )}.`,
      });
    }

    let discount = 0;

    if (coupon.discountType === 'percentage') {
      discount = Math.round(
        (amount * coupon.discountValue) / 100
      );

      if (
        coupon.maxDiscountValue !== undefined &&
        discount > coupon.maxDiscountValue
      ) {
        discount = coupon.maxDiscountValue;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(
      Math.max(0, discount),
      amount
    );

    return res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully! You saved ₹${discount.toLocaleString(
        'en-IN'
      )}.`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        description: coupon.description,
      },
    });
  } catch (error: any) {
    console.error(
      'Validate coupon error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to validate coupon.',
    });
  }
};

// ============================================================
// GET ACTIVE COUPONS
// ============================================================

export const getCoupons = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM coupons
      WHERE is_active = TRUE
      ORDER BY created_at DESC
      `
    );

    return res.json({
      success: true,
      data: result.rows.map(mapCoupon),
    });
  } catch (error: any) {
    console.error(
      'Get coupons error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load coupons.',
    });
  }
};

// ============================================================
// CREATE COUPON - ADMIN
// ============================================================

export const createCoupon = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const {
    code,
    description,
    discountType = 'percentage',
    discountValue,
    minOrderValue = 0,
    maxDiscountValue,
    usageLimit = 1000,
    perUserLimit = 1,
    startDate,
    endDate,
  } = req.body;

  if (!code || discountValue === undefined) {
    return res.status(400).json({
      success: false,
      message:
        'Coupon code and discount value are required.',
    });
  }

  const normalizedCode = String(code)
    .trim()
    .toUpperCase();

  const numericDiscount = Number(
    discountValue
  );

  if (
    !normalizedCode ||
    Number.isNaN(numericDiscount) ||
    numericDiscount < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Coupon code and discount value are invalid.',
    });
  }

  try {
    const existing = await pool.query(
      `
      SELECT id
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
      LIMIT 1
      `,
      [normalizedCode]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'A coupon with this code already exists.',
      });
    }

    const couponId =
      `c_${Date.now()}_${Math.floor(
        Math.random() * 100000
      )}`;

    const couponDescription =
      description ||
      `Get ${numericDiscount}${
        discountType === 'percentage'
          ? '%'
          : ' INR'
      } off`;

    const result = await pool.query(
      `
      INSERT INTO coupons (
        id,
        code,
        description,
        discount_type,
        discount_value,
        min_order_value,
        max_discount_value,
        usage_limit,
        used_count,
        per_user_limit,
        start_date,
        end_date,
        is_active
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        0,
        $9,
        $10,
        $11,
        TRUE
      )
      RETURNING *
      `,
      [
        couponId,
        normalizedCode,
        couponDescription,
        discountType,
        numericDiscount,
        Number(minOrderValue) || 0,
        maxDiscountValue !== undefined &&
        maxDiscountValue !== null &&
        maxDiscountValue !== ''
          ? Number(maxDiscountValue)
          : null,
        Number(usageLimit) || 1000,
        Number(perUserLimit) || 1,
        startDate
          ? new Date(startDate)
          : null,
        endDate
          ? new Date(endDate)
          : null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully!',
      data: mapCoupon(result.rows[0]),
    });
  } catch (error: any) {
    console.error(
      'Create coupon error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to create coupon.',
    });
  }
};

// ============================================================
// DELETE COUPON - ADMIN
// ============================================================

export const deleteCoupon = async (
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

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Coupon ID is required.',
    });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM coupons
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Coupon deleted successfully.',
    });
  } catch (error: any) {
    console.error(
      'Delete coupon error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to delete coupon.',
    });
  }
};