import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface SizePrice {
    sizeLabel: string;
    price: number;
}

interface AddOn {
    name: string;
    pricingMode: 'flat' | 'size_dependent';
    flatPrice?: number;
    sizePricing?: SizePrice[]; // e.g. [{ sizeLabel: 'Small', price: 20 }]
    isRequired?: boolean;
}

interface AddOnManagerProps {
    addOns: AddOn[];
    onChange: (addOns: AddOn[]) => void;
    // We need base attributes to populate size options if size-dependent
    baseAttributeOptions?: string[];
}

export const AddOnManager: React.FC<AddOnManagerProps> = ({ addOns = [], onChange, baseAttributeOptions = [] }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const handleAdd = () => {
        const newAddOn: AddOn = {
            name: '',
            pricingMode: 'flat',
            flatPrice: 0,
            sizePricing: [],
            isRequired: false
        };
        const newList = [...addOns, newAddOn];
        onChange(newList);
        setExpandedIndex(newList.length - 1);
    };

    const handleRemove = (index: number) => {
        if (confirm("Delete this add-on?")) {
            const newList = [...addOns];
            newList.splice(index, 1);
            onChange(newList);
            setExpandedIndex(null);
        }
    };

    const updateAddOn = (index: number, field: keyof AddOn, value: any) => {
        const newList = [...addOns];
        newList[index] = { ...newList[index], [field]: value };
        onChange(newList);
    };

    // Helper to update specific size price
    const updateSizePrice = (addOnIndex: number, sizeLabel: string, price: number) => {
        const newList = [...addOns];
        const currentPricing = newList[addOnIndex].sizePricing || [];

        const existingIdx = currentPricing.findIndex(p => p.sizeLabel === sizeLabel);
        if (existingIdx >= 0) {
            currentPricing[existingIdx].price = price;
        } else {
            currentPricing.push({ sizeLabel, price });
        }

        newList[addOnIndex].sizePricing = currentPricing;
        onChange(newList);
    };

    const getPriceForSize = (addOn: AddOn, size: string) => {
        return addOn.sizePricing?.find(p => p.sizeLabel === size)?.price || 0;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Add-Ons & Extras</h3>
                    <p className="text-sm text-gray-500">Configure optional extras like Lids, Gift Wrapping, etc.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 shadow-sm transition-all"
                >
                    <FiPlus /> Add Add-On
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {addOns.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50">
                        <p>No add-ons configured.</p>
                        <button onClick={handleAdd} className="text-purple-600 font-medium hover:underline mt-2">Create your first add-on</button>
                    </div>
                ) : (
                    addOns.map((addOn, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                            {/* Header */}
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer ${expandedIndex === index ? 'bg-purple-50 border-b border-purple-100' : 'bg-white'}`}
                                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-700 text-lg">{addOn.name || 'New Add-On'}</span>
                                    <div className="flex gap-2">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full uppercase text-gray-500 font-medium">{addOn.pricingMode === 'flat' ? 'Flat Price' : 'Size Dependent'}</span>
                                        {addOn.isRequired && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Required</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    >
                                        <FiTrash2 />
                                    </button>
                                    <button className="p-2 text-gray-400">
                                        {expandedIndex === index ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            {expandedIndex === index && (
                                <div className="p-4 space-y-6">
                                    {/* Name & Mode Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Add-On Name</label>
                                            <input
                                                type="text"
                                                value={addOn.name}
                                                onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                                                placeholder="e.g. Wooden Lid"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Pricing Type</label>
                                            <select
                                                value={addOn.pricingMode}
                                                onChange={(e) => updateAddOn(index, 'pricingMode', e.target.value as any)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                            >
                                                <option value="flat">Same price for all sizes</option>
                                                <option value="size_dependent">Different price per size</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Pricing Config */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {addOn.pricingMode === 'flat' ? (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Price to Add (₹)</label>
                                                <p className="text-xs text-gray-500 mb-2">This amount will be added to the product price.</p>
                                                <input
                                                    type="number"
                                                    value={addOn.flatPrice || 0}
                                                    onChange={(e) => updateAddOn(index, 'flatPrice', Number(e.target.value))}
                                                    className="w-full md:w-48 px-3 py-2 border rounded-lg bg-white font-bold text-gray-800"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3">Set Price for Each Size</label>
                                                {baseAttributeOptions.length === 0 ? (
                                                    <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg text-sm border border-amber-100">
                                                        <FiAlertCircle className="mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="font-bold">No Base Attribute configured.</p>
                                                            <p>To use different prices per size, go to the <strong>Variants & Options</strong> tab and create an attribute like "Size" with "Use for Base Price" checked.</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {baseAttributeOptions.map((size) => (
                                                            <div key={size} className="bg-white p-2 rounded-lg border border-gray-200">
                                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{size}</label>
                                                                <div className="flex items-center">
                                                                    <span className="bg-gray-100 border border-r-0 rounded-l px-2 py-2 text-gray-500 text-sm">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        value={getPriceForSize(addOn, size)}
                                                                        onChange={(e) => updateSizePrice(index, size, Number(e.target.value))}
                                                                        className="w-full px-2 py-2 border rounded-r focus:ring-1 focus:ring-purple-500 outline-none text-sm font-bold"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            checked={addOn.isRequired}
                                            onChange={(e) => updateAddOn(index, 'isRequired', e.target.checked)}
                                            className="w-4 h-4 text-purple-600 rounded"
                                            id={`req-${index}`}
                                        />
                                        <label htmlFor={`req-${index}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                            Required for all orders?
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
