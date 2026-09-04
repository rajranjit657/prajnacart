export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'home' | 'work';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  businessEmail: string;
  businessPhone: string;
  gstin?: string;
  pan?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  ratingCount: number;
  commissionRate: number;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
  subcategories?: Subcategory[];
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantName: string;
  color?: string;
  colorCode?: string;
  size?: string;
  storage?: string;
  ram?: string;
  weight?: string;
  mrp: number;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface ProductSpecification {
  group: string;
  items: { name: string; value: string }[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandId?: string;
  brandName: string;
  sellerId: string;
  sellerStoreName?: string;
  mrp: number;
  price: number;
  discountPercent: number;
  taxPercent: number;
  stockQuantity: number;
  thumbnailUrl: string;
  images: string[];
  variants?: ProductVariant[];
  rating: number;
  ratingCount: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isDealOfTheDay: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  warrantyInfo: string;
  returnPolicy: string;
  deliveryInfo: string;
  specifications: ProductSpecification[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  product?: Product;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  productTitle: string;
  variantName?: string;
  thumbnailUrl: string;
  unitMrp: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  itemStatus: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. NM202608250001
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: Address;
  itemsSubtotal: number;
  discountAmount: number;
  couponCode?: string;
  couponDiscount: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  trackingId: string;
  items: OrderItem[];
  placedAt: string;
  updatedAt: string;
  statusHistory?: { status: string; timestamp: string; comment?: string }[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  images?: string[];
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaText: string;
  ctaLink: string;
  badgeText?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system' | 'alert';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
