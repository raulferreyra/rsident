import { useEffect, useState } from 'react';
import { publicApi } from '../api/client';
import type { Product, HomeConfig } from '../types';
import ProductGrid from './ProductGrid';
import HomeMessage from './HomeMessage';
import './BestSellers.css';

export default function BestSellers() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<HomeConfig | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const [result, home] = await Promise.all([publicApi.get<Product[]>('/products'), publicApi.get<HomeConfig>('/home')]);
                setConfig(home);
                const selected = (home.bestSellerIds ?? []).map((id) => result.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));
                const featured = result.filter((product) => product.featured);
                setProducts((selected.length ? selected : featured.length ? featured : result).slice(0, 8));
            } catch (error) {
                console.error('Error cargando productos destacados:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

        return (
        <>
        <HomeMessage message={config?.message ?? ''} />
        {(loading || products.length > 0) && <section className="best-sellers">
            <h2 className="best-sellers__title">
                Los más vendidos
            </h2>

            {loading ? (
                <p className="best-sellers__loading">
                    Cargando productos...
                </p>
            ) : (
                <ProductGrid products={products} />
            )}
        </section>}
        </>
    );
}
