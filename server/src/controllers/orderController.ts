import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Order, OrderItem } from '../types/index.js';
import { checkStockAvailability, deductStock, restoreStock } from '../services/inventoryService.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService.js';

const generateOrderNumber = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `NM${dateStr}${randNum}`;
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const {
    items = [],
    addressId,
    paymentMethod = 'cod', // 'cod' or 'razorpay'
    couponCode,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart cannot be empty to place an order.' });
  }

  const address = dbStore.addresses.find(a => a.id === addressId && a.userId === userId);
  if (!address) {
    return res.status(400).json({ success: false, message: 'Please select a valid delivery address.' });
  }

  // Calculate pricing strictly on backend
  let itemsSubtotal = 0;
  const orderItems: OrderItem[] = [];

  for (const item of items) {
    const product = dbStore.products.find(p => p.id === item.productId && p.isActive);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product '${item.productId}' is unavailable.` });
    }

    const variant = item.variantId ? product.variants?.find(v => v.id === item.variantId) : undefined;
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

    // Stock check
    const stockCheck = checkStockAvailability(product.id, item.variantId, qty);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({ success: false, message: `${product.title}: ${stockCheck.message}` });
    }

    const unitMrp = variant ? variant.mrp : product.mrp;
    const unitPrice = variant ? variant.price : product.price;
    const itemTotal = unitPrice * qty;

    itemsSubtotal += itemTotal;

    orderItems.push({
      id: `orditem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      orderId: '',
      productId: product.id,
      variantId: variant?.id,
      sellerId: product.sellerId,
      productTitle: product.title,
      variantName: variant?.variantName,
      thumbnailUrl: variant?.imageUrl || product.thumbnailUrl,
      unitMrp,
      unitPrice,
      quantity: qty,
      totalPrice: itemTotal,
      itemStatus: 'placed',
    });
  }

  // Delivery & Packaging Fees
  const shippingFee = itemsSubtotal >= 500 ? 0 : 40;
  const packagingFee = 29;

  // Coupon
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = dbStore.coupons.find(
      c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
    );
    if (coupon && itemsSubtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = Math.round((itemsSubtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountValue && couponDiscount > coupon.maxDiscountValue) {
          couponDiscount = coupon.maxDiscountValue;
        }
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, itemsSubtotal);
      coupon.usedCount += 1;
    }
  }

  const grandTotal = itemsSubtotal - couponDiscount + shippingFee + packagingFee;

  if (paymentMethod === 'cod' && grandTotal > 50000) {
    return res.status(400).json({
      success: false,
      message: 'Cash on Delivery is only available for orders up to ₹50,000. Please choose Razorpay Online Payment.',
    });
  }

  const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const orderNumber = generateOrderNumber();
  const trackingId = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

  orderItems.forEach(oi => { oi.orderId = orderId; });

  const user = dbStore.users.find(u => u.id === userId);
  const profile = dbStore.profiles.find(p => p.userId === userId);

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    userId,
    customerName: profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Customer',
    customerEmail: user?.email,
    customerPhone: address.phone,
    shippingAddress: address,
    itemsSubtotal,
    discountAmount: couponDiscount,
    couponCode,
    couponDiscount,
    taxAmount: 0,
    shippingFee,
    grandTotal,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    orderStatus: 'placed',
    trackingId,
    items: orderItems,
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: 'placed',
        timestamp: new Date().toISOString(),
        comment: paymentMethod === 'cod' ? 'Order placed with Cash on Delivery' : 'Order initialized, awaiting payment confirmation',
      },
    ],
  };

  // If Cash on Delivery, immediately deduct stock and clear cart
  if (paymentMethod === 'cod') {
    for (const item of orderItems) {
      deductStock(item.productId, item.variantId, item.quantity);
    }
    // Clear user cart
    dbStore.cartItems = dbStore.cartItems.filter(ci => ci.cartId !== userId);
    
    // Add notification
    dbStore.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId,
      title: `Order Placed Successfully! #${newOrder.orderNumber}`,
      message: `Your order of ₹${grandTotal.toLocaleString('en-IN')} has been placed. Expected delivery in 2-3 business days.`,
      type: 'order',
      link: `/profile/orders/${newOrder.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  dbStore.orders.unshift(newOrder);

  // If Razorpay chosen, create razorpay order
  let razorpayOrderData = null;
  if (paymentMethod === 'razorpay') {
    razorpayOrderData = await createRazorpayOrder({
      amount: grandTotal,
      receipt: orderNumber,
      notes: {
        orderId: newOrder.id,
        userId: newOrder.userId,
      },
    });
  }

  return res.status(201).json({
    success: true,
    message: paymentMethod === 'cod' ? 'Order placed successfully!' : 'Order created. Complete payment to confirm.',
    data: {
      order: newOrder,
      razorpay: razorpayOrderData,
    },
  });
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const order = dbStore.orders.find(o => o.id === orderId && o.userId === req.user!.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    order.paymentStatus = 'failed';
    order.updatedAt = new Date().toISOString();
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed: Invalid transaction signature.',
    });
  }

  // Payment successful: Update order state & deduct stock
  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.updatedAt = new Date().toISOString();
  order.statusHistory?.push({
    status: 'confirmed',
    timestamp: new Date().toISOString(),
    comment: `Payment received via Razorpay (Txn ID: ${razorpayPaymentId})`,
  });

  // Deduct inventory
  for (const item of order.items) {
    deductStock(item.productId, item.variantId, item.quantity);
  }

  // Clear user cart
  dbStore.cartItems = dbStore.cartItems.filter(ci => ci.cartId !== req.user!.id);

  // Send in-app notification
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: req.user.id,
    title: `Payment Verified! Order #${order.orderNumber} Confirmed`,
    message: `We have received your payment of ₹${order.grandTotal.toLocaleString('en-IN')}. Your items are being prepared for dispatch.`,
    type: 'order',
    link: `/profile/orders/${order.id}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Payment verified and order confirmed successfully!',
    data: order,
  });
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const orders = dbStore.orders
    .filter(o => o.userId === req.user!.id)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  return res.json({ success: true, data: orders });
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = dbStore.orders.find(o => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // Customer authorization check (unless admin/seller)
  if (req.user && req.user.role === 'customer' && order.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
  }

  return res.json({ success: true, data: order });
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  const { reason = 'Cancelled by customer' } = req.body;

  const order = dbStore.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (req.user.role === 'customer' && order.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized.' });
  }

  if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Order cannot be cancelled because it is already ${order.orderStatus.replace(/_/g, ' ')}. You can request a return after delivery.`,
    });
  }

  order.orderStatus = 'cancelled';
  order.updatedAt = new Date().toISOString();
  order.statusHistory?.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    comment: `Order cancelled. Reason: ${reason}`,
  });

  // Restore inventory
  for (const item of order.items) {
    restoreStock(item.productId, item.variantId, item.quantity);
  }

  return res.json({
    success: true,
    message: 'Order cancelled successfully. Any refund will be processed within 5-7 business days.',
    data: order,
  });
};

// Seller / Admin Update Order Status
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, comment, trackingId } = req.body;

  const validStatuses = ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status '${status}'.` });
  }

  const order = dbStore.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  order.orderStatus = status;
  if (trackingId) order.trackingId = trackingId;
  order.updatedAt = new Date().toISOString();

  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    comment: comment || `Status updated to ${status.replace(/_/g, ' ')} by seller/admin.`,
  });

  // Notify customer
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: order.userId,
    title: `Order Update: #${order.orderNumber} is ${status.replace(/_/g, ' ').toUpperCase()}`,
    message: comment || `Your order status has been updated to ${status.replace(/_/g, ' ')}.`,
    type: 'order',
    link: `/profile/orders/${order.id}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Order status updated to '${status}'.`,
    data: order,
  });
};
