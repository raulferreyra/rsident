export interface CatalogItem {
    id: string;
    name: string;
    slug: string;
    active: boolean;
}

export interface ProductImage {
    url: string;
    alt: string;
    order: number;
}

export interface ProductColor {
    id: string;
    name: string;
    imageUrl: string;
    images: ProductImage[];
}

export interface ProductVariant {
    id: string;
    colorId: string;
    size: string;
    sku: string;
    stock: number;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    oldPrice: number;
    categoryId: string;
    collectionId: string;
    tagIds: string[];
    images: ProductImage[];
    colors: ProductColor[];
    variants: ProductVariant[];
    published: boolean;
    featured: boolean;
    isNew: boolean;
}
