import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { publicApi } from '../api/client';
import type { CatalogItem, Product } from '../types';
import ProductGrid from '../components/ProductGrid';
import './Shop.css';

export default function Collection() {
    const { collection: collectionSlug = '' } = useParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [collections, setCollections] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');

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
                        : 'No se pudieron cargar los productos.',
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [collectionSlug]);

    const activeCollections = useMemo(
        () => collections.filter((item) =>
            products.some((product) => product.collectionId === item.id),
        ),
        [collections, products],
    );

    const collection = collections.find(
        (item) => item.slug === collectionSlug,
    );

    const filteredProducts = collection
        ? products.filter(
            (product) => product.collectionId === collection.id,
        )
        : [];

    return (
        <main className="shop-page">
            <header className="shop-page__header">
                <span>COLECCIÓN</span>
                <h1>{collection?.name ?? 'Colección'}</h1>
            </header>

            <nav className="shop-page__filters" aria-label="Colecciones">
                {activeCollections.map((item) => (
                    <Link
                        key={item.id}
                        to={`/colecciones/${item.slug}`}
                        className="shop-page__filter"
                    >
                        {item.name}
                    </Link>
                ))}
            </nav>

            {error ? (
                <p className="shop-page__message">{error}</p>
            ) : loading ? (
                <p className="shop-page__message">Cargando productos...</p>
            ) : (
                <ProductGrid
                    products={filteredProducts}
                    emptyMessage="No hay productos disponibles en esta colección."
                />
            )}
        </main>
    );
}
