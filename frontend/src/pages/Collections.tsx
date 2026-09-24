import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { publicApi } from '../api/client';
import type { CatalogItem, Product } from '../types';
import ProductGrid from '../components/ProductGrid';
import './Shop.css';

export default function Collections() {
    const [products, setProducts] = useState<Product[]>([]);
    const [collections, setCollections] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [productsResult, collectionsResult] = await Promise.all([
                    publicApi.get<Product[]>('/products'),
                    publicApi.get<CatalogItem[]>('/catalog/collections'),
                ]);

                setProducts(productsResult);
                setCollections(collectionsResult);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudieron cargar las colecciones.',
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const activeCollections = useMemo(
        () => collections.filter((collection) =>
            products.some((product) => product.collectionId === collection.id),
        ),
        [collections, products],
    );

    return (
        <main className="shop-page">
            <header className="shop-page__header">
                <span>RSIDENT</span>
                <h1>Colecciones</h1>
            </header>

            {error ? (
                <p className="shop-page__message">{error}</p>
            ) : loading ? (
                <p className="shop-page__message">Cargando colecciones...</p>
            ) : (
                <>
                    <nav className="shop-page__filters" aria-label="Colecciones">
                        {activeCollections.map((collection) => (
                            <Link
                                key={collection.id}
                                to={`/colecciones/${collection.slug}`}
                                className="shop-page__filter"
                            >
                                {collection.name}
                            </Link>
                        ))}
                    </nav>

                    <ProductGrid products={products} />
                </>
            )}
        </main>
    );
}
