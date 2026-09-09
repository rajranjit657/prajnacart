import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'prajnacart_super_secret_jwt_key_2026_production_grade';

const generateToken = (user: {
  id: string;
  email: string;
  role: UserRole;
}) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  if (!email || !password || !firstName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and first name are required.',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message:
          'An account with this email address already exists. Please sign in instead.',
      });
    }

    const assignedRole: UserRole =
      role === 'seller' ? 'seller' : 'customer';

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserId = `usr_${Date.now()}_${Math.floor(
      Math.random() * 100000
    )}`;

    const now = new Date();

    const userResult = await client.query(
      `
      INSERT INTO users (
        id,
        email,
        password_hash,
        phone,
        role,
        is_active,
        is_email_verified,
        avatar_url,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, TRUE, TRUE, $6, $7, $7
      )
      RETURNING
        id,
        email,
        phone,
        role,
        is_active,
        is_email_verified,
        avatar_url,
        created_at,
        updated_at
      `,
      [
        newUserId,
        normalizedEmail,
        passwordHash,
        phone || '',
        assignedRole,
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          firstName + ' ' + (lastName || '')
        )}`,
        now,
      ]
    );

    const user = userResult.rows[0];

    const profileId = `prof_${Date.now()}_${Math.floor(
      Math.random() * 100000
    )}`;

    const profileResult = await client.query(
      `
      INSERT INTO profiles (
        id,
        user_id,
        first_name,
        last_name,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $5)
      RETURNING
        id,
        user_id,
        first_name,
        last_name,
        gender,
        date_of_birth,
        created_at,
        updated_at
      `,
      [
        profileId,
        newUserId,
        firstName,
        lastName || '',
        now,
      ]
    );

    const profile = profileResult.rows[0];

    let seller: {
      id: string;
      store_name: string;
      store_slug: string;
      status: string;
    } | undefined;

    if (assignedRole === 'seller') {
      const storeName =
        req.body.storeName || `${firstName}'s Store`;

      const storeSlug =
        String(storeName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        `store-${Date.now()}`;

      const sellerId = `seller_${Date.now()}_${Math.floor(
        Math.random() * 100000
      )}`;

      const sellerResult = await client.query(
        `
        INSERT INTO sellers (
          id,
          user_id,
          store_name,
          store_slug,
          business_email,
          business_phone,
          gstin,
          pan,
          status,
          rating,
          rating_count,
          commission_rate,
          description,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          'pending', 5.0, 0, 8.0, $9, $10, $10
        )
        RETURNING
          id,
          store_name,
          store_slug,
          status
        `,
        [
          sellerId,
          newUserId,
          storeName,
          storeSlug,
          normalizedEmail,
          phone || '',
          req.body.gstin || null,
          req.body.pan || null,
          req.body.description ||
            'New verified seller on Prajnacart.',
          now,
        ]
      );

      seller = sellerResult.rows[0];
    }

    await client.query('COMMIT');

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return res.status(201).json({
      success: true,
      message:
        assignedRole === 'seller'
          ? 'Seller registered successfully! Account is pending admin approval.'
          : 'Account created successfully! Welcome to Prajnacart.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url,
          firstName: profile.first_name,
          lastName: profile.last_name || '',
          seller: seller
            ? {
                id: seller.id,
                storeName: seller.store_name,
                status: seller.status,
              }
            : undefined,
        },
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');

    console.error('Registration error:', error.message);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message:
          'An account with this email or store information already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to create account. Please try again later.',
    });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        password_hash,
        phone,
        role,
        is_active,
        avatar_url
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [String(email).trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          'Your account has been deactivated. Please contact support.',
      });
    }

    const profileResult = await pool.query(
      `
      SELECT
        first_name,
        last_name
      FROM profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.id]
    );

    const profile = profileResult.rows[0];

    let seller;

    if (user.role === 'seller') {
      const sellerResult = await pool.query(
        `
        SELECT
          id,
          store_name,
          status
        FROM sellers
        WHERE user_id = $1
        LIMIT 1
        `,
        [user.id]
      );

      seller = sellerResult.rows[0];
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return res.json({
      success: true,
      message: 'Signed in successfully!',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url,
          firstName: profile?.first_name || 'User',
          lastName: profile?.last_name || '',
          seller: seller
            ? {
                id: seller.id,
                storeName: seller.store_name,
                status: seller.status,
              }
            : undefined,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to sign in. Please try again later.',
    });
  }
};

export const getMe = async (
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
    const userResult = await pool.query(
      `
      SELECT
        id,
        email,
        phone,
        role,
        avatar_url,
        is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    const user = userResult.rows[0];

    if (!user || !user.is_active) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const profileResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        first_name,
        last_name,
        gender,
        date_of_birth,
        preferences,
        created_at,
        updated_at
      FROM profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.id]
    );

    const addressResult = await pool.query(
      `
      SELECT
        id,
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
        is_default,
        created_at,
        updated_at
      FROM addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [user.id]
    );

    let seller;

    if (user.role === 'seller') {
      const sellerResult = await pool.query(
        `
        SELECT
          id,
          user_id,
          store_name,
          store_slug,
          business_email,
          business_phone,
          gstin,
          pan,
          bank_account_name,
          bank_account_number,
          bank_ifsc,
          bank_name,
          status,
          rating,
          rating_count,
          commission_rate,
          pickup_address,
          logo_url,
          banner_url,
          description,
          created_at,
          updated_at
        FROM sellers
        WHERE user_id = $1
        LIMIT 1
        `,
        [user.id]
      );

      seller = sellerResult.rows[0];
    }

    const profile = profileResult.rows[0];

    const addresses = addressResult.rows.map((a) => ({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      alternatePhone: a.alternate_phone,
      addressLine1: a.address_line1,
      addressLine2: a.address_line2,
      landmark: a.landmark,
      city: a.city,
      state: a.state,
      postalCode: a.postal_code,
      country: a.country,
      addressType: a.address_type,
      isDefault: a.is_default,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        gender: profile?.gender,
        dateOfBirth: profile?.date_of_birth,
        addresses,
        seller,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to load your account details.',
    });
  }
};

export const updateProfile = async (
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
    firstName,
    lastName,
    phone,
    gender,
    dateOfBirth,
    avatarUrl,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `
      SELECT
        id,
        email,
        phone,
        role,
        avatar_url,
        is_active
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [req.user.id]
    );

    const user = userResult.rows[0];

    if (!user) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updatedPhone =
      phone !== undefined ? phone : user.phone;

    const updatedAvatar =
      avatarUrl !== undefined
        ? avatarUrl
        : user.avatar_url;

    const updatedUserResult = await client.query(
      `
      UPDATE users
      SET
        phone = $1,
        avatar_url = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        id,
        email,
        phone,
        role,
        avatar_url
      `,
      [updatedPhone, updatedAvatar, req.user.id]
    );

    const profileResult = await client.query(
      `
      SELECT
        id,
        user_id,
        first_name,
        last_name,
        gender,
        date_of_birth
      FROM profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    let profile = profileResult.rows[0];

    if (!profile) {
      const profileId = `prof_${Date.now()}_${Math.floor(
        Math.random() * 100000
      )}`;

      const newProfileResult = await client.query(
        `
        INSERT INTO profiles (
          id,
          user_id,
          first_name,
          last_name,
          gender,
          date_of_birth,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          user_id,
          first_name,
          last_name,
          gender,
          date_of_birth
        `,
        [
          profileId,
          req.user.id,
          firstName || 'User',
          lastName || '',
          gender || null,
          dateOfBirth || null,
        ]
      );

      profile = newProfileResult.rows[0];
    } else {
      const updatedProfileResult = await client.query(
        `
        UPDATE profiles
        SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          gender = COALESCE($3, gender),
          date_of_birth = COALESCE($4, date_of_birth),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5
        RETURNING
          id,
          user_id,
          first_name,
          last_name,
          gender,
          date_of_birth
        `,
        [
          firstName !== undefined ? firstName : null,
          lastName !== undefined ? lastName : null,
          gender !== undefined ? gender : null,
          dateOfBirth !== undefined ? dateOfBirth : null,
          req.user.id,
        ]
      );

      profile = updatedProfileResult.rows[0];
    }

    await client.query('COMMIT');

    const updatedUser = updatedUserResult.rows[0];

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatar_url,
        firstName: profile.first_name,
        lastName: profile.last_name || '',
        gender: profile.gender,
        dateOfBirth: profile.date_of_birth,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');

    console.error('Update profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update profile. Please try again.',
    });
  } finally {
    client.release();
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email address.',
    });
  }

  try {
    await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [String(email).trim().toLowerCase()]
    );

    // Do not reveal whether the email exists.
    // A real password-reset token/email system will be added
    // after the authentication migration is complete.
    return res.json({
      success: true,
      message:
        'If that email address exists in our system, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to process password reset request.',
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message:
        'Reset token and new password are required.',
    });
  }

  // Password reset tokens are intentionally not accepted yet.
  // The old demo_token flow must not remain in production.
  return res.status(400).json({
    success: false,
    message: 'Invalid or expired password reset token.',
  });
};