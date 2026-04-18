import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiPrinter, FiCheckCircle, FiPhone, FiMail, FiTag, FiTruck, FiBox, FiSave, FiCopy, FiExternalLink, FiMessageCircle, FiChevronRight, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { orderService, Order, OrderItem } from '../services/order.service';



export const OrderDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const [shippingForm, setShippingForm] = useState({
        courierName: '',
        awbNumber: '',
        trackingUrl: '',
        packageWeight: ''
    });
    const [isSavingShipping, setIsSavingShipping] = useState(false);
    const [isProcessingShiprocket, setIsProcessingShiprocket] = useState(false);
    const [manualMode, setManualMode] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        if (!id) return;
        try {
            const response = await (orderService as any).getOrderById(id);
            const foundOrder = response.data?.order || response.order;
            if (foundOrder) {
                setOrder(foundOrder);
                setShippingForm({
                    courierName: foundOrder.courierName || '',
                    awbNumber: foundOrder.awbNumber || '',
                    trackingUrl: foundOrder.trackingUrl || '',
                    packageWeight: foundOrder.packageWeight?.toString() || ''
                });
            }
        } catch (error) {
            console.error("Error loading order:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: Order['status']) => {
        if (!order) return;
        try {
            await orderService.updateOrderStatus(order.id, status);
            setOrder({ ...order, status });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDeleteOrder = async () => {
        if (!order) return;
        if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
        
        try {
            await orderService.deleteOrder(order.id);
            alert("Order deleted successfully");
            navigate('/orders');
        } catch (error) {
            console.error("Failed to delete order", error);
            alert("Failed to delete order");
        }
    };

    const handleSaveShipping = async () => {
        if (!order) return;
        setIsSavingShipping(true);
        try {
            await orderService.updateShippingDetails(order.id, {
                ...shippingForm,
                packageWeight: shippingForm.packageWeight ? parseFloat(shippingForm.packageWeight) : undefined
            });
            setOrder({ ...order, ...shippingForm, packageWeight: shippingForm.packageWeight ? parseFloat(shippingForm.packageWeight) : undefined });
            alert("Shipping details saved successfully.");
        } catch (error) {
            console.error("Error saving shipping details", error);
            alert("Failed to save shipping details");
        } finally {
            setIsSavingShipping(false);
        }
    };

    const handleVerifyOrder = async (isVerified: boolean) => {
        if (!order) return;
        if (isVerified) {
            try {
                await orderService.updateOrderStatus(order.id, 'Pending');
                setOrder({ ...order, status: 'Pending', isVerified: true });
            } catch (error) {
                console.error("Verification failed", error);
            }
        }
    };

    const handleShiprocketCreateOrder = async () => {
        if (!order) return;
        setIsProcessingShiprocket(true);
        try {
            await orderService.createShiprocketOrder(order.id);
            alert("Order synced to Shiprocket successfully!");
            loadOrder();
        } catch (error: any) {
            console.error("Shiprocket sync failed", error);
            alert(error.response?.data?.message || "Sync failed");
        } finally {
            setIsProcessingShiprocket(false);
        }
    };

    const handleShiprocketGenerateAWB = async () => {
        if (!order) return;
        setIsProcessingShiprocket(true);
        try {
            await orderService.generateShiprocketAWB(order.id);
            alert("AWB Generated successfully!");
            loadOrder();
        } catch (error: any) {
            console.error("AWB generation failed", error);
            alert(error.response?.data?.message || "AWB generation failed");
        } finally {
            setIsProcessingShiprocket(false);
        }
    };

    const handleShiprocketGetLabel = async () => {
        if (!order || !order.shiprocketShipmentId) return;
        try {
            const res = await orderService.getShiprocketLabel(order.shiprocketShipmentId);
            const labelUrl = res.data?.label_url;
            if (labelUrl) {
                window.open(labelUrl, '_blank');
            } else {
                alert("Label URL not found in response");
            }
        } catch (error) {
            console.error("Label fetch failed", error);
            alert("Failed to fetch label");
        }
    };

    const handleShiprocketGetInvoice = async () => {
        if (!order || !order.shiprocketOrderId) return;
        try {
            const res = await orderService.getShiprocketInvoice(order.id);
            const invoiceUrl = res.data?.invoice_url;
            if (invoiceUrl) {
                window.open(invoiceUrl, '_blank');
            } else {
                alert(res.data?.message || "Invoice not available yet");
            }
        } catch (error: any) {
            console.error("Invoice fetch failed", error);
            alert(error.response?.data?.message || "Failed to fetch invoice");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple visual feedback could be added here
    };

    if (loading) return <div className="p-8 text-gray-400 font-bold animate-pulse uppercase tracking-widest text-center">Loading Order Details...</div>;
    if (!order) return <div className="p-8 text-red-500 font-bold uppercase tracking-widest text-center">Order not found.</div>;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending Verification':
            case 'Pending': return 'bg-gray-100 text-gray-600 border-gray-200'; // Gray
            case 'Payment Success':
            case 'Confirmed': return 'bg-blue-50 text-blue-700 border-blue-100'; // Light Blue
            case 'Packed': return 'bg-purple-50 text-purple-700 border-purple-100'; // Purple
            case 'Shipped': return 'bg-amber-50 text-amber-700 border-amber-100'; // Orange
            case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100'; // Green
            case 'Cancelled': return 'bg-red-50 text-red-700 border-red-100'; // Red
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getItemPricing = (item: OrderItem) => {
        const total = item.price;
        // Logic to estimate customization: sum of addon/variant/pack prices if available relative to originalPrice
        const customSum = (item.variant?.price || 0) + (item.pack?.price || 0) + (item.giftCustomization?.price || 0) + (item.addOns?.reduce((acc, a) => acc + a.price, 0) || 0);

        // If originalPrice is available from backend, use it as base. Otherwise, calculate.
        const base = item.originalPrice && item.originalPrice > 0 ? item.originalPrice : (total - customSum);

        // Final sanity check: if base is 0 but total is high, it's likely total includes base.
        const finalBase = (base <= 0 && total > 0) ? total : base;
        const finalCustomization = total - finalBase;

        return {
            base: finalBase,
            customization: finalCustomization > 0 ? finalCustomization : 0,
            total
        };
    };

    const formatValue = (v: any): string => {
        if (typeof v === 'object' && v !== null) {
            return Object.entries(v)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');
        }
        return String(v);
    };

    return (
        <div className="space-y-6 pb-24 relative bg-gray-50 min-h-screen">
            {/* SCREEN UI */}
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6`}>

                {/* 1. Order Overview (Sticky Top Summary Bar) */}
                <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-gray-200 shadow-sm mb-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                                <FiArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight truncate flex items-center gap-2">
                                        {order.orderNumber}
                                        <button onClick={() => copyToClipboard(order.orderNumber)} className="p-1 hover:bg-gray-100 rounded text-gray-400 shrink-0" title="Copy ID">
                                            <FiCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </h1>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    <FiClock className="w-3 h-3" />
                                    {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            {/* Status Badge only on small mobile to save space */}
                            <div className="md:hidden">
                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="hidden md:flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${order.paymentMethod === 'Online' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {order.paymentMethod === 'Online' ? 'PREPAID' : 'COD'}
                                    </span>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Total</p>
                                    <p className="text-base md:text-xl font-black text-gray-900 leading-none">₹{order.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification Banner */}
                {order.status === 'Pending Verification' && !order.isVerified && (
                    <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-amber-100 text-amber-700 rounded-full scale-110">
                                <FiPhone className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-amber-900 uppercase tracking-tight">Call Verification Needed</h2>
                                <p className="text-sm text-amber-700 mt-1 font-medium">Verify COD order with <a href={`tel:${order.customer.phone}`} className="font-black underline decoration-2">{order.customer.phone}</a></p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button onClick={() => handleVerifyOrder(false)} className="flex-1 md:flex-none px-6 py-3 bg-white text-amber-800 border-2 border-amber-200 hover:bg-amber-100 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Reject</button>
                            <button onClick={() => handleVerifyOrder(true)} className="flex-1 md:flex-none px-6 py-3 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2">Confirm Order</button>
                        </div>
                    </div>
                )}

                {/* Status Timeline / Progress Bar */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8 relative overflow-hidden overflow-x-auto no-scrollbar">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                    <div className="flex items-center justify-between relative min-w-[600px] md:min-w-full">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-100 -translate-y-1/2 z-0"></div>
                        <div className={`absolute top-1/2 left-0 h-[3px] bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.4)]`} style={{
                            width: order.status === 'Pending' ? '0%' :
                                order.status === 'Confirmed' ? '25%' :
                                    order.status === 'Packed' ? '50%' :
                                        order.status === 'Shipped' ? '75%' :
                                            order.status === 'Delivered' ? '100%' : '0%'
                        }}></div>

                        {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step) => {
                            const statuses = ['Pending Verification', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
                            const currentIdx = statuses.indexOf(order.status === 'Pending Verification' ? 'Pending' : order.status);
                            const stepIdx = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].indexOf(step);
                            const isCompleted = currentIdx >= stepIdx;
                            const isActive = currentIdx === stepIdx;

                            return (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 text-gray-300'} ${isActive ? 'scale-110 ring-8 ring-indigo-50 border-indigo-400' : ''}`}>
                                        {isCompleted ? <FiCheckCircle className="w-5 h-5" /> : <FiClock className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-indigo-900' : 'text-gray-400'}`}>{step}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* LEFT COLUMN (70%) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 3. Product Details (Premium Card Layout) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Ordered Items ({order.items.length})</h2>
                                <span className="text-xs font-bold text-gray-400">Shipment 1 of 1</span>
                            </div>

                            {order.items.map((item: OrderItem, idx: number) => (
                                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-5 md:p-6 flex flex-col sm:flex-row gap-6">
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0 relative group">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                                            <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-black text-gray-900 shadow-sm border border-gray-100">
                                                x{item.quantity}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-gray-900 leading-tight mb-1 uppercase tracking-tight">
                                                        {typeof item.name === 'object' ? JSON.stringify(item.name) : String(item.name)}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                            SKU: {typeof (item.variant?.sku || 'BASE-PROD') === 'object' ? JSON.stringify(item.variant?.sku || 'BASE-PROD') : String(item.variant?.sku || 'BASE-PROD')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                                                    <FiChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Configurations - Pill UI */}
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {item.pack && (
                                                    <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                        {formatValue(item.pack.label)}
                                                    </span>
                                                )}
                                                {item.variant && (
                                                    <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                        {formatValue(item.variant.label)}
                                                    </span>
                                                )}
                                                {item.fragrance && (
                                                    <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                                        {formatValue(item.fragrance)}
                                                    </span>
                                                )}
                                                {item.selectedAttributes && Object.entries(item.selectedAttributes).map(([k, v]: any) => (
                                                    <span key={k} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-2">
                                                        <span className="text-gray-400 font-medium">{k}:</span>
                                                        <span>{formatValue(v)}</span>
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Pricing Breakdown Grid */}
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="grid grid-cols-2 gap-y-2 mb-3">
                                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Base Price</div>
                                                    <div className="text-right text-xs font-black text-gray-700">₹{getItemPricing(item).base.toLocaleString()}</div>

                                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Customization</div>
                                                    <div className="text-right text-xs font-black text-emerald-600">+ ₹{getItemPricing(item).customization.toLocaleString()}</div>
                                                </div>
                                                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                                    <div className="text-xs font-black text-gray-900 uppercase tracking-tighter">Final Unit Price</div>
                                                    <div className="text-lg font-black text-gray-900">₹{item.price.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-900/5 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total for this item ({item.quantity} Unit)</div>
                                        <div className="text-lg font-black text-gray-900 tracking-tight">₹{(item.price * item.quantity).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN (30%) */}
                    <div className="space-y-6">

                        {/* 2. Customer & Delivery Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer Details</h2>
                                <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors" title="WhatsApp Customer">
                                    <FiMessageCircle className="w-4 h-4" />
                                </a>
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-lg">
                                        {order.customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-gray-900 leading-none mb-1">{order.customer.name}</p>
                                        <div className="flex flex-col gap-1">
                                            <a href={`tel:${order.customer.phone}`} className="text-xs text-gray-400 font-bold hover:text-gray-900 flex items-center gap-1.5">
                                                <FiPhone className="w-3 h-3 text-indigo-500" /> {order.customer.phone}
                                            </a>
                                            <a href={`mailto:${order.customer.email}`} className="text-xs text-gray-400 font-bold hover:text-gray-900 flex items-center gap-1.5 line-clamp-1">
                                                <FiMail className="w-3 h-3 text-indigo-500" /> {order.customer.email}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FiTruck className="w-3 h-3" /> Delivery Address
                                    </p>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group">
                                        <p className="text-sm text-gray-900 font-black leading-relaxed whitespace-pre-wrap uppercase tracking-tight italic">
                                            {order.customer.address}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(order.customer.address)}
                                                className="flex-1 bg-white border border-gray-200 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <FiCopy className="w-3.5 h-3.5" /> Copy
                                            </button>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer.address)}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex-1 bg-white border border-gray-200 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <FiExternalLink className="w-3.5 h-3.5" /> Maps
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Summary (Clean Box UI) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
                                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pricing Summary</h2>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900">₹{order.subtotal?.toLocaleString() ?? '0'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <span>Shipping</span>
                                    <span className={order.shippingCharges === 0 ? "text-emerald-600" : "text-gray-900 text-sm font-black"}>
                                        {order.shippingCharges === 0 ? 'FREE' : `₹${order.shippingCharges?.toLocaleString() ?? '0'}`}
                                    </span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <span>Discount</span>
                                        <span className="text-red-500">- ₹{order.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-4 mt-2 border-t-2 border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Total Amount</span>
                                    <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                                        {/* Smart Logistics Command Center */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="relative z-10">
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Logistics Command</h2>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Automated via Shiprocket</p>
                                </div>
                                <img src="https://sr-website.shiprocket.in/wp-content/uploads/2023/02/Shiprocket-logo.png" className="h-4 brightness-0 invert relative z-10" alt="Shiprocket" />
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Mode Toggle */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${manualMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {manualMode ? <FiTag /> : <FiTruck />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{manualMode ? 'Manual Entry Mode' : 'Smart Automation'}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Switch for non-SR couriers</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setManualMode(!manualMode)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${manualMode ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${manualMode ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                {!manualMode ? (
                                    <div className="space-y-4">
                                        {!order.shiprocketOrderId ? (
                                            <div className="p-6 text-center space-y-4 border-2 border-dashed border-gray-100 rounded-2xl">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                                    <FiBox className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase italic">Awaiting synchronization</p>
                                                <button
                                                    onClick={handleShiprocketCreateOrder}
                                                    disabled={isProcessingShiprocket || order.status === 'Cancelled'}
                                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isProcessingShiprocket ? 'Syncing...' : <><FiExternalLink className="w-4 h-4" /> Push to Shiprocket</>}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 animate-in fade-in duration-500">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Order ID</p>
                                                        <p className="text-xs font-black text-gray-900 font-mono tracking-widest">{order.shiprocketOrderId}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Shipment ID</p>
                                                        <p className="text-xs font-black text-gray-900 font-mono tracking-widest">{order.shiprocketShipmentId}</p>
                                                    </div>
                                                </div>

                                                {!order.awbNumber ? (
                                                    <button
                                                        onClick={handleShiprocketGenerateAWB}
                                                        disabled={isProcessingShiprocket}
                                                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isProcessingShiprocket ? 'Assigning...' : <><FiTruck className="w-4 h-4" /> Generate AWB Number</>}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm">
                                                            <div>
                                                                <p className="text-[9px] font-black text-emerald-800 uppercase mb-1 tracking-widest">Tracking Active</p>
                                                                <p className="text-xl font-black text-emerald-900 font-mono tracking-tighter">{order.awbNumber}</p>
                                                            </div>
                                                            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200">
                                                                <FiCheckCircle className="w-6 h-6" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleShiprocketGetLabel}
                                                                className="flex-1 py-4 bg-white text-gray-900 border-2 border-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                                            >
                                                                <FiPrinter className="w-4 h-4" /> Print Label
                                                            </button>
                                                            <button
                                                                onClick={handleShiprocketGetInvoice}
                                                                className="flex-1 py-4 bg-gray-900 text-white border-2 border-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                                            >
                                                                <FiPrinter className="w-4 h-4" /> Print Invoice
                                                            </button>
                                                        </div>

                                                        {/* Live Tracking Timeline */}
                                                        {order.trackingHistory && order.trackingHistory.length > 0 && (
                                                            <div className="mt-8 pt-6 border-t border-gray-100">
                                                                <div className="flex items-center gap-2 mb-6">
                                                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                                                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Live Tracking Feed</p>
                                                                </div>
                                                                <div className="space-y-6 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                                                                    {order.trackingHistory.map((item: any, idx: number) => (
                                                                        <div key={idx} className="relative group">
                                                                            <div className={`absolute -left-5 top-1 w-2 h-2 rounded-full border-2 bg-white transition-all ${idx === 0 ? 'border-indigo-600 scale-125' : 'border-gray-200'}`}></div>
                                                                            <div>
                                                                                <div className="flex items-center justify-between mb-0.5">
                                                                                    <p className={`text-[10px] font-black uppercase tracking-tight ${idx === 0 ? 'text-indigo-600' : 'text-gray-900'}`}>{item.status}</p>
                                                                                    <p className="text-[8px] font-bold text-gray-400 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                                                                                </div>
                                                                                <p className="text-[9px] font-bold text-gray-500 leading-tight uppercase opacity-80">{item.activity}</p>
                                                                                {item.location && <p className="text-[8px] font-black text-gray-400 mt-1 uppercase italic flex items-center gap-1"><FiMapPin className="w-2 h-2" /> {item.location}</p>}
                                                                            </div>
                                                                        </div>
                                                                    )).reverse()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Courier Partner</label>
                                            <select
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all appearance-none"
                                                value={shippingForm.courierName}
                                                onChange={(e) => setShippingForm({ ...shippingForm, courierName: e.target.value })}
                                            >
                                                <option value="">Select Partner...</option>
                                                <option value="Delhivery">Delhivery</option>
                                                <option value="Blue Dart">Blue Dart</option>
                                                <option value="XpressBees">XpressBees</option>
                                                <option value="Ecom Express">Ecom Express</option>
                                                <option value="Amazon Shipping">Amazon Shipping</option>
                                                <option value="India Post">India Post</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tracking Number (AWB)</label>
                                            <input
                                                type="text"
                                                placeholder="Enter Tracking ID"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all placeholder:text-gray-300 font-mono uppercase tracking-widest"
                                                value={shippingForm.awbNumber}
                                                onChange={(e) => setShippingForm({ ...shippingForm, awbNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Package Weight</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all placeholder:text-gray-300"
                                                        value={shippingForm.packageWeight}
                                                        onChange={(e) => setShippingForm({ ...shippingForm, packageWeight: e.target.value })}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">KG</span>
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={handleSaveShipping}
                                                    disabled={isSavingShipping}
                                                    className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isSavingShipping ? 'Saving...' : <><FiSave className="w-4 h-4" /> Save Details</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
          </div>

                    </div>
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div className={`fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all`}>
                    <div className="text-sm font-bold text-gray-700 hidden lg:block uppercase tracking-widest">
                        Update Order Status
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                        {(order.status === 'Pending Verification' || order.status === 'Pending') && (
                            <button onClick={() => handleUpdateStatus('Confirmed')} className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-900 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-sm hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2">
                                <FiCheckCircle className="w-4 h-4" /> Confirm Order
                            </button>
                        )}
                        {['Payment Success', 'Confirmed'].includes(order.status) && (
                            <button onClick={() => handleUpdateStatus('Packed')} className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <FiBox className="w-4 h-4" /> Mark as Packed
                            </button>
                        )}
                        {order.status === 'Packed' && (
                            <button onClick={() => handleUpdateStatus('Shipped')} className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-sm hover:bg-amber-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <FiTruck className="w-4 h-4" /> Ship Order
                            </button>
                        )}
                        {order.status === 'Shipped' && (
                            <button onClick={() => handleUpdateStatus('Delivered')} className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <FiCheckCircle className="w-4 h-4" /> Mark Delivered
                            </button>
                        )}

                        {/* Cancellation - Allowed anytime except Delivered or Cancelled */}
                        {!['Delivered', 'Cancelled'].includes(order.status) && (
                            <button onClick={() => handleUpdateStatus('Cancelled')} className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-gray-300 text-red-600 hover:bg-red-50 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                                Cancel Order
                            </button>
                        )}
                        
                        <button onClick={handleDeleteOrder} className="flex-1 sm:flex-none px-5 py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">
                            <FiTrash2 className="w-4 h-4" /> Delete Order
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderDetailsPage;
