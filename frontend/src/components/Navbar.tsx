import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoHeader from '../assets/logo-header.png';
import { publicApi } from '../api/client';
import './Navbar.css';

interface CatalogItem {
    id: string;
    name: string;
    slug: string;
    active: boolean;
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [collections, setCollections] = useState<CatalogItem[]>([]);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const [categoriesResult, collectionsResult] = await Promise.all([
                    publicApi.get<CatalogItem[]>('/catalog/categories'),
                    publicApi.get<CatalogItem[]>('/catalog/collections'),
                ]);

                setCategories(categoriesResult);
                setCollections(collectionsResult);
            } catch (error) {
                console.error('Error cargando navegación:', error);
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
            </div>

            <div className="navbar__item">
                <Link to="/colecciones" className="navbar__link">
                    COLECCIONES
                </Link>

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
            </div>

            <Link to="/carrito" className="navbar__cart" aria-label="Carrito de compra">
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

                <span className="navbar__cart-count">
                    {Math.min(cartCount, 99)}
                </span>
            </Link>
        </nav>
    );
}