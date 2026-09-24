export const BACKEND_URL = 'http://localhost:8080';

export function getImageURL(url: string) {
    if (!url) {
        return '';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    return `${BACKEND_URL}${url}`;
}

export function formatPrice(value: number) {
    return `S/ ${value.toFixed(2)}`;
}

export function hasDiscount(product: { price: number; oldPrice: number }) {
    return product.oldPrice > product.price;
}

export function getDiscountPercentage(product: { price: number; oldPrice: number }) {
    if (!hasDiscount(product) || product.oldPrice <= 0) {
        return 0;
    }

    return Math.round((1 - product.price / product.oldPrice) * 100);
}
