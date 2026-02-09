import { api } from './api';

export interface BulkEnquiry {
    _id: string;
    id?: string;
    name: string;
    email: string;
    mobile: string;
    category: string;
    quantity: string | number;
    message: string;
    status: 'new' | 'contacted' | 'converted' | 'archived';
    createdAt: string;
    companyName?: string;
    adminNotes?: string;
}

export const bulkEnquiryService = {
    getAllEnquiries: async (status?: string) => {
        const params = status && status !== 'all' ? { status } : {};
        const response = await api.get('/admin/bulk-enquiries', { params });
        return response.data.data.enquiries;
    },

    updateStatus: async (id: string, status: string, notes?: string) => {
        const response = await api.patch(`/admin/bulk-enquiries/${id}/status`, { status, notes });
        return response.data.data.enquiry;
    }
};
