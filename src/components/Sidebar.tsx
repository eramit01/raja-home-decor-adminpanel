import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiMessageSquare,
  FiStar,
  FiImage,
  FiList,
  FiTag,
  FiSettings,
} from 'react-icons/fi';

const menuItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/products', icon: FiPackage, label: 'Products' },
  { path: '/orders', icon: FiShoppingBag, label: 'Orders' },
  { path: '/bulk-shipping', icon: FiTruck, label: 'Bulk Shipping' },
  { path: '/bulk-enquiries', icon: FiMessageSquare, label: 'Bulk Enquiries' },
  { path: '/reviews', icon: FiStar, label: 'Reviews' },
  { path: '/banners', icon: FiImage, label: 'Banners' },
  { path: '/categories', icon: FiList, label: 'Categories' },
  { path: '/coupons', icon: FiTag, label: 'Coupons' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-[#141415] text-white shadow-2xl flex flex-col border-r border-accent/5">
      <div className="p-6 border-b border-primary-800/30">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
          <img
            src="/Logo/favbar.png"
            alt="Admin Logo"
            className="w-12 h-12 object-contain rounded-lg bg-white p-1.5 border border-white/20 shadow-lg"
          />
          Admin Panel
        </h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-6 py-3.5 mx-3 mt-1 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-white text-black font-extrabold shadow-lg shadow-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className={`mr-3 text-lg ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
              <span className="tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
