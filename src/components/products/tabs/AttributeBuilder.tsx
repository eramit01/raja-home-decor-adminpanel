import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiAlertCircle } from 'react-icons/fi';
import { OptionEditor } from './OptionEditor';

// Define the structure based on Product interface locally if needed or reuse
interface Attribute {
    name: string;
    type: 'select' | 'radio' | 'color';
    isRequired: boolean;
    isBaseAttribute?: boolean; // New
    affectsPrice: boolean;
    isMultiplier: boolean;
    options: any[]; // Using any[] to avoid strict type duplication, but effectively Option[]
}

interface AttributeBuilderProps {
    attributes: Attribute[];
    onChange: (attributes: Attribute[]) => void;
}

export const AttributeBuilder: React.FC<AttributeBuilderProps> = ({ attributes = [], onChange }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const handleAddAttribute = () => {
        const newAttr: Attribute = {
            name: '',
            type: 'select',
            isRequired: false,
            isBaseAttribute: false,
            affectsPrice: false,
            isMultiplier: false,
            options: []
        };
        const newAttributes = [...attributes, newAttr];
        onChange(newAttributes);
        setExpandedIndex(newAttributes.length - 1);
    };

    const handleRemoveAttribute = (index: number) => {
        if (confirm("Are you sure you want to delete this attribute and all its options?")) {
            const newAttributes = [...attributes];
            newAttributes.splice(index, 1);
            onChange(newAttributes);
            setExpandedIndex(null);
        }
    };

    const updateAttribute = (index: number, field: keyof Attribute, value: any) => {
        const newAttributes = [...attributes];

        // Strict Validation: Only one multiplier allowed
        if (field === 'isMultiplier' && value === true) {
            const existingMultiplierIndex = newAttributes.findIndex((a, i) => a.isMultiplier && i !== index);
            if (existingMultiplierIndex !== -1) {
                alert("Only one attribute can be a multiplier (e.g. Pack Size). Please disable multiplier on the other attribute first.");
                return;
            }
        }

        // Strict Validation: Only one Base Attribute allowed
        if (field === 'isBaseAttribute' && value === true) {
            newAttributes.forEach((a, i) => {
                if (i !== index) a.isBaseAttribute = false;
            });
            // Auto-disable affectsPrice if isBase (optional, but logical for clarity)
            newAttributes[index].affectsPrice = false;
        }

        newAttributes[index] = { ...newAttributes[index], [field]: value };
        onChange(newAttributes);
    };

    const updateOptions = (index: number, newOptions: any[]) => {
        updateAttribute(index, 'options', newOptions);
    };

    // Derived Logic for Validation Warnings
    const multiplierCount = attributes.filter(a => a.isMultiplier).length;

    return (
        <div className="space-y-6">

            {/* Header / Add Button */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Custom Attributes</h3>
                    <p className="text-sm text-gray-500">Configure variants like Size, Color, or Pack.</p>
                </div>
                <button
                    onClick={handleAddAttribute}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                    <FiPlus /> Add Attribute
                </button>
            </div>

            {/* Validation Warnings */}
            {multiplierCount > 1 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <FiAlertCircle />
                    <span>Error: You have multiple attributes marked as Multipliers. Only one is allowed.</span>
                </div>
            )}

            {/* Attributes List */}
            <div className="space-y-4">
                {attributes.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50">
                        <p>No attributes configured.</p>
                        <button onClick={handleAddAttribute} className="text-blue-600 font-medium hover:underline mt-2">Create your first attribute</button>
                    </div>
                ) : (
                    attributes.map((attr, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md">

                            {/* Header (Always Visible) */}
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer ${expandedIndex === index ? 'bg-blue-50 border-b border-blue-100' : 'bg-white'}`}
                                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-700 text-lg">{attr.name || 'New Attribute'}</span>
                                    <div className="flex gap-2">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full uppercase text-gray-500 font-medium">{attr.type}</span>
                                        {attr.isBaseAttribute && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">Base Price</span>}
                                        {attr.isRequired && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Required</span>}
                                        {attr.affectsPrice && !attr.isBaseAttribute && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Extra Cost</span>}
                                        {attr.isMultiplier && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Multiplier</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveAttribute(index); }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <FiTrash2 />
                                    </button>
                                    <button className="p-2 text-gray-400">
                                        {expandedIndex === index ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>
                                </div>
                            </div>

                            {/* Body (Collapsible) */}
                            {expandedIndex === index && (
                                <div className="p-4 space-y-6">

                                    {/* Configuration Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-gray-100">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Attribute Name</label>
                                            <input
                                                type="text"
                                                value={attr.name}
                                                onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                placeholder="e.g. Size"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Type</label>
                                            <select
                                                value={attr.type}
                                                onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="select">Dropdown (Select)</option>
                                                <option value="radio">Radio Buttons</option>
                                                <option value="color">Color Swatches</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={attr.isRequired}
                                                    onChange={(e) => updateAttribute(index, 'isRequired', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-sm text-gray-700">Required Selection</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={attr.affectsPrice}
                                                    onChange={(e) => updateAttribute(index, 'affectsPrice', e.target.checked)}
                                                    className="w-4 h-4 text-green-600 rounded"
                                                />
                                                <span className="text-sm text-gray-700">Do options affect price?</span>
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <label className={`flex items-center gap-2 cursor-pointer border p-2 rounded-lg w-full transition-colors ${attr.isBaseAttribute ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={attr.isBaseAttribute || false}
                                                    onChange={(e) => updateAttribute(index, 'isBaseAttribute', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <div>
                                                    <span className="block text-sm font-bold text-gray-800">Use for Base Price?</span>
                                                    <span className="block text-[10px] text-gray-500 leading-tight">Check this if the product price depends on this (e.g. Size).</span>
                                                </div>
                                            </label>
                                        </div>
                                        {!attr.isBaseAttribute && (
                                            <div className="flex items-center">
                                                <label className={`flex items-center gap-2 cursor-pointer border p-2 rounded-lg w-full transition-colors ${attr.isMultiplier ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-200' : 'bg-white border-gray-200 hover:border-yellow-300'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={attr.isMultiplier}
                                                        onChange={(e) => updateAttribute(index, 'isMultiplier', e.target.checked)}
                                                        className="w-4 h-4 text-yellow-600 rounded"
                                                    />
                                                    <div>
                                                        <span className="block text-sm font-bold text-gray-800">Is this a Pack?</span>
                                                        <span className="block text-[10px] text-gray-500 leading-tight">Multiplies the final price (e.g. Pack of 2).</span>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Option Editor */}
                                    <OptionEditor
                                        options={attr.options}
                                        onChange={(newOpts) => updateOptions(index, newOpts)}
                                        attributeType={attr.type}
                                        affectsPrice={attr.affectsPrice}
                                        isMultiplier={attr.isMultiplier}
                                        isBaseAttribute={attr.isBaseAttribute}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
