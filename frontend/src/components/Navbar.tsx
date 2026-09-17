import { Link } from 'react-router-dom';
import './Navbar.css';

const shopCategories = [
    'Los más vendidos',
    'Descuentos',
    'Camisas',
    'Pantalones',
    'Polos',
    'Poleras y Casacas',
];

const collections = [
    'CLASSICS',
    'AURA',
    'CELESTIAL',
    'OTRAS',
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
                            key={category}
                            to={`/tienda/${category
                                .toLowerCase()
                                .replace(/\s+/g, '-')
                                .replace(/á/g, 'a')
                                .replace(/í/g, 'i')
                                .replace(/ó/g, 'o')
                                .replace(/é/g, 'e')}`}
                            className="navbar__submenu-link"
                        >
                            {category}
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
                            key={collection}
                            to={`/colecciones/${collection.toLowerCase()}`}
                            className="navbar__submenu-link"
                        >
                            {collection}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}