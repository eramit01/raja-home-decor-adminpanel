import { useState, useEffect } from 'react';
import { FiCheckSquare, FiPackage, FiTruck, FiPrinter, FiSearch, FiRefreshCcw, FiCheckCircle, FiXCircle, FiLoader, FiInfo } from 'react-icons/fi';
import { orderService, Order } from '../services/order.service';

export const BulkShippingPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Progress Tracking
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);
    const [processLog, setProcessLog] = useState<{ id: string, status: 'success' | 'error', message: string }[]>([]);

    useEffect(() => {
        loadPendingOrders();
    }, []);

    const loadPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getOrders();
            // Filter: Packed status and not yet shipped via SR
            const list = response.data.orders.filter((o: any) => 
                (o.status === 'Packed' || o.status === 'Confirmed') && !o.awbNumber
            );
            setOrders(list);
            setSelectedOrderIds([]);
            setProcessLog([]);
            setProcessingIndex(null);
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
        setProcessLog([]);
        
        for (let i = 0; i < selectedOrderIds.length; i++) {
            const id = selectedOrderIds[i];
            setProcessingIndex(i);
            const order = orders.find(o => o.id === id);
            
            try {
                // 1. Create Shiprocket Order if needed
                if (!order?.shiprocketOrderId) {
                    await orderService.createShiprocketOrder(id);
                }

                // 2. Generate AWB
                await orderService.generateShiprocketAWB(id);
                
                setProcessLog(prev => [...prev, { id, status: 'success', message: 'AWB Generated' }]);
            } catch (err: any) {
                const errMsg = err.response?.data?.message || 'Processing Failed';
                setProcessLog(prev => [...prev, { id, status: 'error', message: errMsg }]);
            }
        }

        setIsProcessing(false);
        setProcessingIndex(null);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Logistics Hub</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Manage bulk shipments with Shiprocket.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={loadPendingOrders}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-sm"
                    >
                        <FiRefreshCcw className={loading ? 'animate-spin' : ''} /> Sync
                    </button>
                </div>
            </div>

            {/* Processing Status Overlay / Panel */}
            {processLog.length > 0 && (
                <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                             Batch Processing Status {isProcessing && <FiLoader className="animate-spin text-indigo-400" />}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400">
                            {processLog.length} of {selectedOrderIds.length} Processed
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {processLog.map((log, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                {log.status === 'success' ? (
                                    <FiCheckCircle className="text-emerald-400 shrink-0" />
                                ) : (
                                    <FiXCircle className="text-rose-400 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-white truncate">
                                        {orders.find(o => o.id === log.id)?.orderNumber}
                                    </p>
                                    <p className={`text-[9px] font-bold uppercase truncate ${log.status === 'success' ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                                        {log.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!isProcessing && (
                        <button 
                            onClick={loadPendingOrders}
                            className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Finalize & Clear Logs
                        </button>
                    )}
                </div>
            )}

            {/* Bulk Actions Floating Toolbar */}
            <div className={`fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-500 transform ${selectedOrderIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-gray-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-2xl ring-1 ring-white/10 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start sm:pl-2">
                        <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-black text-xs sm:text-sm shadow-indigo-500/20 shadow-lg">
                            {selectedOrderIds.length} Selected
                        </div>
                        <p className="sm:hidden text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ready for AWB</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleBulkGenerateAWB}
                            disabled={isProcessing}
                            className="bg-white text-black w-full sm:w-auto px-6 py-3 sm:py-2.5 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isProcessing ? <FiLoader className="animate-spin" /> : <FiTruck />}
                            {isProcessing ? 'Processing...' : 'Bulk AWB'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/30">
                    <FiSearch className="text-gray-400 w-5 h-5 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search IDs, Names..."
                        className="flex-1 outline-none text-sm font-bold bg-transparent placeholder:text-gray-300"
                    />
                </div>

                {/* Mobile Card List */}
                <div className="lg:hidden divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-12 text-center"><FiLoader className="inline w-8 h-8 animate-spin text-gray-200" /></div>
                    ) : orders.length === 0 ? (
                        <div className="p-12 text-center opacity-30"> Queue Clear </div>
                    ) : (
                        orders.map((order) => {
                            const isSelected = selectedOrderIds.includes(order.id);
                            return (
                                <div 
                                    key={order.id} 
                                    className={`p-4 flex gap-4 items-start ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                    onClick={() => handleSelectOrder(order.id)}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 mt-1 rounded-lg border-2 border-gray-300 text-indigo-600 appearance-none bg-white checked:bg-indigo-600 checked:border-transparent transition-all"
                                        checked={isSelected}
                                        readOnly
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-black text-gray-900 truncate">{order.orderNumber}</p>
                                            <p className="text-sm font-black text-gray-900">₹{order.total.toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 mb-2 truncate">{order.customer.name}</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase">
                                                {order.packageWeight || 0.5} KG
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${order.paymentMethod === 'COD' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                {order.paymentMethod}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Desktop view (High-Density Orders Table) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Destination</th>
                                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Package Config</th>
                                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center"><FiLoader className="inline w-8 h-8 animate-spin text-gray-200" /></td></tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-30">
                                            <FiCheckSquare className="w-16 h-16 mb-4" />
                                            <p className="text-xl font-black uppercase tracking-tight">Queue Clear</p>
                                            <p className="text-sm font-medium">No pending shipments found at this moment.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, idx) => {
                                    const isSelected = selectedOrderIds.includes(order.id);
                                    const isProcessingNow = isProcessing && processingIndex === selectedOrderIds.indexOf(order.id);
                                    
                                    return (
                                        <tr
                                            key={order.id}
                                            className={`group transition-all duration-300 ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'} ${isProcessingNow ? 'animate-pulse bg-indigo-50' : ''}`}
                                        >
                                            <td className="px-8 py-6">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOrder(order.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden relative">
                                                        <img src={order.items[0].image} className="w-full h-full object-cover" />
                                                        {order.items.length > 1 && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-black text-white">
                                                                +{order.items.length - 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 leading-none mb-1">{order.orderNumber}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Placed {new Date(order.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{order.customer.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic truncate max-w-[200px]">
                                                    {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
                                                </p>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                                                        {order.packageWeight || 0.5} KG
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {order.items.reduce((acc, i) => acc + i.quantity, 0)} Units
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <p className="text-sm font-black text-gray-900 leading-none">₹{order.total.toLocaleString()}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${order.paymentMethod === 'COD' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {order.paymentMethod}
                                                    </span>
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
