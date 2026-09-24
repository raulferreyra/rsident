import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { publicApi } from '../api/client';
import type { CatalogItem, Product } from '../types';
import ProductGrid from '../components/ProductGrid';
import { filterProducts } from './Shop';
import './Shop.css';

const specialFilters = [
    { label: 'Todos', slug: '' },
    { label: 'Los más vendidos', slug: 'mas-vendidos' },
    { label: 'Descuentos', slug: 'descuentos' },
    { label: 'Nuevos', slug: 'nuevos' },
];

export default function ShopFilter() {
    const { category = '' } = useParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const [productsResult, categoriesResult] = await Promise.all([
                    publicApi.get<Product[]>('/products'),
                    publicApi.get<CatalogItem[]>('/catalog/categories'),
                ]);

                setProducts(productsResult);
                setCategories(categoriesResult);
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
    }, [category]);

    const activeCategories = useMemo(
        () => categories.filter((item) =>
            products.some((product) => product.categoryId === item.id),
        ),
        [categories, products],
    );

    const filteredProducts = useMemo(
        () => filterProducts(products, category, categories),
        [products, category, categories],
    );

    const title =
        specialFilters.find((item) => item.slug === category)?.label ??
        categories.find((item) => item.slug === category)?.name ??
        'Productos';

    return (
        <main className="shop-page">
            <header className="shop-page__header">
                <span>TIENDA</span>
                <h1>{title}</h1>
            </header>

            <nav className="shop-page__filters" aria-label="Filtros de tienda">
                {specialFilters.map((filter) => (
                    <Link
                        key={filter.slug || 'all'}
                        to={filter.slug ? `/tienda/${filter.slug}` : '/tienda'}
                        className="shop-page__filter"
                    >
                        {filter.label}
                    </Link>
                ))}

                {activeCategories.map((item) => (
                    <Link
                        key={item.id}
                        to={`/tienda/${item.slug}`}
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
                    emptyMessage="No hay productos disponibles para este filtro."
                />
            )}
        </main>
    );
}
