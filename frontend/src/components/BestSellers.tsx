import { useEffect, useState } from 'react';
import { publicApi } from '../api/client';
import type { Product } from '../types';
import ProductGrid from './ProductGrid';
import './BestSellers.css';

export default function BestSellers() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const result = await publicApi.get<Product[]>('/products');
                const featured = result.filter((product) => product.featured);
                setProducts((featured.length > 0 ? featured : result).slice(0, 8));
            } catch (error) {
                console.error('Error cargando productos destacados:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    if (!loading && products.length === 0) {
        return null;
    }

    return (
        <section className="best-sellers">
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
        </section>
    );
}
