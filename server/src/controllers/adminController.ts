import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Banner } from '../types/index.js';

export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = dbStore.users.length;
  const totalSellers = dbStore.sellers.length;
  const pendingSellers = dbStore.sellers.filter(s => s.status === 'pending').length;
  const totalProducts = dbStore.products.length;
  const pendingProducts = dbStore.products.filter(p => p.approvalStatus === 'pending').length;
  const totalOrders = dbStore.orders.length;
  const pendingOrders = dbStore.orders.filter(o => ['placed', 'confirmed', 'processing'].includes(o.orderStatus)).length;

  let totalRevenue = 0;
  for (const order of dbStore.orders) {
    if (order.paymentStatus === 'paid' || order.paymentMethod === 'cod') {
      totalRevenue += order.grandTotal;
    }
  }

  // Monthly sales simulation data for admin dashboard chart
  const salesChartData = [
    { month: 'Jan', revenue: 420000, orders: 120 },
    { month: 'Feb', revenue: 580000, orders: 165 },
    { month: 'Mar', revenue: 710000, orders: 210 },
    { month: 'Apr', revenue: 640000, orders: 195 },
    { month: 'May', revenue: 890000, orders: 280 },
    { month: 'Jun', revenue: 1050000, orders: 340 },
    { month: 'Jul', revenue: 1240000, orders: 410 },
    { month: 'Aug', revenue: totalRevenue + 1450000, orders: totalOrders + 460 },
  ];

  // Category distribution
  const categoryStats = dbStore.categories.map(cat => ({
    category: cat.name,
    count: dbStore.products.filter(p => p.categoryId === cat.id).length,
  }));

  return res.json({
    success: true,
    data: {
      metrics: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        pendingProducts,
      },
      salesChartData,
      categoryStats,
      recentOrders: dbStore.orders.slice(0, 10),
      recentUsers: dbStore.users.slice(-5),
    },
  });
};

export const getSellers = async (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: dbStore.sellers,
  });
};

export const updateSellerStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected' | 'suspended' | 'pending'

  const seller = dbStore.sellers.find(s => s.id === id);
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Seller not found.' });
  }

  seller.status = status;
  seller.updatedAt = new Date().toISOString();

  // Send in-app notification to seller user
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: seller.userId,
    title: `Seller Account Status: ${status.toUpperCase()}`,
    message: status === 'approved' 
      ? 'Congratulations! Your seller store has been approved. You can now list products and receive orders.'
      : `Your seller account status was changed to '${status}'. Please contact support for more details.`,
    type: 'system',
    link: '/seller',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Seller status successfully updated to '${status}'.`,
    data: seller,
  });
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  const usersWithProfiles = dbStore.users.map(u => {
    const prof = dbStore.profiles.find(p => p.userId === u.id);
    return {
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      firstName: prof?.firstName || '',
      lastName: prof?.lastName || '',
      createdAt: u.createdAt,
    };
  });

  return res.json({ success: true, data: usersWithProfiles });
};

export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = dbStore.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Cannot deactivate platform admin account.' });
  }

  user.isActive = !user.isActive;
  user.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
    data: { id: user.id, isActive: user.isActive },
  });
};

// Admin Banner Management
export const createBanner = async (req: AuthenticatedRequest, res: Response) => {
  const { title, subtitle, imageUrl, mobileImageUrl, ctaText, ctaLink, badgeText, displayOrder } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ success: false, message: 'Banner title and image URL are required.' });
  }

  const newBanner: Banner = {
    id: `ban_${Date.now()}`,
    title,
    subtitle: subtitle || '',
    imageUrl,
    mobileImageUrl: mobileImageUrl || imageUrl,
    ctaText: ctaText || 'Shop Now',
    ctaLink: ctaLink || '/products',
    badgeText: badgeText || '',
    displayOrder: Number(displayOrder) || dbStore.banners.length + 1,
    isActive: true,
  };

  dbStore.banners.push(newBanner);
  return res.status(201).json({ success: true, message: 'Banner created successfully!', data: newBanner });
};

export const deleteBanner = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = dbStore.banners.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Banner not found.' });
  }

  dbStore.banners.splice(idx, 1);
  return res.json({ success: true, message: 'Banner removed successfully.' });
};
