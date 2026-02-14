import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { setCredentials } from '../store/slices/authSlice';
import { FiMail, FiLock, FiShield, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      const response = await authService.login(data);

      if (response.data.user.role !== 'admin') {
        toast.error('Access Denied: Admin privileges required.');
        return;
      }

      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.accessToken,
        })
      );

      toast.success(`Welcome back, ${response.data.user.name || 'Admin'}!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login Failed:', error);
      const message = error.response?.data?.message || 'Invalid credentials or server error';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] font-outfit p-4">
      <div className="w-full max-w-[420px] animate-fade-in">
        {/* Logo/Icon Area */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl mb-6 group hover:border-white/20 transition-colors duration-500">
            <FiShield className="text-white text-4xl group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Central Control</h1>
          <p className="text-gray-500 text-sm font-medium">Secure Admin Authentication Gateway</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Identity</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-white transition-colors duration-300">
                  <FiMail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} text-white pl-14 pr-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300 placeholder:text-gray-600 font-medium`}
                  placeholder="admin@ecommerce.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs font-medium ml-1 animate-slide-in">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secret Key</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-white transition-colors duration-300">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className={`w-full bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} text-white pl-14 pr-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300 placeholder:text-gray-600 font-medium`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs font-medium ml-1 animate-slide-in">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-200 disabled:opacity-50 transition-all duration-300 active:scale-[0.98] shadow-xl shadow-white/5 flex items-center justify-center gap-3 relative group overflow-hidden mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  Access Dashboard
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs font-medium uppercase tracking-[0.2em] mb-4">Authorized Access Only</p>
          <div className="flex items-center justify-center gap-6">
            <span className="w-8 h-px bg-white/5"></span>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse [animation-delay:200ms]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse [animation-delay:400ms]"></div>
            </div>
            <span className="w-8 h-px bg-white/5"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
