import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiMove, FiBox, FiDroplet, FiList, FiCheckCircle } from 'react-icons/fi';
import { Product } from '../../../services/product.service';

interface PageBuilderTabProps {
    product: Partial<Product>;
    onChange: (updates: Partial<Product>) => void;
}

interface Section {
    id: string;
    type: string;
    title?: string;
    data: any;
}

export const PageBuilderTab: React.FC<PageBuilderTabProps> = ({ product, onChange }) => {
    const sections = product.sections || [];

    const addSection = (type: string) => {
        const newSection: Section = {
            id: Date.now().toString(),
            type,
            data: {}
        };

        if (type === 'pack_selection') {
            newSection.title = 'Pack Configuration';
            newSection.data = {
                packs: [
                    { id: 'pack-1', label: 'Pack of 1', price: product.price || 0, subText: 'Standard', isBestValue: false },
                    { id: 'pack-2', label: 'Pack of 2', price: (product.price || 0) * 2 * 0.9, subText: 'Save 10%', saveBadge: '10% OFF', isBestValue: true },
                    { id: 'pack-4', label: 'Pack of 4', price: (product.price || 0) * 4 * 0.85, subText: 'Save 15%', saveBadge: '15% OFF', isBestValue: false },
                ]
            };
        } else if (type === 'fragrance_selector') {
            newSection.title = 'Fragrances';
            newSection.data = {
                options: [
                    { id: 'rose', name: 'Rose', color: '#ff007f' },
                    { id: 'lavender', name: 'Lavender', color: '#e6e6fa' },
                    { id: 'vanilla', name: 'Vanilla', color: '#f3e5ab' },
                ]
            };
        } else if (type === 'product_specs') {
            newSection.title = 'Specifications';
            newSection.data = {
                specs: [
                    { label: 'Lid Type', value: 'With Lid' },
                    { label: 'Material', value: 'Glass' },
                ]
            };
        }

        onChange({ sections: [...sections, newSection] });
    };

    const removeSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        onChange({ sections: newSections });
    };

    const updateSectionData = (index: number, newData: any) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], data: newData };
        onChange({ sections: newSections });
    };

    const updatePack = (sectionIndex: number, packIndex: number, field: string, value: any) => {
        const section = sections[sectionIndex];
        const newPacks = [...section.data.packs];
        newPacks[packIndex] = { ...newPacks[packIndex], [field]: value };
        updateSectionData(sectionIndex, { ...section.data, packs: newPacks });
    };

    const updateFragrance = (sectionIndex: number, fragIndex: number, field: string, value: any) => {
        const section = sections[sectionIndex];
        const newOptions = [...section.data.options];
        newOptions[fragIndex] = { ...newOptions[fragIndex], [field]: value };
        updateSectionData(sectionIndex, { ...section.data, options: newOptions });
    };

    const addFragrance = (sectionIndex: number) => {
        const section = sections[sectionIndex];
        const newOptions = [...(section.data.options || []), { id: `frag-${Date.now()}`, name: 'New Scents', color: '#cccccc' }];
        updateSectionData(sectionIndex, { ...section.data, options: newOptions });
    };

    const removeFragrance = (sectionIndex: number, fragIndex: number) => {
        const section = sections[sectionIndex];
        const newOptions = section.data.options.filter((_: any, i: number) => i !== fragIndex);
        updateSectionData(sectionIndex, { ...section.data, options: newOptions });
    };

    return (
        <div className="space-y-8">
            {/* Add Section Buttons */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700 self-center">Add Feature:</span>
                <button onClick={() => addSection('pack_selection')} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:border-blue-500 hover:text-blue-600 transition-colors text-sm">
                    <FiBox /> Packs (2, 4, etc.)
                </button>
                <button onClick={() => addSection('fragrance_selector')} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:border-pink-500 hover:text-pink-600 transition-colors text-sm">
                    <FiDroplet /> Fragrances
                </button>
                <button onClick={() => addSection('product_specs')} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:border-green-500 hover:text-green-600 transition-colors text-sm">
                    <FiList /> Specifications
                </button>
            </div>

            {/* Sections List */}
            <div className="space-y-6">
                {sections.map((section, index) => (
                    <div key={section.id || index} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="p-1.5 bg-white border rounded text-gray-400"><FiMove /></span>
                                <span className="font-semibold text-gray-800">{section.title}</span>
                                <span className="text-xs text-gray-400 uppercase tracking-wider bg-gray-200 px-2 py-0.5 rounded">{section.type.replace('_', ' ')}</span>
                            </div>
                            <button onClick={() => removeSection(index)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-white">
                                <FiTrash2 />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* PACK SELECTION EDITOR */}
                            {section.type === 'pack_selection' && (
                                <div className="space-y-4">
                                    {section.data.packs?.map((pack: any, pIdx: number) => (
                                        <div key={pack.id} className="flex flex-wrap gap-4 items-end border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                            <div className="w-40">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                                                <input
                                                    type="text"
                                                    value={pack.label}
                                                    onChange={(e) => updatePack(index, pIdx, 'label', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                                <input
                                                    type="number"
                                                    value={pack.price}
                                                    onChange={(e) => updatePack(index, pIdx, 'price', Number(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Offer Badge</label>
                                                <input
                                                    type="text"
                                                    value={pack.saveBadge || ''}
                                                    onChange={(e) => updatePack(index, pIdx, 'saveBadge', e.target.value)}
                                                    placeholder="e.g. 10% OFF"
                                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={pack.isBestValue || false}
                                                    onChange={(e) => updatePack(index, pIdx, 'isBestValue', e.target.checked)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm text-gray-600">Best Value</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* FRAGRANCE EDITOR */}
                            {section.type === 'fragrance_selector' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {section.data.options?.map((frag: any, fIdx: number) => (
                                            <div key={frag.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                                                <span className="w-8 h-8 rounded-full border border-gray-300" style={{ backgroundColor: frag.color }}></span>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={frag.name}
                                                        onChange={(e) => updateFragrance(index, fIdx, 'name', e.target.value)}
                                                        className="w-full px-2 py-1 border rounded text-sm mb-1"
                                                        placeholder="Name"
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-gray-400">Color:</span>
                                                        <input
                                                            type="color"
                                                            value={frag.color}
                                                            onChange={(e) => updateFragrance(index, fIdx, 'color', e.target.value)}
                                                            className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <button onClick={() => removeFragrance(index, fIdx)} className="text-gray-400 hover:text-red-500">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addFragrance(index)} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                                        <FiPlus /> Add Fragrance
                                    </button>
                                </div>
                            )}

                            {/* SPECS EDITOR */}
                            {section.type === 'product_specs' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">Specs editor not fully implemented in demo, but data structure is ready.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {sections.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FiBox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No specific features added.</p>
                        <p className="text-xs text-gray-400 mt-1">Add packs, fragrances, or specs above.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
