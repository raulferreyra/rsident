import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { publicApi } from '../api/client';
import type { CatalogItem, Product } from '../types';
import ProductGrid from '../components/ProductGrid';
import { hasDiscount } from '../utils';
import './Shop.css';

const specialFilters = [
    { label: 'Todos', slug: '' },
    { label: 'Los más vendidos', slug: 'mas-vendidos' },
    { label: 'Descuentos', slug: 'descuentos' },
    { label: 'Nuevos', slug: 'nuevos' },
];

export default function Shop() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
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
    }, []);

    const activeCategories = useMemo(
        () => categories.filter((category) =>
            products.some((product) => product.categoryId === category.id),
        ),
        [categories, products],
    );

    return (
        <main className="shop-page">
            <header className="shop-page__header">
                <span>TIENDA</span>
                <h1>Productos</h1>
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

                {activeCategories.map((category) => (
                    <Link
                        key={category.id}
                        to={`/tienda/${category.slug}`}
                        className="shop-page__filter"
                    >
                        {category.name}
                    </Link>
                ))}
            </nav>

            {error ? (
                <p className="shop-page__message">{error}</p>
            ) : loading ? (
                <p className="shop-page__message">Cargando productos...</p>
            ) : (
                <ProductGrid products={products} />
            )}
        </main>
    );
}

export function filterProducts(
    products: Product[],
    filter: string,
    categories: CatalogItem[],
) {
    if (!filter) {
        return products;
    }

    if (filter === 'descuentos') {
        return products.filter(hasDiscount);
    }

    if (filter === 'mas-vendidos') {
        return products.filter((product) => product.featured);
    }

    if (filter === 'nuevos') {
        return products.filter((product) => product.isNew);
    }

    const category = categories.find(
        (item) => item.slug === filter,
    );

    if (!category) {
        return [];
    }

    return products.filter(
        (product) => product.categoryId === category.id,
    );
}
