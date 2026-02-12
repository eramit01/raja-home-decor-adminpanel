import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { IVariantGroup, IVariantOption } from '../../../types/variants';
import { Product } from '../../../services/product.service';

interface ConfigurationTabProps {
    product: Partial<Product>;
    onChange: (updates: Partial<Product>) => void;
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({ product, onChange }) => {
    const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);

    const variants = product.variants || [];

    const handleAddGroup = () => {
        const newGroup: IVariantGroup = {
            groupName: 'New Variant Group',
            uiType: 'button',
            required: true,
            allowMultiple: false,
            options: []
        };
        onChange({ variants: [...variants, newGroup] });
        setActiveGroupIndex(variants.length); // Select new group
    };

    const handleRemoveGroup = (index: number) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        onChange({ variants: newVariants });
        if (activeGroupIndex === index) setActiveGroupIndex(null);
    };

    const updateGroup = (index: number, updates: Partial<IVariantGroup>) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], ...updates };
        onChange({ variants: newVariants });
    };

    // --- Option Handlers ---
    const handleAddOption = (groupIndex: number) => {
        const newOption: IVariantOption = {
            label: 'New Option',
            value: 'new-option',
            priceModifier: 0,
            priceType: 'absolute'
        };
        const newVariants = [...variants];
        newVariants[groupIndex].options.push(newOption);
        onChange({ variants: newVariants });
    };

    const removeOption = (groupIndex: number, optionIndex: number) => {
        const newVariants = [...variants];
        newVariants[groupIndex].options.splice(optionIndex, 1);
        onChange({ variants: newVariants });
    };

    const updateOption = (groupIndex: number, optionIndex: number, field: keyof IVariantOption, value: any) => {
        const newVariants = [...variants];
        newVariants[groupIndex].options[optionIndex] = {
            ...newVariants[groupIndex].options[optionIndex],
            [field]: value
        };
        onChange({ variants: newVariants });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Product Variants</h3>
                <button
                    onClick={handleAddGroup}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <FiPlus /> Add Variant Group
                </button>
            </div>

            {variants.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-500">
                    <p>No variants configured. Add groups like "Size", "Color", or "Pack".</p>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar: Group List */}
                    <div className="w-full md:w-1/3 space-y-3">
                        {variants.map((group, index) => (
                            <div
                                key={index}
                                onClick={() => setActiveGroupIndex(index)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center group
                  ${activeGroupIndex === index ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300'}
                `}
                            >
                                <div>
                                    <div className="font-semibold text-gray-900">{group.groupName}</div>
                                    <div className="text-xs text-gray-500">{group.options.length} options • {group.uiType}</div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveGroup(index); }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Main Area: Group Details */}
                    <div className="w-full md:w-2/3 bg-white border border-gray-200 rounded-xl p-6">
                        {activeGroupIndex !== null && variants[activeGroupIndex] ? (
                            <div className="space-y-6">
                                {/* Group Config */}
                                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Group Name</label>
                                        <input
                                            value={variants[activeGroupIndex].groupName}
                                            onChange={(e) => updateGroup(activeGroupIndex, { groupName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Display Style</label>
                                        <select
                                            value={variants[activeGroupIndex].uiType}
                                            onChange={(e) => updateGroup(activeGroupIndex, { uiType: e.target.value as any })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="button">Buttons</option>
                                            <option value="dropdown">Dropdown</option>
                                            <option value="color">Color Swatches</option>
                                            <option value="image">Image Cards</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                                            <input
                                                type="checkbox"
                                                checked={variants[activeGroupIndex].required}
                                                onChange={(e) => updateGroup(activeGroupIndex, { required: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            Required
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                                            <input
                                                type="checkbox"
                                                checked={variants[activeGroupIndex].allowMultiple}
                                                onChange={(e) => updateGroup(activeGroupIndex, { allowMultiple: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            Multi-select
                                        </label>
                                    </div>
                                </div>

                                {/* Options List */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-gray-800">Options</h4>
                                        <button onClick={() => handleAddOption(activeGroupIndex)} className="text-sm text-blue-600 font-medium hover:underline">+ Add Option</button>
                                    </div>

                                    <div className="space-y-2">
                                        {variants[activeGroupIndex].options.map((option, optIdx) => (
                                            <div key={optIdx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg relative group">
                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 uppercase">Label</label>
                                                        <input
                                                            value={option.label}
                                                            onChange={(e) => updateOption(activeGroupIndex, optIdx, 'label', e.target.value)}
                                                            className="w-full text-sm px-2 py-1 border rounded bg-white"
                                                            placeholder="e.g. Small"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 uppercase">Value</label>
                                                        <input
                                                            value={option.value}
                                                            onChange={(e) => updateOption(activeGroupIndex, optIdx, 'value', e.target.value)}
                                                            className="w-full text-sm px-2 py-1 border rounded bg-white text-gray-600"
                                                            placeholder="e.g. small-size"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 uppercase">Price Mod</label>
                                                        <div className="flex">
                                                            <select
                                                                value={option.priceType}
                                                                onChange={(e) => updateOption(activeGroupIndex, optIdx, 'priceType', e.target.value)}
                                                                className="w-12 text-xs border rounded-l bg-gray-100 px-1"
                                                            >
                                                                <option value="absolute">₹</option>
                                                                <option value="percentage">%</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={option.priceModifier}
                                                                onChange={(e) => updateOption(activeGroupIndex, optIdx, 'priceModifier', Number(e.target.value))}
                                                                className="w-full text-sm px-2 py-1 border rounded-r bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    {variants[activeGroupIndex].uiType === 'color' && (
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 uppercase">Color (Hex)</label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="color"
                                                                    value={option.meta || '#000000'}
                                                                    onChange={(e) => updateOption(activeGroupIndex, optIdx, 'meta', e.target.value)}
                                                                    className="w-8 h-8 rounded border p-0 overflow-hidden"
                                                                />
                                                                <input
                                                                    value={option.meta || ''}
                                                                    onChange={(e) => updateOption(activeGroupIndex, optIdx, 'meta', e.target.value)}
                                                                    className="w-full text-xs border rounded px-1"
                                                                    placeholder="#000000"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => removeOption(activeGroupIndex, optIdx)}
                                                    className="text-gray-400 hover:text-red-500 p-1"
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        ))}
                                        {variants[activeGroupIndex].options.length === 0 && (
                                            <div className="text-center text-sm text-gray-400 py-4 italic">No options added yet</div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">Select a group to edit</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
