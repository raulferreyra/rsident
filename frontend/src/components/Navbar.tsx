import { Link } from 'react-router-dom';
import './Navbar.css';

const shopCategories = [
    { name: 'Los más vendidos', slug: 'los-mas-vendidos' },
    { name: 'Descuentos', slug: 'descuentos' },
    { name: 'Camisas', slug: 'camisas' },
    { name: 'Pantalones', slug: 'pantalones' },
    { name: 'Polos', slug: 'polos' },
    { name: 'Poleras y Casacas', slug: 'poleras-y-casacas' },
];

const collections = [
    { name: 'CLASSICS', slug: 'classics' },
    { name: 'AURA', slug: 'aura' },
    { name: 'CELESTIAL', slug: 'celestial' },
    { name: 'OTRAS', slug: 'otras' },
];

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar__logo">
                RSIDENT
            </Link>

            <div className="navbar__item">
                <Link to="/tienda" className="navbar__link">
                    TIENDA
                </Link>

                <div className="navbar__submenu">
                    {shopCategories.map((category) => (
                        <Link
                            key={category.slug}
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
                            key={collection.slug}
                            to={`/colecciones/${collection.slug}`}
                            className="navbar__submenu-link"
                        >
                            {collection.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}