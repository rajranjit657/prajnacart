import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import { UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'prajnacart_super_secret_jwt_key_2026_production_grade';

type JwtPayload = {
  id: string;
  email: string;
  role: UserRole;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message:
        'Authentication token required. Please sign in to continue.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        role,
        is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message:
          'User session is invalid or user has been deactivated.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  } catch (err: any) {
    console.error('Authentication error:', err.message);

    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired authentication token. Please sign in again.',
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        role,
        is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.id]
    );

    const user = result.rows[0];

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
      };
    }
  } catch {
    // Ignore invalid optional tokens.
  }

  next();
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Sign in required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(
          ', '
        )}]. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};