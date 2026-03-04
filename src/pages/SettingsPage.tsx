
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { FiLock, FiShield, FiSave, FiSettings, FiMessageCircle } from 'react-icons/fi';

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const SettingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [storeLoading, setStoreLoading] = useState(false);

    // Store Settings State
    const [announcementIsActive, setAnnouncementIsActive] = useState(true);
    const [announcementText, setAnnouncementText] = useState('🎉 Free Shipping on Orders Over ₹999 | Fast Delivery India-Wide 🚚');

    // Fetch store settings on load
    useState(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings/announcement_bar');
                if (response.data.success && response.data.data.setting) {
                    const setting = response.data.data.setting.value;
                    setAnnouncementIsActive(setting.isActive);
                    if (setting.text) setAnnouncementText(setting.text);
                }
            } catch (error) {
                // Ignore 404 as it just means the setting hasn't been created yet
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const onSubmit = async (data: PasswordFormValues) => {
        try {
            setLoading(true);
            await authService.updateProfile({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            toast.success('Password updated successfully!');
            reset();
        } catch (error: any) {
            console.error('Update Failed:', error);
            const message = error.response?.data?.message || 'Failed to update password. Check your current password.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStoreSettings = async () => {
        try {
            setStoreLoading(true);
            await api.put('/settings/announcement_bar', {
                value: {
                    isActive: announcementIsActive,
                    text: announcementText
                },
                isPublic: true,
                description: 'Top announcement bar configuration'
            });
            toast.success('Store settings updated successfully!');
        } catch (error) {
            console.error('Failed to update store settings:', error);
            toast.error('Failed to update store settings');
        } finally {
            setStoreLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto font-outfit">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                    <FiShield className="text-white text-2xl" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 text-sm font-medium">Manage your security and profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Security Tips</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">Use symbols and numbers to make your password stronger.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">Don't use common words or birthdays.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">Change your password every 3-6 months.</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Form Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Store Settings Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-8 border-b border-gray-50 pb-6">
                            <FiSettings className="text-black text-xl" />
                            <h2 className="text-xl font-bold text-gray-900">Store Settings</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Announcement Bar Settings */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                                            <FiMessageCircle className="text-white w-4 h-4" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Announcement Bar</h3>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={announcementIsActive}
                                            onChange={(e) => setAnnouncementIsActive(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            {announcementIsActive ? 'Visible' : 'Hidden'}
                                        </span>
                                    </label>
                                </div>
                                <div className="space-y-2 pl-10">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Announcement Text</label>
                                    <input
                                        type="text"
                                        value={announcementText}
                                        onChange={(e) => setAnnouncementText(e.target.value)}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                                        placeholder="Enter announcement message..."
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveStoreSettings}
                                    disabled={storeLoading}
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.98] shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                                >
                                    {storeLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FiSave className="w-5 h-5" />
                                            Save Store Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-8 border-b border-gray-50 pb-6">
                            <FiLock className="text-black text-xl" />
                            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                                <input
                                    type="password"
                                    {...register('currentPassword')}
                                    className={`w-full px-5 py-4 bg-gray-50 border ${errors.currentPassword ? 'border-red-500' : 'border-gray-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium placeholder:text-gray-300`}
                                    placeholder="Enter your current password"
                                />
                                {errors.currentPassword && (
                                    <p className="text-red-500 text-xs font-medium ml-1">{errors.currentPassword.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                    <input
                                        type="password"
                                        {...register('newPassword')}
                                        className={`w-full px-5 py-4 bg-gray-50 border ${errors.newPassword ? 'border-red-500' : 'border-gray-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium placeholder:text-gray-300`}
                                        placeholder="Min 8 characters"
                                    />
                                    {errors.newPassword && (
                                        <p className="text-red-500 text-xs font-medium ml-1">{errors.newPassword.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        {...register('confirmPassword')}
                                        className={`w-full px-5 py-4 bg-gray-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium placeholder:text-gray-300`}
                                        placeholder="Repeat new password"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-red-500 text-xs font-medium ml-1">{errors.confirmPassword.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.98] shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FiSave className="w-5 h-5" />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
