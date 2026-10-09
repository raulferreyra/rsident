import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { publicApi } from './api/client';
import type { Product } from './types';

export interface CartItem {
    key: string;
    productId: string;
    variantId: string;
    productName: string;
    colorId: string;
    colorName: string;
    size: string;
    sku: string;
    price: number;
    imageUrl: string;
    quantity: number;
}

interface AddCartItemInput {
    productId: string;
    variantId: string;
    productName: string;
    colorId: string;
    colorName: string;
    size: string;
    sku: string;
    price: number;
    imageUrl: string;
}

interface CartContextValue {
    items: CartItem[];
    count: number;
    subtotal: number;
    addItem: (item: AddCartItemInput) => void;
    updateQuantity: (key: string, quantity: number) => void;
    removeItem: (key: string) => void;
    clearCart: () => void;
    refreshCart: () => Promise<CartItem[]>;
}

const STORAGE_KEY = 'rsident-cart';

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return [];
        }

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(readCart);

    const refreshCart = async () => {
        const currentItems = items;
        if (currentItems.length === 0) return [];

        const results = await Promise.all(currentItems.map(async (item) => {
            try {
                const product = await publicApi.get<Product>(`/products/${item.productId}`);
                if (!product.published) return null;
                const hasVariants = (product.variants ?? []).length > 0;
                const variant = hasVariants
                    ? product.variants.find((value) => value.id === item.variantId)
                    : null;
                if (hasVariants && !variant) return null;
                const stock = hasVariants ? (variant?.stock ?? 0) : (product.stock ?? 0);
                if (stock <= 0) return null;
                return {
                    ...item,
                    productName: product.name,
                    price: product.price,
                    colorName: variant ? (product.colors.find((color) => color.id === variant.colorId)?.name ?? '') : '',
                    size: variant?.size ?? '',
                    sku: variant?.sku ?? '',
                    imageUrl: product.images?.[0]?.url ?? item.imageUrl,
                    quantity: Math.min(item.quantity, stock),
                };
            } catch {
                return null;
            }
        }));
        const nextItems = results.filter((item): item is CartItem => item !== null && item.quantity > 0);
        setItems(nextItems);
        return nextItems;
    };

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = (input: AddCartItemInput) => {
        const key = `${input.productId}:${input.variantId || 'simple'}`;

        setItems((current) => {
            const existing = current.find((item) => item.key === key);

            if (existing) {
                return current.map((item) =>
                    item.key === key
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }

            return [
                ...current,
                {
                    ...input,
                    key,
                    quantity: 1,
                },
            ];
        });
    };

    const updateQuantity = (key: string, quantity: number) => {
        if (quantity <= 0) {
            setItems((current) =>
                current.filter((item) => item.key !== key),
            );
            return;
        }

        setItems((current) =>
            current.map((item) =>
                item.key === key
                    ? { ...item, quantity }
                    : item,
            ),
        );
    };

    const removeItem = (key: string) => {
        setItems((current) =>
            current.filter((item) => item.key !== key),
        );
    };

    const clearCart = () => setItems([]);

    const value = useMemo<CartContextValue>(
        () => ({
            items,
            count: items.reduce(
                (total, item) => total + item.quantity,
                0,
            ),
            subtotal: items.reduce(
                (total, item) =>
                    total + item.price * item.quantity,
                0,
            ),
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            refreshCart,
        }),
        [items],
    );

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart debe utilizarse dentro de CartProvider');
    }

    return context;
}
