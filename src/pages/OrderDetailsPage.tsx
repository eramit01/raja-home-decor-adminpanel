import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiPrinter, FiCheckCircle, FiPhone, FiMail, FiTag, FiTruck, FiBox, FiSave, FiCopy, FiExternalLink, FiMessageCircle, FiChevronRight } from 'react-icons/fi';
import { orderService, Order, OrderItem } from '../services/order.service';

const company = {
    name: "GLAMOUR SPA & WELLNESS",
    address: "Plot No. 42, Industrial Area Phase II, Chandigarh - 160002",
    gst: "07AAAAA0000A1Z5",
    phone: "+91 98765 43210",
    email: "fulfillment@glamourspa.com"
};

export const OrderDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [printMode, setPrintMode] = useState<'invoice' | 'label' | null>(null);

    const [shippingForm, setShippingForm] = useState({
        courierName: '',
        awbNumber: '',
        trackingUrl: '',
        packageWeight: ''
    });
    const [isSavingShipping, setIsSavingShipping] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const handlePrint = (mode: 'invoice' | 'label') => {
        setPrintMode(mode);
        setTimeout(() => {
            window.print();
            setTimeout(() => setPrintMode(null), 500);
        }, 800);
    };

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
            {/* SCREEN UI - HIDDEN DURING PRINT */}
            <div className={`no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 ${printMode ? 'hidden' : ''}`}>

                {/* 1. Order Overview (Sticky Top Summary Bar) */}
                <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-gray-200 shadow-sm mb-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                                <FiArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                        {order.orderNumber}
                                        <button onClick={() => copyToClipboard(order.orderNumber)} className="p-1 hover:bg-gray-100 rounded text-gray-400" title="Copy ID">
                                            <FiCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </h1>
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    <FiClock className="w-3 h-3" />
                                    {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${getStatusBadge(order.status)}`}>
                                {order.status}
                            </span>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${order.paymentMethod === 'Online' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {order.paymentMethod === 'Online' ? 'PREPAID' : 'COD'}
                            </span>
                            <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Total Pay</p>
                                <p className="text-xl font-black text-gray-900 leading-none">₹{order.total.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2 ml-auto md:ml-4">
                                <button onClick={() => handlePrint('invoice')} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-sm active:scale-95">
                                    <FiPrinter className="w-4 h-4" /> Invoice
                                </button>
                                <button onClick={() => handlePrint('label')} className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                                    <FiTag className="w-4 h-4" /> Label
                                </button>
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                        <div className={`absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-1000`} style={{
                            width: order.status === 'Pending' ? '0%' :
                                order.status === 'Confirmed' ? '25%' :
                                    order.status === 'Packed' ? '50%' :
                                        order.status === 'Shipped' ? '75%' :
                                            order.status === 'Delivered' ? '100%' : '0%'
                        }}></div>

                        {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                            const statuses = ['Pending Verification', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
                            const currentIdx = statuses.indexOf(order.status === 'Pending Verification' ? 'Pending' : order.status);
                            const stepIdx = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].indexOf(step);
                            const isCompleted = currentIdx >= stepIdx;
                            const isActive = currentIdx === stepIdx;

                            return (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-300'} ${isActive ? 'ring-4 ring-emerald-100' : ''}`}>
                                        {isCompleted ? <FiCheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>{step}</span>
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
                        </div>

                        {/* Logistics Section (Professional Form UI) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Logistics</h2>
                                {['Shipped', 'Delivered'].includes(order.status) && (
                                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">Dispatched</span>
                                )}
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Courier Partner</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                                        value={shippingForm.courierName}
                                        onChange={(e) => setShippingForm({ ...shippingForm, courierName: e.target.value })}
                                    >
                                        <option value="">Select Courier...</option>
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
                                        placeholder="Enter AWB Code"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-gray-300 font-mono"
                                        value={shippingForm.awbNumber}
                                        onChange={(e) => setShippingForm({ ...shippingForm, awbNumber: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight (KG)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                                            value={shippingForm.packageWeight}
                                            onChange={(e) => setShippingForm({ ...shippingForm, packageWeight: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={handleSaveShipping}
                                            disabled={isSavingShipping}
                                            className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSavingShipping ? 'Saving...' : <><FiSave className="w-4 h-4" /> Save Details</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div className={`fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex flex-col sm:flex-row items-center justify-between no-print gap-4 transition-all ${printMode ? 'hidden' : ''}`}>
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
                    </div>
                </div>

            </div>

            {/* PRINT-ONLY INVOICE (A4) */}
            <div className={`bg-white text-black font-sans p-8 ${printMode === 'invoice' ? 'block' : 'hidden'} print:block print:absolute print:top-0 print:left-0 print:w-full`} id="invoice">
                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black uppercase tracking-tight">{company.name}</h1>
                        <p className="text-[10px] font-bold uppercase text-slate-600 leading-tight pr-10">{company.address}</p>
                        <p className="text-[10px] font-bold mt-2">GSTIN: {company.gst}</p>
                        <p className="text-[10px] font-medium mt-1">E: {company.email} | P: {company.phone}</p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                        <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">TAX INVOICE</h2>
                        <p className="text-xs font-bold uppercase">Invoice No: {order.orderNumber.slice(-10).toUpperCase()}</p>
                        <p className="text-xs font-bold uppercase">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Billing & Shipping Details</p>
                        <h3 className="text-sm font-black uppercase mb-1">{order.customer.name}</h3>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase max-w-xs">{order.customer.address}</p>
                        <p className="text-[11px] font-black mt-3">CONTACT: {order.customer.phone}</p>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <div className="border border-slate-200 p-4 rounded-lg flex gap-8 bg-slate-50/50">
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Payment</p>
                                <p className="text-xs font-black uppercase">{order.paymentMethod}</p>
                            </div>
                            <div className="text-center border-l border-slate-200 pl-8">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                <p className="text-xs font-black uppercase">{order.paymentStatus}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <table className="w-full mb-8 border-collapse">
                    <thead>
                        <tr className="bg-black text-white text-[9px] font-bold uppercase">
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-center w-16">Qty</th>
                            <th className="px-4 py-2 text-right w-24">Unit Price</th>
                            <th className="px-4 py-2 text-right w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-b border-black">
                        {order.items.map((item: OrderItem, idx: number) => (
                            <tr key={idx}>
                                <td className="px-4 py-3">
                                    <p className="text-xs font-black uppercase mb-1">{typeof item.name === 'object' ? JSON.stringify(item.name) : String(item.name)}</p>
                                    <div className="flex flex-wrap gap-2 opacity-60">
                                        {item.pack && <span className="text-[8px] font-bold uppercase">Pack: {formatValue(item.pack.label)}</span>}
                                        {item.variant && <span className="text-[8px] font-bold uppercase">Size: {formatValue(item.variant.label)}</span>}
                                        {item.fragrance && <span className="text-[8px] font-bold uppercase">Fragrance: {formatValue(item.fragrance)}</span>}
                                        {item.selectedAttributes && Object.entries(item.selectedAttributes).map(([k, v]: any) => (
                                            <span key={k} className="text-[8px] font-bold uppercase">{k}: {formatValue(v)}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-bold">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-xs font-bold">₹{item.price.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-xs font-black">₹{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end pt-4">
                    <div className="w-72 space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>Subtotal</span>
                            <span className="text-slate-900">₹{(order.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>Output CGST (9.0%)</span>
                            <span className="text-slate-900">₹{((order.subtotal || 0) * 0.09).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>Output SGST (9.0%)</span>
                            <span className="text-slate-900">₹{((order.subtotal || 0) * 0.09).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-2">
                            <span>Shipping</span>
                            <span className="text-slate-900">{order.shippingCharges === 0 ? '0.00' : `₹${order.shippingCharges?.toLocaleString()}`}</span>
                        </div>
                        <div className="pt-4 border-t-2 border-black flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Grand Total</p>
                                <p className="text-4xl font-black tracking-tighter leading-none">₹{order.total.toLocaleString()}</p>
                            </div>
                            <div className="text-center pb-1">
                                <div className="w-32 h-1 border-b border-black mb-1"></div>
                                <p className="text-[7px] font-black uppercase">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRINT-ONLY LABEL (4x6 thermal) */}
            <div className={`bg-white text-black font-sans p-6 ${printMode === 'label' ? 'block' : 'hidden'} print:block print:absolute print:top-0 print:left-0 w-[100mm] h-[150mm]`} id="label">
                <div className="border-[4px] border-black p-4 h-full flex flex-col">
                    <div className="flex justify-between items-start border-b-[4px] border-black pb-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-black uppercase leading-tight">{company.name}</h1>
                            <p className="text-[9px] font-black mt-1 uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block">{order.paymentMethod === 'Online' ? 'Prepaid Shipment' : 'COD Shipment'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black uppercase border-2 border-black px-4 py-1">{order.paymentMethod === 'Online' ? 'PREPAID' : 'COD'}</span>
                            <p className="text-[10px] font-black mt-3 uppercase font-mono tracking-tighter">{order.orderNumber.toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 py-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Deliver To:</p>
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-[0.9] border-b-[2px] border-black pb-4">{order.customer.name}</h2>
                        <p className="text-2xl font-black leading-tight uppercase font-mono tracking-tighter pr-4 italic">{order.customer.address}</p>
                        <p className="text-3xl font-black mt-8 font-mono border-2 border-black p-2 inline-block">TEL: {order.customer.phone}</p>
                    </div>

                    <div className="border-[4px] border-black p-4 flex flex-col items-center gap-4 bg-white mt-auto">
                        <img src={`https://barcodeapi.org/api/code128/${order.orderNumber.toUpperCase()}?height=100&width=800&scale=3`} alt="Barcode" className="w-full h-24 grayscale" />
                        <p className="text-[18px] font-black tracking-[0.8em] font-mono leading-none">{order.orderNumber.toUpperCase()}</p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-6 items-end">
                        <div className="border-2 border-black p-2 bg-white self-start w-24">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.orderNumber}`} alt="QR" className="w-full grayscale" />
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase opacity-40">Item Density</p>
                            <p className="text-4xl font-black leading-none">{order.items.reduce((acc: number, i: OrderItem) => acc + i.quantity, 0)} <span className="text-sm">Units</span></p>
                            {order.packageWeight && (
                                <p className="text-xl font-black leading-none">{order.packageWeight} KG</p>
                            )}
                            <div className="pt-4 border-t border-black opacity-20">
                                <p className="text-[8px] font-bold uppercase tracking-widest">Seller Marketplace ID</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    #invoice { display: block !important; }
                    #label { display: block !important; }
                    @page { margin: 0; }
                }
                `
            }} />
        </div>
    );
};

export default OrderDetailsPage;
