import { api } from './api';

export interface Coupon {
    id: string; // ID from backend is _id, mapped in UI
    _id?: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minPurchase?: number; // Backend uses minPurchase, Frontend UI uses minCartValue
    minCartValue?: number;
    expiryDate: string; // Format YYYY-MM-DD
    validUntil?: string; // Backend field
    usageLimit?: number;
    usedCount: number;
    status: 'active' | 'inactive' | 'expired'; // Backend field
    isActive?: boolean;
}

export const CouponService = {
    getAllCoupons: async () => {
        const response = await api.get('/admin/coupons');
        return response.data.data.coupons;
    },

    createCoupon: async (data: any) => {
        const response = await api.post('/admin/coupons', data);
        return response.data.data.coupon;
    },

    updateCoupon: async (id: string, data: any) => {
        const response = await api.patch(`/admin/coupons/${id}`, data);
        return response.data.data.coupon;
    },

    deleteCoupon: async (id: string) => {
        const response = await api.delete(`/admin/coupons/${id}`);
        return response.data;
    }
};
