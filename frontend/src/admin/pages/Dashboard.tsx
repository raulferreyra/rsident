import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { auth } from '../../config/firebase';
import { api } from '../../api/client';

import './Dashboard.css';

interface DashboardResponse {
    message: string;
    uid: string;
}

export default function Dashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [backendMessage, setBackendMessage] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const response =
                    await api.get<DashboardResponse>(
                        '/admin/dashboard',
                    );

                setBackendMessage(response.message);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error conectando con el backend',
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

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

            {loading && (
                <p>Conectando con el backend...</p>
            )}

            {!loading && error && (
                <p>{error}</p>
            )}

            {!loading && !error && (
                <>
                    <p>{backendMessage}</p>

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
                </>
            )}
        </main>
    );
}