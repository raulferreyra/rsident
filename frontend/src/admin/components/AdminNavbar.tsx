import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import { auth } from '../../config/firebase';
import './AdminNavbar.css';

const links = [
    {
        label: 'Dashboard',
        path: '/admin/dashboard',
    },
    {
        label: 'Categorías',
        path: '/admin/categories',
    },
    {
        label: 'Colecciones',
        path: '/admin/collections',
    },
    {
        label: 'Etiquetas',
        path: '/admin/tags',
    },
    {
        label: 'Productos',
        path: '/admin/products',
    },
];

export default function AdminNavbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin/login');
    };

    return (
        <nav className="admin-navbar">
            <div className="admin-navbar__brand">
                RSIDENT ADMIN
            </div>

            <div className="admin-navbar__links">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={
                            location.pathname === link.path
                                ? 'admin-navbar__link admin-navbar__link--active'
                                : 'admin-navbar__link'
                        }
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className="admin-navbar__actions">
                <Link
                    to="/"
                    className="admin-navbar__public"
                >
                    Ver tienda
                </Link>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="admin-navbar__logout"
                >
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
}