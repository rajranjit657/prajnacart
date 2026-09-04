import pg from 'pg';
import dotenv from 'dotenv';
import { 
  seedUsers, seedProfiles, seedSellers, seedAddresses, 
  seedCategories, seedBrands, seedBanners, seedCoupons, 
  seedProducts, seedReviews, seedOrders 
} from './seedData.js';
import { 
  User, Profile, Address, Seller, Category, Brand, 
  Product, Coupon, Banner, Review, Order, CartItem, WishlistItem, Notification 
} from '../types/index.js';

dotenv.config();

const { Pool } = pg;

// Live PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prajnacart',
  ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost')
    ? { rejectUnauthorized: false }
    : undefined,
});

// In-Memory / Resilient Storage Store for Zero-Setup Demo Mode & Fast Execution
class MemoryStore {
  users: User[] = [...seedUsers];
  profiles: Profile[] = [...seedProfiles];
  sellers: Seller[] = [...seedSellers];
  addresses: Address[] = [...seedAddresses];
  categories: Category[] = [...seedCategories];
  brands: Brand[] = [...seedBrands];
  banners: Banner[] = [...seedBanners];
  coupons: Coupon[] = [...seedCoupons];
  products: Product[] = [...seedProducts];
  reviews: Review[] = [...seedReviews];
  orders: Order[] = [...seedOrders];
  cartItems: CartItem[] = [];
  wishlistItems: WishlistItem[] = [];
  notifications: Notification[] = [
    {
      id: 'notif_001',
      userId: 'usr_customer_001',
      title: 'Welcome to Prajnacart!',
      message: 'Use coupon WELCOME100 to get flat ₹100 off on your first order.',
      type: 'promotion',
      link: '/products',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_002',
      userId: 'usr_customer_001',
      title: 'Order Shipped #NM202608250001',
      message: 'Your Sony WH-1000XM5 Headphones have been dispatched via Delhivery Express.',
      type: 'order',
      link: '/track-order/ord_demo_001',
      isRead: false,
      createdAt: new Date().toISOString(),
    }
  ];

  reset() {
    this.users = [...seedUsers];
    this.profiles = [...seedProfiles];
    this.sellers = [...seedSellers];
    this.addresses = [...seedAddresses];
    this.categories = [...seedCategories];
    this.brands = [...seedBrands];
    this.banners = [...seedBanners];
    this.coupons = [...seedCoupons];
    this.products = [...seedProducts];
    this.reviews = [...seedReviews];
    this.orders = [...seedOrders];
    this.cartItems = [];
    this.wishlistItems = [];
  }
}

export const dbStore = new MemoryStore();

export const isDemoMode = (): boolean => {
  return process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL;
};

// Check and log database connection on startup
export const initDbConnection = async (): Promise<boolean> => {
  if (isDemoMode()) {
    console.log('📦 Prajnacart running in Local Demo Mode (In-Memory Database Store Initialized with Seed Catalog)');
    return true;
  }

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully to live PostgreSQL Database');
    client.release();
    return true;
  } catch (err: any) {
    console.warn('⚠️ PostgreSQL live connection failed:', err.message);
    console.log('🔄 Gracefully falling back to High-Fidelity Local In-Memory Store');
    process.env.DEMO_MODE = 'true';
    return false;
  }
};
