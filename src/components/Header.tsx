import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { FiLogOut, FiUser } from 'react-icons/fi';

export const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-100">
      <h2 className="text-xl font-bold text-primary-900 tracking-tight">Dashboard Overview</h2>
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
