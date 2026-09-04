import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getSellerDashboard = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Seller profile not found.' });
  }

  const sellerProducts = dbStore.products.filter(p => p.sellerId === seller.id);
  
  // Find all orders containing this seller's products
  const sellerOrders = dbStore.orders.filter(order =>
    order.items.some(item => item.sellerId === seller.id)
  );

  let totalSales = 0;
  let totalUnitsSold = 0;

  for (const order of sellerOrders) {
    if (order.paymentStatus === 'paid' || order.paymentMethod === 'cod') {
      const sellerItems = order.items.filter(item => item.sellerId === seller.id);
      for (const item of sellerItems) {
        totalSales += item.totalPrice;
        totalUnitsSold += item.quantity;
      }
    }
  }

  const lowStockProducts = sellerProducts.filter(p => p.stockQuantity <= 5);
  const pendingOrders = sellerOrders.filter(o => ['placed', 'confirmed', 'processing'].includes(o.orderStatus));

  // Commission calculation (e.g. 8% marketplace fee)
  const marketplaceCommission = Math.round((totalSales * seller.commissionRate) / 100);
  const netEarnings = totalSales - marketplaceCommission;

  return res.json({
    success: true,
    data: {
      seller,
      metrics: {
        totalRevenue: totalSales,
        netEarnings,
        marketplaceCommission,
        totalUnitsSold,
        totalOrdersCount: sellerOrders.length,
        pendingOrdersCount: pendingOrders.length,
        activeProductsCount: sellerProducts.filter(p => p.isActive).length,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders: sellerOrders.slice(0, 5),
      lowStockProducts,
    },
  });
};

export const getSellerProducts = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Seller profile not found.' });
  }

  const products = dbStore.products.filter(p => p.sellerId === seller.id);
  return res.json({ success: true, data: products });
};

export const getSellerOrders = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Seller profile not found.' });
  }

  // Filter orders containing items from this seller
  const orders = dbStore.orders
    .filter(order => order.items.some(item => item.sellerId === seller.id))
    .map(order => ({
      ...order,
      sellerItems: order.items.filter(item => item.sellerId === seller.id),
    }))
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  return res.json({ success: true, data: orders });
};

export const updateStoreSettings = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const seller = dbStore.sellers.find(s => s.userId === req.user!.id);
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Seller profile not found.' });
  }

  const { storeName, businessPhone, gstin, pan, bankAccountName, bankAccountNumber, bankIfsc, bankName, description, logoUrl } = req.body;
  if (storeName) seller.storeName = storeName;
  if (businessPhone) seller.businessPhone = businessPhone;
  if (gstin !== undefined) seller.gstin = gstin;
  if (pan !== undefined) seller.pan = pan;
  if (bankAccountName !== undefined) seller.bankAccountName = bankAccountName;
  if (bankAccountNumber !== undefined) seller.bankAccountNumber = bankAccountNumber;
  if (bankIfsc !== undefined) seller.bankIfsc = bankIfsc;
  if (bankName !== undefined) seller.bankName = bankName;
  if (description !== undefined) seller.description = description;
  if (logoUrl !== undefined) seller.logoUrl = logoUrl;
  seller.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Store settings updated successfully!',
    data: seller,
  });
};
