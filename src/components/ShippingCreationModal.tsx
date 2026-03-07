import React, { useState } from 'react';
import { FiX, FiPackage, FiMapPin, FiTruck } from 'react-icons/fi';
import { Order } from '../services/order.service';

interface ShippingCreationModalProps {
    order: Order | null;
    onClose: () => void;
    // This will later be hooked into Shiprocket API
    onCreateShipment: (shipmentData: any) => Promise<void>;
}

export const ShippingCreationModal = ({ order, onClose, onCreateShipment }: ShippingCreationModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        pickupLocation: 'Primary Warehouse',
        weight: typeof order?.packageWeight === 'number' ? order.packageWeight.toString() : '1.0',
        length: order?.dimensions?.length?.toString() || '20',
        width: order?.dimensions?.width?.toString() || '15',
        height: order?.dimensions?.height?.toString() || '10',
        courier: 'Auto-Assign Best Rates',
        paymentMode: order?.paymentMethod === 'COD' ? 'COD' : 'Prepaid'
    });

    if (!order) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // API call to backend (Shiprocket Integration)
            await onCreateShipment({
                orderId: order.id,
                ...formData,
                weight: parseFloat(formData.weight),
                dimensions: {
                    length: parseFloat(formData.length),
                    width: parseFloat(formData.width),
                    height: parseFloat(formData.height)
                }
            });
            onClose();
        } catch (error) {
            console.error("Shipment Error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FiPackage className="text-primary-600" /> Create Shipment
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Order #{order.orderNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">

                        {/* Location & Courier */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    <FiMapPin className="text-gray-400" /> Pickup Location
                                </label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                                    value={formData.pickupLocation}
                                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                >
                                    <option value="Primary Warehouse">Primary Warehouse (Mumbai)</option>
                                    <option value="Secondary Store">Secondary Store (Delhi)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    <FiTruck className="text-gray-400" /> Courier Partner
                                </label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                                    value={formData.courier}
                                    onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                                >
                                    <option value="Auto-Assign Best Rates">Auto-Assign (Shiprocket AI)</option>
                                    <option value="Delhivery">Delhivery</option>
                                    <option value="XpressBees">XpressBees</option>
                                    <option value="BlueDart">Blue Dart</option>
                                    <option value="EcomExpress">Ecom Express</option>
                                </select>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Dimensions */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Package Dimensions & Weight</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Weight (kg)</label>
                                    <input
                                        type="number" step="0.1" required
                                        className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-sm"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Length (cm)</label>
                                    <input
                                        type="number" required
                                        className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-sm"
                                        value={formData.length}
                                        onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Width (cm)</label>
                                    <input
                                        type="number" required
                                        className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-sm"
                                        value={formData.width}
                                        onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Height (cm)</label>
                                    <input
                                        type="number" required
                                        className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-sm"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Note */}
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Payment Mode</p>
                                <p className="text-xs text-blue-700 mt-0.5">This shipment will be processed as {formData.paymentMode}</p>
                            </div>
                            <span className="bg-white px-3 py-1 rounded-md text-sm font-bold border shadow-sm uppercase">{formData.paymentMode}</span>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Generate Shipment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
