import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

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

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = (input: AddCartItemInput) => {
        const key = `${input.productId}:${input.variantId}`;

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

    const value = useMemo(
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
