import { useState, useEffect } from 'react';
import { FiCheckSquare, FiPackage, FiTruck, FiPrinter, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import { orderService, Order } from '../services/order.service';

export const BulkShippingPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadPendingOrders();
    }, []);

    const loadPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getOrders();
            // In a real scenario, filter on backend. Here we filter locally for UI demo:
            const list = response.data.orders.filter((o: any) => o.status === 'Packed' && o.shipmentStatus === 'Unshipped');
            setOrders(list);
            setSelectedOrderIds([]);
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrderIds(orders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    };

    const handleSelectOrder = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
        );
    };

    const handleBulkGenerateAWB = async () => {
        if (selectedOrderIds.length === 0) return;
        setIsProcessing(true);
        try {
            // Mock API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert(`Successfully generated AWBs for ${selectedOrderIds.length} orders via Shiprocket!`);
            loadPendingOrders();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bulk Shipping Management</h1>
                    <p className="text-gray-500 mt-1">Process multiple orders and generate shipping labels instantly.</p>
                </div>
                <button
                    onClick={loadPendingOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                    <FiRefreshCcw className={loading ? 'animate-spin' : ''} /> Refresh List
                </button>
            </div>

            {/* Bulk Actions Toolbar */}
            <div className={`bg-primary-900 text-white p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${selectedOrderIds.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg font-bold">
                        {selectedOrderIds.length} Selected
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBulkGenerateAWB}
                        disabled={isProcessing}
                        className="bg-white text-primary-900 px-5 py-2 font-bold rounded-lg hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-75"
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <><FiTruck /> Generate Bulk AWB</>
                        )}
                    </button>
                    <button className="bg-white/10 text-white px-5 py-2 font-medium rounded-lg hover:bg-white/20 transition flex items-center gap-2">
                        <FiPrinter /> Print Labels
                    </button>
                    <button className="bg-white/10 text-white px-5 py-2 font-medium rounded-lg hover:bg-white/20 transition flex items-center gap-2">
                        <FiPackage /> Schedule Pickups
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                    <FiSearch className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search pending shipments by Order ID or City..."
                        className="flex-1 outline-none text-sm bg-transparent"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer & Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Weight</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Mode</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Checking for unshipped orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FiCheckSquare className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">All Caught Up!</p>
                                            <p className="text-sm">No pending shipments to process at this time.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={`hover:bg-blue-50/30 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                checked={selectedOrderIds.includes(order.id)}
                                                onChange={() => handleSelectOrder(order.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900 border-b border-gray-900 border-dashed pb-0.5">{order.orderNumber}</span>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{order.customer.name}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-[200px]">{order.shippingAddress?.city}, {order.shippingAddress?.pincode}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {order.items.slice(0, 3).map((item, i) => (
                                                    <img key={i} src={item.image} alt={item.name} className="w-8 h-8 rounded-full border-2 border-white object-cover bg-gray-100" />
                                                ))}
                                                {order.items.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                        +{order.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                            {order.packageWeight ? `${order.packageWeight} kg` : '0.5 kg'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${order.paymentMethod === 'COD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
