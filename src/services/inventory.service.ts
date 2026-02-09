import { api } from './api';

export interface InventoryLog {
    _id: string;
    product: {
        _id: string;
        name: string;
        sku: string;
        images: string[];
    };
    previousStock: number;
    newStock: number;
    changeAmount: number;
    reason: string;
    actionType: 'add' | 'deduct' | 'set';
    user?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
}

interface GetInventoryLogsResponse {
    data: {
        logs: InventoryLog[];
        total: number;
        pages: number;
    };
}

export const InventoryService = {
    getLogs: async (page = 1, limit = 20, productId?: string) => {
        const params: any = { page, limit };
        if (productId) params.productId = productId;

        const response = await api.get<GetInventoryLogsResponse>('/inventory', { params });
        return response.data.data;
    }
};
