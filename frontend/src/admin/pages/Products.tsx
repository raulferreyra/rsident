import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../../api/client';

import './Products.css';

interface Product {
    id: string;
    name: string;
    price: number;
    oldPrice: number;
    published: boolean;
    featured: boolean;
    isNew: boolean;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadProducts = async () => {
        setLoading(true);

        try {
            const result = await api.get<Product[]>(
                '/admin/products',
            );

            setProducts(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudieron cargar los productos',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm(
            '¿Deseas eliminar este producto?',
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(
                `/admin/products/${id}`,
            );

            await loadProducts();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo eliminar el producto',
            );
        }
    };

    return (
        <main className="admin-products">
            <header className="admin-products__header">
                <div>
                    <span>CATÁLOGO</span>
                    <h1>Productos</h1>
                </div>

                <Link to="/admin/products/new">
                    Nuevo producto
                </Link>
            </header>

            {error && (
                <p className="admin-products__error">
                    {error}
                </p>
            )}

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="admin-products__table">
                    <div className="admin-products__row admin-products__row--header">
                        <span>Producto</span>
                        <span>Precio</span>
                        <span>Estado</span>
                        <span />
                    </div>

                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="admin-products__row"
                        >
                            <span>{product.name}</span>

                            <span>
                                S/ {product.price.toFixed(2)}
                            </span>

                            <span>
                                {product.published
                                    ? 'Publicado'
                                    : 'Oculto'}
                            </span>

                            <span className="admin-products__actions">
                                <Link
                                    to={`/admin/products/${product.id}`}
                                >
                                    Editar
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDelete(product.id);
                                    }}
                                >
                                    Eliminar
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}