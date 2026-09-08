import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDbConnection, dbStore, isDemoMode } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'https://prajnacart.vercel.app';

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: [
    CLIENT_URL,
    'https://prajnacart.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Health & System Info Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    platform: 'Prajnacart Multi-Vendor E-Commerce Platform',
    version: '1.0.0',
    demoMode: isDemoMode(),
    timestamp: new Date().toISOString(),
    metrics: {
      productsCount: dbStore.products.length,
      categoriesCount: dbStore.categories.length,
      sellersCount: dbStore.sellers.length,
      usersCount: dbStore.users.length,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await initDbConnection();
  
  app.listen(PORT, () => {
    console.log(`
============================================================
🚀 Prajnacart API Server is running on port ${PORT}
🌐 API Base URL: http://localhost:${PORT}/api
🏥 Health Check: http://localhost:${PORT}/api/health
📦 Catalog Items: ${dbStore.products.length} Loaded
👥 Demo Accounts:
   - Admin:    admin@prajnacart.com    (Pass: Admin@123)
   - Seller:   seller@prajnacart.com   (Pass: Seller@123)
   - Customer: customer@prajnacart.com (Pass: Customer@123)
============================================================
    `);
  });
};

startServer();

export default app;
