import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPrinter, FiClock, FiTruck, FiCheckCircle, FiXCircle, FiPackage, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { orderService, Order } from '../services/order.service';

export const OrderDetailsPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadOrder(id);
        }
    }, [id]);

    const loadOrder = async (orderId: string) => {
        try {
            setLoading(true);
            const response = await orderService.getOrderById(orderId);
            setOrder(response.data.order || null);
        } catch (error) {
            console.error("Failed to load order", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: Order['status']) => {
        if (order) {
            await orderService.updateOrderStatus(order.id, newStatus);
            setOrder({ ...order, status: newStatus });
        }
    };

    const handleProcessRefund = async (status: 'processed' | 'failed') => {
        if (!order || !window.confirm(`Are you sure you want to mark this refund as ${status}?`)) return;
        try {
            await orderService.processRefund(order.id, status);
            setOrder({ ...order, refundStatus: status });
            alert(`Refund ${status} successfully`);
        } catch (error) {
            console.error('Failed to process refund', error);
            alert('Failed to process refund');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Processing': return 'bg-blue-100 text-blue-700';
            case 'Shipped': return 'bg-indigo-100 text-indigo-700';
            case 'Delivered': return 'bg-green-100 text-green-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                        <FiArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            Order {order.orderNumber}
                            <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                        <FiPrinter /> Print Invoice
                    </button>
                    <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(e.target.value as Order['status'])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 outline-none cursor-pointer"
                    >
                        <option value="Pending">Mark as Pending</option>
                        <option value="Processing">Mark as Processing</option>
                        <option value="Shipped">Mark as Shipped</option>
                        <option value="Delivered">Mark as Delivered</option>
                        <option value="Cancelled">Mark as Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <FiPackage className="text-blue-600" /> Order Items ({order.items.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items.map(item => (
                                <div key={item.id} className="p-6 flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500">ID: {item.productId}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">₹{item.price} x {item.quantity}</p>
                                        <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <div className="flex justify-end gap-12 text-sm text-gray-600">
                                <div className="space-y-1">
                                    <p>Subtotal:</p>
                                    <p>Shipping:</p>
                                    <p>Tax:</p>
                                    <p className="text-lg font-bold text-gray-900 pt-2">Total:</p>
                                </div>
                                <div className="space-y-1 text-right font-medium">
                                    <p>₹{order.total}</p>
                                    <p>₹0.00</p>
                                    <p>Included</p>
                                    <p className="text-lg font-bold text-blue-600 pt-2">₹{order.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline (Mock) */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FiClock className="text-blue-600" /> Order Timeline
                        </h2>
                        <div className="space-y-6 relative pl-4 border-l-2 border-gray-100 ml-2">
                            {/* Latest event */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-gray-900">Order Status Updated to {order.status}</p>
                                <p className="text-xs text-gray-500">Just now</p>
                            </div>
                            <div className="relative opacity-50">
                                <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-gray-900">Payment Confirmed</p>
                                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="relative opacity-50">
                                <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-gray-900">Order Placed</p>
                                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Customer & Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Customer Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-full"><FiCheckCircle className="w-4 h-4" /></div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-gray-900">{order.customer.name}</p>
                                    <p className="text-sm text-gray-500">Customer since 2023</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-full"><FiMail className="w-4 h-4" /></div>
                                <div className="truncate">
                                    <p className="text-sm text-gray-900">{order.customer.email}</p>
                                    <p className="text-sm text-gray-500">Email</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-full"><FiPhone className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-sm text-gray-900">{order.customer.phone}</p>
                                    <p className="text-sm text-gray-500">Mobile</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Shipping Address</h2>
                        <div className="flex gap-3">
                            <div className="mt-1 p-2 bg-orange-50 text-orange-600 rounded-full"><FiMapPin className="w-4 h-4" /></div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {order.customer.address}
                            </p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Payment Info</h2>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Method</span>
                            <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                order.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {order.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
