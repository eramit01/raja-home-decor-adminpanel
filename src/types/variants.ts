export interface IVariantOption {
    _id?: string;
    label: string;
    value: string;
    priceModifier: number;
    priceType: 'absolute' | 'percentage';
    stock?: number;
    image?: string;
    meta?: string;
}

export interface IVariantGroup {
    groupName: string;
    uiType: 'button' | 'dropdown' | 'color' | 'image';
    required: boolean;
    allowMultiple: boolean;
    options: IVariantOption[];
}
