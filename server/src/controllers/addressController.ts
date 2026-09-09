import { Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Address } from '../types/index.js';

const mapAddress = (row: any): Address => ({
  id: row.id,
  userId: row.user_id,
  fullName: row.full_name,
  phone: row.phone,
  alternatePhone: row.alternate_phone ?? undefined,
  addressLine1: row.address_line1,
  addressLine2: row.address_line2 ?? undefined,
  landmark: row.landmark ?? undefined,
  city: row.city,
  state: row.state,
  postalCode: row.postal_code,
  country: row.country || 'India',
  addressType: row.address_type || 'home',
  isDefault: Boolean(row.is_default),
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

export const getAddresses = async (
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
    const result = await pool.query(
      `
      SELECT *
      FROM addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at ASC
      `,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: result.rows.map(mapAddress),
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load addresses.',
    });
  }
};

export const addAddress = async (
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
    fullName,
    phone,
    alternatePhone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    postalCode,
    country = 'India',
    addressType = 'home',
    isDefault = false,
  } = req.body;

  if (
    !fullName ||
    !phone ||
    !addressLine1 ||
    !city ||
    !state ||
    !postalCode
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Full name, phone, address, city, state, and postal code are required.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const countResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM addresses
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    const hasNoAddresses = countResult.rows[0].count === 0;
    const shouldBeDefault = Boolean(isDefault) || hasNoAddresses;

    if (shouldBeDefault) {
      await client.query(
        `
        UPDATE addresses
        SET is_default = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        `,
        [req.user.id]
      );
    }

    const result = await client.query(
      `
      INSERT INTO addresses (
        user_id,
        full_name,
        phone,
        alternate_phone,
        address_line1,
        address_line2,
        landmark,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13
      )
      RETURNING *
      `,
      [
        req.user.id,
        fullName,
        phone,
        alternatePhone ?? null,
        addressLine1,
        addressLine2 ?? null,
        landmark ?? null,
        city,
        state,
        postalCode,
        country,
        addressType,
        shouldBeDefault,
      ]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Delivery address added successfully!',
      data: mapAddress(result.rows[0]),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to add delivery address.',
    });
  } finally {
    client.release();
  }
};

export const updateAddress = async (
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingResult = await client.query(
      `
      SELECT *
      FROM addresses
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
      `,
      [id, req.user.id]
    );

    if (existingResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    const existing = existingResult.rows[0];
    const fields = req.body;

    const isDefault =
      fields.isDefault !== undefined
        ? Boolean(fields.isDefault)
        : Boolean(existing.is_default);

    if (isDefault) {
      await client.query(
        `
        UPDATE addresses
        SET is_default = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND id <> $2
        `,
        [req.user.id, id]
      );
    }

    const result = await client.query(
      `
      UPDATE addresses
      SET
        full_name = $1,
        phone = $2,
        alternate_phone = $3,
        address_line1 = $4,
        address_line2 = $5,
        landmark = $6,
        city = $7,
        state = $8,
        postal_code = $9,
        country = $10,
        address_type = $11,
        is_default = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND user_id = $14
      RETURNING *
      `,
      [
        fields.fullName ?? existing.full_name,
        fields.phone ?? existing.phone,
        fields.alternatePhone !== undefined
          ? fields.alternatePhone
          : existing.alternate_phone,
        fields.addressLine1 ?? existing.address_line1,
        fields.addressLine2 !== undefined
          ? fields.addressLine2
          : existing.address_line2,
        fields.landmark !== undefined
          ? fields.landmark
          : existing.landmark,
        fields.city ?? existing.city,
        fields.state ?? existing.state,
        fields.postalCode ?? existing.postal_code,
        fields.country ?? existing.country,
        fields.addressType ?? existing.address_type,
        isDefault,
        id,
        req.user.id,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Address updated successfully!',
      data: mapAddress(result.rows[0]),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update address.',
    });
  } finally {
    client.release();
  }
};

export const deleteAddress = async (
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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
      DELETE FROM addresses
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    if (result.rows[0].is_default) {
      await client.query(
        `
        UPDATE addresses
        SET is_default = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id
          FROM addresses
          WHERE user_id = $1
          ORDER BY created_at ASC
          LIMIT 1
        )
        `,
        [req.user.id]
      );
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete address.',
    });
  } finally {
    client.release();
  }
};

export const setDefaultAddress = async (
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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const targetResult = await client.query(
      `
      SELECT *
      FROM addresses
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
      `,
      [id, req.user.id]
    );

    if (targetResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    await client.query(
      `
      UPDATE addresses
      SET is_default = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    const result = await client.query(
      `
      UPDATE addresses
      SET is_default = TRUE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, req.user.id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Default delivery address updated.',
      data: mapAddress(result.rows[0]),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Set default address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update default address.',
    });
  } finally {
    client.release();
  }
};