import { api } from './api';

export interface OrderItem {
    id: string;
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    shippingAddress?: {
        name: string;
        phone: string;
        email?: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: OrderItem[];
    subtotal: number;
    shippingCharges: number;
    total: number;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    paymentStatus: 'Paid' | 'Pending' | 'Failed';
    paymentMethod: 'COD' | 'Online';
    refundStatus: 'none' | 'requested' | 'processed' | 'failed';
    createdAt: string;
}

// Mock Data
// Mock Data removed, using real API

// Helper to map backend order to frontend Order interface
const mapOrder = (o: any): Order => ({
    id: o._id,
    orderNumber: o.orderNumber,
    customer: {
        name: o.shippingAddress?.name || o.user?.name || 'Unknown',
        email: o.user?.email || 'N/A',
        phone: o.shippingAddress?.phone || o.user?.phone || 'N/A',
        address: `${o.shippingAddress?.address}, ${o.shippingAddress?.city}, ${o.shippingAddress?.pincode}`
    },
    shippingAddress: o.shippingAddress,
    items: o.items.map((i: any) => ({
        id: i._id,
        productId: i.product?._id,
        name: i.name || i.product?.name,
        image: i.image || i.product?.image,
        price: i.price,
        quantity: i.quantity
    })),
    subtotal: o.subtotal || 0,
    shippingCharges: o.shippingCharges || 0,
    total: o.total,
    status: o.status === 'pending_payment' ? 'Pending' :
        o.status === 'confirmed' ? 'Processing' :
            o.status === 'shipped' ? 'Shipped' :
                o.status === 'delivered' ? 'Delivered' :
                    o.status === 'cancelled' ? 'Cancelled' : o.status,
    paymentStatus: o.paymentStatus === 'verified' ? 'Paid' :
        o.paymentStatus === 'failed' ? 'Failed' : 'Pending',
    paymentMethod: o.paymentMethod === 'cod' ? 'COD' : 'Online',
    refundStatus: o.refundStatus || 'none',
    createdAt: o.createdAt
});

export const orderService = {
    processRefund: async (id: string, status: 'processed' | 'failed', note?: string) => {
        const response = await api.post(`/refunds/${id}/process`, { status, note });
        return response.data;
    },

    getOrders: async (page: number = 1, limit: number = 20) => {
        const response = await api.get(`/orders/admin/all?page=${page}&limit=${limit}`);
        const { orders, total, pages } = response.data.data;

        // Map backend data to frontend model
        // Map backend data to frontend model
        const mappedOrders: Order[] = orders.map(mapOrder);

        return { data: { orders: mappedOrders, total, pages } };
    },

    getOrderById: async (id: string) => {
        try {
            const response = await api.get(`/orders/${id}`);
            // Assuming the API returns the order object in response.data.data
            // If the structure is different, this needs adjustment.
            const orderData = response.data.data;
            const mappedOrder = mapOrder(orderData);
            return { data: { order: mappedOrder } };
        } catch (error) {
            console.error("Error fetching order by ID:", error);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: string) => {
        const backendStatus =
            status === 'Pending' ? 'pending_payment' :
                status === 'Processing' ? 'confirmed' :
                    status === 'Shipped' ? 'shipped' :
                        status === 'Delivered' ? 'delivered' :
                            status === 'Cancelled' ? 'cancelled' : status;

        const response = await api.patch(`/orders/${id}/status`, { status: backendStatus });
        return response;
    }
};
