import { api } from './api';

export interface Product {
    _id: string; // Backend ID
    id?: string; // Frontend/Mock ID compatibility
    title: string; // Changed from name to title to match frontend schema
    name?: string; // Backward compatibility
    description: string;
    shortDescription?: string;
    images: string[];
    price: number;
    originalPrice?: number;
    stock: number;
    rating: number;
    totalReviews: number;
    category: string; // String for now as per frontend usage
    categoryId?: string; // ID for editing
    status?: 'active' | 'draft' | 'archived';
    tags?: string[];
    // Dynamic Attributes
    attributes?: {
        name: string;
        type: 'select' | 'radio' | 'color';
        isRequired: boolean;
        isBaseAttribute?: boolean; // New
        affectsPrice: boolean;
        isMultiplier: boolean;
        options: {
            label: string;
            value?: string;
            absolutePrice?: number; // New
            priceAdjustment?: number;
            multiplier?: number;
            skuCode?: string;
            isDefault?: boolean;
            hexColor?: string;
        }[];
    }[];
    addOns?: {
        name: string;
        pricingMode: 'flat' | 'size_dependent';
        flatPrice?: number;
        sizePricing?: {
            sizeLabel: string;
            price: number;
        }[];
        isRequired?: boolean;
    }[];
    sku?: string;
    slug?: string;
    dimensions?: {
        height?: number;
        width?: number;
        weight?: number;
    };
    capacity?: number;
    material?: string;
    finish?: string;
    allowBackorders?: boolean;
    costPrice?: number;
    taxRate?: number;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
    };
    faqs?: {
        question: string;
        answer: string;
    }[];
    // Mobile-First PDP Specific Fields
    sizes?: Array<{ name: string; price: number }>;
    fragrances?: string[];
    packs?: Array<{
        label: string;
        quantity: number;
        pricingType: 'auto' | 'fixed' | 'discount';
        fixedPrice?: number;
        discountPercent?: number;
    }>;
    lidOption?: { enabled: boolean; price: number };
    allowMixedFragrance?: boolean;
    sections?: {
        id?: string;
        type: string;
        title?: string;
        data: any;
    }[];
}

export interface ProductsResponse {
    success: boolean;
    data: {
        products: Product[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export const productService = {
    getProducts: async (params?: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
        sort?: string;
        minPrice?: number;
        maxPrice?: number;
        rating?: number;
    }): Promise<ProductsResponse> => {
        // For now, if we are in admin, we might want to fetch ALL products including drafts
        // But sticking to the existing API structure for now
        const response = await api.get('/admin/products', { params });

        // Normalize data if needed (map name to title if title is missing)
        if (response.data && response.data.data && response.data.data.products) {
            response.data.data.products = response.data.data.products.map((p: any) => ({
                ...p,
                title: p.title || p.name || 'Untitled Product', // Ensure title exists
                id: p._id || p.id, // Ensure id exists
                category: p.category?.name || p.category, // Flatten category object to name
                categoryId: p.category?._id || (typeof p.category === 'string' ? undefined : p.category?._id)
            }));
        }
        return response.data;
    },

    getProductById: async (id: string) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    searchProducts: async (query: string, page = 1, limit = 20) => {
        const response = await api.get('/products/search', {
            params: { q: query, page, limit },
        });
        return response.data;
    },

    createProduct: async (productData: any) => {
        // Handle FormData vs JSON automatically by let axios handle it or caller
        const response = await api.post('/products', productData);
        return response.data;
    },

    updateProduct: async (id: string, productData: any) => {
        const response = await api.patch(`/products/${id}`, productData);
        return response.data;
    },

    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    }
};
