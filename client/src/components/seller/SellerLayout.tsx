import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Store, LayoutDashboard, Package, ShoppingBag, 
  Settings, LogOut, ArrowLeft, Plus 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const SellerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || (user?.role !== 'seller' && user?.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-gray-200 rounded-lg shadow-card text-center space-y-4">
        <Store size={48} className="mx-auto text-novaorange-500" />
        <h2 className="text-xl font-bold text-gray-900">Seller Access Required</h2>
        <p className="text-xs text-gray-500">
          You must be logged in as a registered Seller to access the merchant portal.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/login" className="px-4 py-2 bg-novaorange-500 text-white rounded text-xs font-bold">
            Sign In
          </Link>
          <Link to="/seller/register" className="px-4 py-2 bg-gray-100 text-gray-800 rounded text-xs font-bold">
            Register as Seller
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/seller', icon: <LayoutDashboard size={18} /> },
    { label: 'My Products', path: '/seller/products', icon: <Package size={18} /> },
    { label: 'Customer Orders', path: '/seller/orders', icon: <ShoppingBag size={18} /> },
    { label: 'Store Settings', path: '/seller/settings', icon: <Settings size={18} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/seller') return location.pathname === '/seller';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-seagreen-100 flex flex-col">
      {/* Top Seller Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-novaorange-600">
            <ArrowLeft size={14} /> Back to Storefront
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic tracking-tight text-novaorange-600 font-sans">
              PRAJNA<span className="text-[#0066FF]">CART</span>
            </span>
            <span className="bg-orange-100 text-novaorange-700 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
              SELLER HUB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/seller/products/new"
            className="hidden sm:inline-flex items-center gap-1.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded shadow-xs transition-colors"
          >
            <Plus size={14} /> Add Product
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">{user?.firstName}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-gray-400 hover:text-rose-600 p-1"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="md:col-span-3 bg-white rounded-lg border border-gray-200 p-3 shadow-card space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-bold transition-colors ${
                isActive(item.path)
                  ? 'bg-orange-50 text-novaorange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </aside>

        {/* Content Area */}
        <main className="md:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
