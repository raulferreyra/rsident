import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoHeader from '../assets/logo-header.png';
import { publicApi } from '../api/client';
import { useCart } from '../cart';
import type { CatalogItem, Product } from '../types';
import './Navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [collections, setCollections] = useState<CatalogItem[]>([]);
    const { count: cartCount } = useCart();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const [categoriesResult, collectionsResult, productsResult] =
                    await Promise.all([
                        publicApi.get<CatalogItem[]>('/catalog/categories'),
                        publicApi.get<CatalogItem[]>('/catalog/collections'),
                        publicApi.get<Product[]>('/products'),
                    ]);

                const products = productsResult.filter(
                    (product) => product.published,
                );

                setCategories(
                    categoriesResult.filter((category) =>
                        products.some(
                            (product) => product.categoryId === category.id,
                        ),
                    ),
                );

                setCollections(
                    collectionsResult.filter((collection) =>
                        products.some(
                            (product) => product.collectionId === collection.id,
                        ),
                    ),
                );
            } catch (error) {
                console.error('Error cargando navegación:', error);
                setCategories([]);
                setCollections([]);
            }
        };

        loadCatalog();
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <Link to="/" className="navbar__logo">
                <img src={logoHeader} alt="RSIDENT" title="RSIDENT" />
            </Link>

            <div className="navbar__item">
                <Link to="/tienda" className="navbar__link">
                    TIENDA
                </Link>

                {categories.length > 0 && (
                    <div className="navbar__submenu">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/tienda/${category.slug}`}
                                className="navbar__submenu-link"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="navbar__item">
                <Link to="/colecciones" className="navbar__link">
                    COLECCIONES
                </Link>

                {collections.length > 0 && (
                    <div className="navbar__submenu">
                        {collections.map((collection) => (
                            <Link
                                key={collection.id}
                                to={`/colecciones/${collection.slug}`}
                                className="navbar__submenu-link"
                            >
                                {collection.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Link
                to="/carrito"
                className="navbar__cart"
                aria-label="Carrito de compra"
            >
                <span className="navbar__cart-icon">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7" />
                        <circle cx="10" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                    </svg>
                </span>

                {cartCount > 0 && (
                    <span className="navbar__cart-count">
                        {Math.min(cartCount, 99)}
                    </span>
                )}
            </Link>
        </nav>
    );
}
