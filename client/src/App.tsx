import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { CategoryNav } from './components/common/CategoryNav';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useWishlistStore } from './store/wishlistStore';

// Customer Storefront Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailedPage } from './pages/PaymentFailedPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SellerRegisterPage } from './pages/SellerRegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { AddressesPage } from './pages/AddressesPage';

// Seller Portal
import { SellerLayout } from './components/seller/SellerLayout';
import { SellerDashboardPage } from './pages/seller/SellerDashboardPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { AddEditProductPage } from './pages/seller/AddEditProductPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerSettingsPage } from './pages/seller/SellerSettingsPage';

// Admin Portal
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSellersPage } from './pages/admin/AdminSellersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

const StorefrontLayout: React.FC = () => {
  const location = useLocation();
  const isAuthOrCheckoutPage = ['/login', '/register', '/seller/register', '/forgot-password', '/reset-password', '/checkout'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-seagreen-100 text-[#17211B]">
      <div>
        <Header />
        {!isAuthOrCheckoutPage && <CategoryNav />}
        <main className="min-h-[calc(100vh-250px)]">
          <Outlet />
        </main>
      </div>
      <Footer />
      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();

  useEffect(() => {
    checkAuth();
    fetchCart();
    fetchWishlist();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Customer Storefront Routes */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:identifier" element={<ProductDetailPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/track-order/:id" element={<OrderTrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/seller/register" element={<SellerRegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/orders" element={<OrdersHistoryPage />} />
          <Route path="/profile/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/profile/addresses" element={<AddressesPage />} />
        </Route>

        {/* Dedicated Seller Portal Routes */}
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="products/new" element={<AddEditProductPage />} />
          <Route path="products/edit/:id" element={<AddEditProductPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="settings" element={<SellerSettingsPage />} />
        </Route>

        {/* Dedicated Admin Control Center Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="sellers" element={<AdminSellersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </Router>
  );
};
