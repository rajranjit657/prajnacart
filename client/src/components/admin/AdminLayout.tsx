import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, LayoutDashboard, Store, Package, Layers, 
  Image as ImageIcon, Ticket, Users, LogOut, ArrowLeft 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-gray-200 rounded-lg shadow-card text-center space-y-4">
        <ShieldCheck size={48} className="mx-auto text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Administrator Access Required</h2>
        <p className="text-xs text-gray-500">
          You need platform administrator credentials to view this area.
        </p>
        <Link to="/login" className="inline-block px-6 py-2 bg-purple-600 text-white rounded text-xs font-bold">
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const navItems = [
    { label: 'Executive Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Sellers Moderation', path: '/admin/sellers', icon: <Store size={18} /> },
    { label: 'Products Moderation', path: '/admin/products', icon: <Package size={18} /> },
    { label: 'Category Hierarchy', path: '/admin/categories', icon: <Layers size={18} /> },
    { label: 'Hero Banners', path: '/admin/banners', icon: <ImageIcon size={18} /> },
    { label: 'Promotional Coupons', path: '/admin/coupons', icon: <Ticket size={18} /> },
    { label: 'User Governance', path: '/admin/users', icon: <Users size={18} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-seagreen-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-purple-600">
            <ArrowLeft size={14} /> Back to Storefront
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic tracking-tight text-purple-700 font-sans">
              PRAJNA<span className="text-[#0066FF]">CART</span>
            </span>
            <span className="bg-purple-100 text-purple-800 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
              ADMIN CONTROL CENTER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="font-bold text-gray-800">{user?.firstName} (SuperAdmin)</span>
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
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="md:col-span-3 bg-white rounded-lg border border-gray-200 p-3 shadow-card space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-bold transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-50 text-purple-700'
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
