import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { auth } from '../../config/firebase';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);

        navigate('/admin/login');
    };

    return (
        <main className="admin-dashboard">
            <header className="admin-dashboard__header">
                <div>
                    <span className="admin-dashboard__eyebrow">
                        RSIDENT
                    </span>

                    <h1>Dashboard</h1>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                >
                    Cerrar sesión
                </button>
            </header>

            <section className="admin-dashboard__content">
                <article>
                    <span>Productos</span>
                    <strong>0</strong>
                </article>

                <article>
                    <span>Pedidos</span>
                    <strong>0</strong>
                </article>

                <article>
                    <span>Clientes</span>
                    <strong>0</strong>
                </article>

                <article>
                    <span>Instagram</span>
                    <strong>—</strong>
                </article>
            </section>
        </main>
    );
}