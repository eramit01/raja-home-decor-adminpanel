import React from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';

interface Option {
    label: string;
    value?: string;
    priceAdjustment?: number;
    absolutePrice?: number; // New
    multiplier?: number;
    skuCode?: string;
    isDefault?: boolean;
    hexColor?: string;
}

interface OptionEditorProps {
    options: Option[];
    onChange: (options: Option[]) => void;
    attributeType: 'select' | 'radio' | 'color';
    affectsPrice: boolean;
    isMultiplier: boolean;
    isBaseAttribute?: boolean; // New
}

export const OptionEditor: React.FC<OptionEditorProps> = ({
    options,
    onChange,
    attributeType,
    affectsPrice,
    isMultiplier,
    isBaseAttribute
}) => {
    const handleAddOption = () => {
        const newOption: Option = {
            label: '',
            priceAdjustment: 0,
            multiplier: 1,
            isDefault: options.length === 0 // Make first option default
        };
        onChange([...options, newOption]);
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        onChange(newOptions);
    };

    const updateOption = (index: number, field: keyof Option, value: any) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };

        // Handle Default Toggle
        if (field === 'isDefault' && value === true) {
            // Uncheck others
            newOptions.forEach((opt, i) => {
                if (i !== index) opt.isDefault = false;
            });
        }

        onChange(newOptions);
    };

    return (
        <div className="space-y-3 mt-2">
            <div className="flex justify-between items-center">
                <h5 className="text-sm font-semibold text-gray-700">Options ({options.length})</h5>
                <button
                    onClick={handleAddOption}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
                >
                    <FiPlus /> Add Option
                </button>
            </div>

            <div className="space-y-2">
                {options.map((option, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">

                        {/* Label */}
                        <div className="flex-1 min-w-[120px]">
                            <label className="text-[10px] text-gray-400 uppercase font-bold">Label *</label>
                            <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                className="w-full text-sm px-2 py-1 border rounded bg-white focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g. Small"
                            />
                        </div>

                        {/* Color Picker (if color type) */}
                        {attributeType === 'color' && (
                            <div className="w-20">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Color</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="color"
                                        value={option.hexColor || '#000000'}
                                        onChange={(e) => updateOption(idx, 'hexColor', e.target.value)}
                                        className="w-6 h-8 p-0 border rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={option.hexColor || ''}
                                        onChange={(e) => updateOption(idx, 'hexColor', e.target.value)}
                                        className="w-full text-xs px-1 py-1 border rounded"
                                        placeholder="#000"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Price Configuration */}
                        {isBaseAttribute ? (
                            <div className="w-24">
                                <label className="text-[10px] text-gray-400 uppercase font-bold text-blue-600">Base Price</label>
                                <input
                                    type="number"
                                    value={option.absolutePrice || ''}
                                    onChange={(e) => updateOption(idx, 'absolutePrice', Number(e.target.value))}
                                    className="w-full text-sm px-2 py-1 border rounded bg-blue-50 focus:ring-blue-500 font-bold"
                                    placeholder="0"
                                />
                            </div>
                        ) : affectsPrice ? (
                            <div className="w-24">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Price (+/-)</label>
                                <input
                                    type="number"
                                    value={option.priceAdjustment}
                                    onChange={(e) => updateOption(idx, 'priceAdjustment', Number(e.target.value))}
                                    className="w-full text-sm px-2 py-1 border rounded bg-white"
                                />
                            </div>
                        ) : null}

                        {/* Multiplier */}
                        {isMultiplier && (
                            <div className="w-20">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Multiplier</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={option.multiplier}
                                    onChange={(e) => updateOption(idx, 'multiplier', Number(e.target.value))}
                                    className="w-full text-sm px-2 py-1 border rounded bg-white bg-yellow-50 font-medium"
                                />
                            </div>
                        )}

                        {/* Default Toggle */}
                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-1 cursor-pointer" title="Selected by default">
                                <input
                                    type="checkbox"
                                    checked={option.isDefault || false}
                                    onChange={(e) => updateOption(idx, 'isDefault', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-[10px] text-gray-500">Default</span>
                            </label>
                        </div>

                        {/* Remove Button */}
                        <button
                            onClick={() => handleRemoveOption(idx)}
                            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 rounded opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FiX />
                        </button>
                    </div>
                ))}

                {options.length === 0 && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <span className="text-xs text-gray-400">No options added yet.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
