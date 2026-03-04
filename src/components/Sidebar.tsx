import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
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
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-primary-900">A</div>
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
