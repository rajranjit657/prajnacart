export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  seller?: {
    id: string;
    storeName: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
  };
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
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantName?: string;
  name?: string;
  color?: string;
  colorCode?: string;
  size?: string;
  storage?: string;
  ram?: string;
  mrp: number;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface ProductSpecification {
  group?: string;
  groupName?: string;
  items?: { name: string; value: string }[];
  specs?: { name: string; value: string }[];
  [key: string]: any;
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
  brandName: string;
  sellerId: string;
  sellerStoreName?: string;
  sellerInfo?: {
    id: string;
    storeName: string;
    rating: number;
    ratingCount: number;
  };
  mrp: number;
  price: number;
  discountPercent: number;
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
  specifications: any;
  specificationsStructured?: any[];
  tags: string[];
  reviews?: Review[];
  relatedProducts?: Product[];
}

export interface CartItem {
  id: string;
  cartId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface CartSummary {
  itemCount: number;
  totalMrp: number;
  totalSellingPrice: number;
  totalDiscount: number;
  deliveryFee: number;
  packagingFee: number;
  grandTotal: number;
  isFreeDelivery: boolean;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product?: Product;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
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
  orderNumber: string;
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
