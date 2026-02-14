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
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary-600">Admin Panel</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 ${isActive
                ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Icon className="mr-3 text-lg" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
