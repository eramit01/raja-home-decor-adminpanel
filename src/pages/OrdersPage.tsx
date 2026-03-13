import { useState, useEffect } from 'react';
import { FiSearch, FiDownload, FiTruck, FiBox, FiTrash2 } from 'react-icons/fi';
import { orderService, Order } from '../services/order.service';
import { OrderDetailsModal } from '../components/OrderDetailsModal';

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      // Refresh list
      loadOrders();
      // Update modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as Order['status'] });
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update order status");
    }
  };

  const handleDelete = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        await orderService.deleteOrder(orderId);
        loadOrders();
      } catch (error) {
        console.error("Failed to delete order", error);
        alert("Failed to delete order");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Payment': return 'bg-yellow-100 text-yellow-700';
      case 'Payment Success': return 'bg-purple-100 text-purple-700';
      case 'Pending Verification': return 'bg-orange-100 text-orange-700 border border-orange-200 animate-pulse';
      case 'Confirmed': return 'bg-accent/10 text-accent border border-accent/20';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-indigo-100 text-indigo-700';
      case 'Delivered': return 'bg-accent/10 text-accent border border-accent/20';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = filterStatus === 'All'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm md:col-span-3 flex gap-4 items-center">
          <FiSearch className="text-gray-400" />
          <input type="text" placeholder="Search by Order ID or Customer..." className="flex-1 outline-none text-gray-700" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <select
            className="w-full outline-none text-gray-700 bg-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Payment Success">Payment Success</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Shipment Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Courier Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 font-medium text-blue-600">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className={`px-2 py-0.5 rounded text-xs ${order.paymentStatus === 'Paid' ? 'bg-accent/10 text-accent' : 'bg-red-50 text-red-700'}`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <FiBox className="text-gray-400" />
                        <span className={`font-medium ${order.shipmentStatus === 'Unshipped' ? 'text-gray-500' : 'text-primary-600'}`}>
                          {order.shipmentStatus || 'Unshipped'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5 font-medium text-gray-900">
                          <FiTruck className="text-gray-400" />
                          {order.courier || '-'}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 ml-5">
                          {order.awbNumber ? `AWB: ${order.awbNumber}` : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDelete(order.id, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Order"
                        >
                          <FiTrash2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
