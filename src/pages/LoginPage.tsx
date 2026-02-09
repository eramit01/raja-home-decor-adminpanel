import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { setCredentials } from '../store/slices/authSlice';

type PhoneForm = { phone: string };
type VerifyForm = { phone: string; otp: string };

const otpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
});

const verifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const FIXED_OTP_ENABLED = import.meta.env.VITE_AUTH_FIXED_OTP_ENABLED === 'true';

export const LoginPage = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PhoneForm & Partial<VerifyForm>>({
    resolver: zodResolver(step === 'phone' ? otpSchema : verifySchema),
  });

  const onSendOTP = async (data: PhoneForm) => {
    try {
      // Dev convenience: skip hitting rate-limited send-otp endpoint when fixed OTP is enabled.
      if (FIXED_OTP_ENABLED) {
        setPhone(data.phone);
        setStep('otp');
        return;
      }

      const response = await authService.sendOTP({ phone: data.phone });

      // Dev helper for OTP visibility
      if (response && response.message && response.message.includes('DEV:')) {
        alert(response.message);
      }

      setPhone(data.phone);
      setStep('otp');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      alert('Failed to send OTP. Please check the console.');
    }
  };

  const onVerifyOTP = async (data: PhoneForm & Partial<VerifyForm>) => {
    try {
      if (!data.otp) {
        return;
      }
      // Ensure phone is passed from state if not in current form submission data (though likely handled by useForm if defaultValues set, but safer here)
      const phoneToVerify = data.phone || phone;

      const response = await authService.verifyOTP({
        phone: phoneToVerify,
        otp: data.otp,
      });

      if (response.data.user.role !== 'admin') {
        alert('Access Denied: Admin privileges required.');
        return;
      }

      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.accessToken,
        })
      );
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Invalid OTP or Verification Failed');
    }
  };

  // Helper to restrict input to numbers only
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setValue('phone', val);
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', val);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-outfit">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        {step === 'phone' ? (
          <form onSubmit={handleSubmit(onSendOTP)}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Mobile Number</label>
              <input
                type="tel"
                {...register('phone')}
                onChange={handlePhoneInput}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter 10-digit mobile number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{String(errors.phone.message)}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Get OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onVerifyOTP)}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2 text-center">OTP sent to +91 {phone}</p>
              <label className="block text-sm font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                {...register('otp')}
                onChange={handleOtpInput}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-widest text-center text-lg font-bold"
                placeholder="••••••"
                maxLength={6}
              />
              {errors.otp && (
                <p className="text-red-500 text-sm mt-1">{String(errors.otp.message)}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 mb-2 transition-colors"
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-gray-500 text-sm hover:text-black transition-colors"
            >
              Change Mobile Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
