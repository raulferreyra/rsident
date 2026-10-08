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

export type PaymentStatus =
    | 'pending_review'
    | 'approved'
    | 'rejected';

export type OrderStatus =
    | 'pending_review'
    | 'confirmed'
    | 'preparing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'rejected';

export type ReceiptStatus =
    | 'pending'
    | 'sent';

export interface OrderItem {
    productId: string;
    variantId: string;
    productName: string;
    colorName: string;
    size: string;
    sku: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerEmail: string;
    shippingZone: string;
    shippingCost: number;
    address: string;
    pickupName: string;
    pickupDni: string;
    courier: string;
    items: OrderItem[];
    subtotal: number;
    total: number;
    paymentProofUrl: string;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    receiptStatus: ReceiptStatus;
    customerEmailSent: boolean;
    companyEmailSent: boolean;
    createdAt: string;
    updatedAt: string;
}