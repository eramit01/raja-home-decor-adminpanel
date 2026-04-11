import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { FiLogOut, FiUser, FiMenu } from 'react-icons/fi';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps = {}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-white px-4 md:px-8 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiMenu className="text-2xl" />
          </button>
        )}
        <h2 className="text-lg md:text-xl font-bold text-primary-900 tracking-tight line-clamp-1">Dashboard Overview</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
          <FiUser className="text-accent" />
          <span className="text-sm font-semibold text-primary-900">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
