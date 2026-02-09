import { FiX, FiMapPin, FiPackage, FiPhone, FiMail } from 'react-icons/fi';
import { Order } from '../services/order.service';

interface OrderDetailsModalProps {
    order: Order | null;
    onClose: () => void;
    onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

export const OrderDetailsModal = ({ order, onClose, onUpdateStatus }: OrderDetailsModalProps) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 rounded-t-2xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Placed on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <FiX className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FiPackage className="text-primary-600" /> Order Items ({order.items.length})
                        </h3>

                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex gap-4 p-4 border rounded-xl hover:shadow-sm transition-shadow">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                        <p className="text-sm font-bold text-primary-600 mt-1">₹{item.price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right font-bold text-gray-900">
                                        ₹{(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-gray-50 p-6 rounded-xl space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{(order.subtotal || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span>₹{(order.shippingCharges || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                                <span>Total</span>
                                <span>₹{(order.total || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Customer & Status */}
                    <div className="space-y-6">

                        {/* Status Management */}
                        <div className="p-5 border rounded-xl bg-white shadow-sm">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Order Status</label>
                            <select
                                value={order.status}
                                onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 mb-3"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <div className={`text-center py-2 rounded-lg text-sm font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                Current: {order.status}
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="p-5 border rounded-xl bg-white shadow-sm space-y-4">
                            <h3 className="font-bold border-b pb-2">Customer Info</h3>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-full"><FiPhone className="w-4 h-4 text-gray-600" /></div>
                                <div>
                                    <label className="text-xs text-gray-500 block">Phone</label>
                                    <p className="text-sm font-medium">{order.shippingAddress?.phone || order.customer?.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-full"><FiMail className="w-4 h-4 text-gray-600" /></div>
                                <div>
                                    <label className="text-xs text-gray-500 block">Email</label>
                                    <p className="text-sm font-medium break-all">{order.shippingAddress?.email || order.customer?.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="p-5 border rounded-xl bg-white shadow-sm space-y-3">
                            <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                                <FiMapPin className="text-gray-500" /> Shipping Address
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                <p className="font-bold text-gray-900 mb-1">{order.customer?.name || order.shippingAddress?.name}</p>
                                <p>{order.shippingAddress?.address || 'N/A'}</p>
                                <p>{order.shippingAddress?.city || ''}, {order.shippingAddress?.state || ''}</p>
                                <p className="font-medium text-gray-900">PIN: {order.shippingAddress?.pincode || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="p-5 border rounded-xl bg-white shadow-sm">
                            <h3 className="font-bold border-b pb-2 mb-3">Payment Info</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Method</span>
                                <span className="font-medium text-gray-900 uppercase">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {order.paymentStatus.toUpperCase()}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
