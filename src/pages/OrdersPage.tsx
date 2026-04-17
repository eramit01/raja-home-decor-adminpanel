import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiDownload, FiEye, FiBox, FiTruck, FiXCircle, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { orderService, Order } from '../services/order.service';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(1, 100); // Fetching more for frontend filtering demo
      setOrders(response.data.orders);
      setSelectedOrders(new Set()); // Reset selection on load
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await orderService.updateOrderStatus(orderId, status);
      // Optimistic update
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: status as any } : o));
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update order status");
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedOrders.size === 0) return;
    try {
      setLoading(true);
      // In a real app, this should be a bulk API call. 
      // For now, doing it sequentially as per existing API capability.
      for (const id of Array.from(selectedOrders)) {
        await orderService.updateOrderStatus(id, status);
      }
      await loadOrders();
    } catch (error) {
      console.error("Failed bulk update", error);
      alert("Failed to update some orders.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleSelectOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedOrders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedOrders(newSet);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Pending Verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Payment Success':
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Packed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Safe extract city/pincode from address string if needed, or use shippingAddress object
  const getLocation = (order: Order) => {
    if (order.shippingAddress?.city) {
      return `${order.shippingAddress.city}, ${order.shippingAddress.pincode}`;
    }
    // Fallback if it's just a combined string in customer.address
    const parts = order.customer.address.split(',');
    if (parts.length > 2) {
      return `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
    }
    return 'N/A';
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'All' || o.status === filterStatus ||
      (filterStatus === 'Pending' && ['Pending', 'Pending Verification'].includes(o.status)) ||
      (filterStatus === 'Confirmed' && ['Confirmed', 'Payment Success'].includes(o.status));
    const matchPayment = filterPayment === 'All' || o.paymentMethod === filterPayment || (filterPayment === 'Online' && o.paymentMethod !== 'COD');
    const matchSearch = searchQuery === '' ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.phone.includes(searchQuery);
    return matchStatus && matchPayment && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and process your shipments efficiently.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm cursor-pointer">
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative border border-slate-200 rounded-lg bg-slate-50 flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
          <FiSearch className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 md:py-2 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="grid grid-cols-2 lg:flex gap-3">
          <select
            className="flex-1 lg:w-40 px-4 py-3 md:py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 cursor-pointer transition-all"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            className="flex-1 lg:w-40 px-4 py-3 md:py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 cursor-pointer transition-all"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
          >
            <option value="All">All Pay</option>
            <option value="COD">COD</option>
            <option value="Online">Prepaid</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Header (Sticky-ish) */}
      {selectedOrders.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <span className="text-sm font-bold text-indigo-900">
            {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => handleBulkUpdateStatus('Packed')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <FiBox /> Mark Packed
            </button>
            <button
              onClick={() => handleBulkUpdateStatus('Shipped')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <FiTruck /> Mark Shipped
            </button>
          </div>
        </div>
      )}

      {/* Mobile view (List of cards) */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 font-bold uppercase tracking-widest">No orders found.</div>
        ) : (
          filteredOrders.map((order) => {
            const statusLabel = ['Pending Verification', 'Pending'].includes(order.status) ? 'Pending' :
              ['Payment Success', 'Confirmed'].includes(order.status) ? 'Confirmed' : order.status;
            
            return (
              <div 
                key={order.id} 
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-black text-indigo-600 font-mono mb-1">{order.orderNumber}</p>
                    <h3 className="font-bold text-slate-900">{order.customer.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${getStatusBadge(order.status)}`}>
                    {statusLabel}
                  </span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="text-xs text-slate-500">
                    <p>{getLocation(order)}</p>
                    <p className="mt-1 font-bold text-slate-900">₹{order.total.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {statusLabel === 'Confirmed' && (
                      <button
                        onClick={(e) => handleUpdateStatus(order.id, 'Packed', e)}
                        className="p-2 text-purple-700 bg-purple-50 rounded-lg border border-purple-100"
                      >
                        <FiBox size={16} />
                      </button>
                    )}
                    {statusLabel === 'Packed' && (
                      <button
                        onClick={(e) => handleUpdateStatus(order.id, 'Shipped', e)}
                        className="p-2 text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-100"
                      >
                        <FiTruck size={16} />
                      </button>
                    )}
                    <button className="p-2 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                      <FiEye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop view (High-Density Orders Table) */}
      <div className="hidden lg:flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col relative z-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors">
                    {selectedOrders.size === filteredOrders.length && filteredOrders.length > 0 ? <FiCheckSquare size={18} className="text-indigo-600" /> : <FiSquare size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">City/Pincode</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold tracking-widest uppercase animate-pulse">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold tracking-widest uppercase">No orders matched your criteria.</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrders.has(order.id);
                  const statusLabel = ['Pending Verification', 'Pending'].includes(order.status) ? 'Pending' :
                    ['Payment Success', 'Confirmed'].includes(order.status) ? 'Confirmed' : order.status;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => toggleSelectOrder(order.id, e)}>
                        {isSelected ? <FiCheckSquare size={18} className="text-indigo-600" /> : <FiSquare size={18} className="text-slate-300 hover:text-slate-400 transition-colors" />}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 text-sm">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{order.customer.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{order.customer.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-600 truncate max-w-[150px]">
                        {getLocation(order)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${order.paymentMethod === 'Online' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {order.paymentMethod === 'Online' ? 'PREPAID' : 'COD'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                        ₹{order.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${getStatusBadge(order.status)}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {statusLabel === 'Confirmed' && (
                            <button
                              onClick={(e) => handleUpdateStatus(order.id, 'Packed', e)}
                              className="px-3 py-1.5 text-[10px] font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md uppercase tracking-wider transition-colors flex items-center gap-1.5 active:scale-95"
                            >
                              <FiBox /> Pack
                            </button>
                          )}
                          {statusLabel === 'Packed' && (
                            <button
                              onClick={(e) => handleUpdateStatus(order.id, 'Shipped', e)}
                              className="px-3 py-1.5 text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md uppercase tracking-wider transition-colors flex items-center gap-1.5 active:scale-95"
                            >
                              <FiTruck /> Ship
                            </button>
                          )}
                          {(statusLabel === 'Pending' || statusLabel === 'Confirmed') && (
                            <button
                              onClick={(e) => handleUpdateStatus(order.id, 'Cancelled', e)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors active:scale-95"
                              title="Cancel Order"
                            >
                              <FiXCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                            className="px-3 py-1.5 text-[10px] font-black text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-indigo-600 rounded-md uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <FiEye className="w-4 h-4" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
