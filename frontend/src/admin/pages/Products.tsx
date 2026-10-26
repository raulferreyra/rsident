import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { HomeConfig } from '../../types';
import './Products.css';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    oldPrice: number;
    published: boolean;
    featured: boolean;
    isNew: boolean;
}

export default function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);

    const loadProducts = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await api.get<Product[]>(
                '/admin/products',
            );

            setProducts(result);
            const home = await api.get<HomeConfig>('/admin/home');
            setBestSellerIds(home.bestSellerIds ?? []);
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
            await api.delete(`/admin/products/${id}`);

            setProducts((current) =>
                current.filter((product) => product.id !== id),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo eliminar el producto',
            );
        }
    };

    const toggleBestSeller = async (id: string) => {
        const next = bestSellerIds.includes(id) ? bestSellerIds.filter(value => value !== id) : [...bestSellerIds, id];
        if (next.length > 8) { setError('Solo puedes seleccionar hasta 8 productos más vendidos.'); return; }
        try {
            const home = await api.get<HomeConfig>('/admin/home');
            await api.put('/admin/home', { ...home, bestSellerIds: next });
            setBestSellerIds(next);
            setError('');
        } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar Más vendidos'); }
    };

    return (
        <main className="admin-products">
            <header className="admin-products__header">
                <div>
                    <h1>Productos</h1>
                    <p>Gestiona el catálogo de productos.</p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/admin/products/new')}
                    className="admin-products__create"
                >
                    Nuevo producto
                </button>
            </header>

            {error && (
                <p className="admin-products__error">
                    {error}
                </p>
            )}

            <section className="admin-products__table-container">
                {loading ? (
                    <p>Cargando...</p>
                ) : products.length === 0 ? (
                    <p>No hay productos registrados.</p>
                ) : (
                    <table className="admin-products__table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Estado</th>
                                <th>Destacado</th>
                                <th>Más vendidos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <strong>
                                            {product.name}
                                        </strong>

                                        <small>
                                            {product.slug}
                                        </small>
                                    </td>

                                    <td>
                                        S/ {product.price.toFixed(2)}
                                    </td>

                                    <td>
                                        {product.published
                                            ? 'Publicado'
                                            : 'Borrador'}
                                    </td>

                                    <td>
                                        {product.featured ? 'Sí' : 'No'}
                                    </td>
                                    <td><input type="checkbox" aria-label={`Incluir ${product.name} en Más vendidos`} checked={bestSellerIds.includes(product.id)} onChange={() => void toggleBestSeller(product.id)} disabled={!bestSellerIds.includes(product.id) && bestSellerIds.length >= 8} /></td>

                                    <td>
                                        <div className="admin-products__actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/products/${product.id}/edit`,
                                                    )
                                                }
                                                className="admin-products__edit"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        product.id,
                                                    )
                                                }
                                                className="admin-products__delete"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}