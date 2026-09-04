import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Profile, Seller } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prajnacart_super_secret_jwt_key_2026_production_grade';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user: User) => {
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

  const existing = dbStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email address already exists. Please sign in instead.',
    });
  }

  const assignedRole = (role === 'seller' ? 'seller' : 'customer') as 'customer' | 'seller';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const newUserId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newUser: User = {
    id: newUserId,
    email: email.toLowerCase(),
    passwordHash,
    phone: phone || '',
    role: assignedRole,
    isActive: true,
    isEmailVerified: true,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + ' ' + (lastName || ''))}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newProfile: Profile = {
    id: `prof_${Date.now()}`,
    userId: newUserId,
    firstName,
    lastName: lastName || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.users.push(newUser);
  dbStore.profiles.push(newProfile);

  // If registering as a seller, create pending seller record
  if (assignedRole === 'seller') {
    const storeName = req.body.storeName || `${firstName}'s Store`;
    const newSeller: Seller = {
      id: `seller_${Date.now()}`,
      userId: newUserId,
      storeName,
      storeSlug: storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      businessEmail: email,
      businessPhone: phone || '',
      gstin: req.body.gstin || '',
      pan: req.body.pan || '',
      status: 'pending', // Requires admin approval
      rating: 5.0,
      ratingCount: 0,
      commissionRate: 8.0,
      description: req.body.description || 'New verified seller on Prajnacart.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.sellers.push(newSeller);
  }

  const token = generateToken(newUser);

  return res.status(201).json({
    success: true,
    message: assignedRole === 'seller' 
      ? 'Seller registered successfully! Account is pending admin approval.'
      : 'Account created successfully! Welcome to Prajnacart.',
    data: {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
      },
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
    });
  }

  const user = dbStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password. Please try again.',
    });
  }

  const isPasswordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password. Please try again.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.',
    });
  }

  const profile = dbStore.profiles.find(p => p.userId === user.id);
  const seller = user.role === 'seller' ? dbStore.sellers.find(s => s.userId === user.id) : undefined;
  const token = generateToken(user);

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
        avatarUrl: user.avatarUrl,
        firstName: profile?.firstName || 'User',
        lastName: profile?.lastName || '',
        seller: seller ? {
          id: seller.id,
          storeName: seller.storeName,
          status: seller.status,
        } : undefined,
      },
    },
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = dbStore.users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const profile = dbStore.profiles.find(p => p.userId === user.id);
  const seller = user.role === 'seller' ? dbStore.sellers.find(s => s.userId === user.id) : undefined;
  const addresses = dbStore.addresses.filter(a => a.userId === user.id);

  return res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      gender: profile?.gender,
      dateOfBirth: profile?.dateOfBirth,
      addresses,
      seller,
    },
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { firstName, lastName, phone, gender, dateOfBirth, avatarUrl } = req.body;
  const user = dbStore.users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (phone !== undefined) user.phone = phone;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  user.updatedAt = new Date().toISOString();

  let profile = dbStore.profiles.find(p => p.userId === user.id);
  if (!profile) {
    profile = {
      id: `prof_${Date.now()}`,
      userId: user.id,
      firstName: firstName || 'User',
      lastName: lastName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.profiles.push(profile);
  } else {
    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (gender !== undefined) profile.gender = gender;
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    profile.updatedAt = new Date().toISOString();
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully!',
    data: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
    },
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email address.' });
  }

  const user = dbStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  // Always return success for security, but include simulation details
  return res.json({
    success: true,
    message: user
      ? `Password reset link has been dispatched to ${email}. (Demo link: /reset-password?token=demo_token_${user.id})`
      : 'If that email address exists in our system, a password reset link has been sent.',
    demoResetToken: user ? `demo_token_${user.id}` : undefined,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
  }

  if (token.startsWith('demo_token_')) {
    const userId = token.replace('demo_token_', '');
    const user = dbStore.users.find(u => u.id === userId);
    if (user) {
      user.passwordHash = bcrypt.hashSync(newPassword, 10);
      user.updatedAt = new Date().toISOString();
      return res.json({
        success: true,
        message: 'Password reset successful! You can now log in with your new credentials.',
      });
    }
  }

  return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
};
