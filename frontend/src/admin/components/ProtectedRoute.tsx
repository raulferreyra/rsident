import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '../../config/firebase';
import { api } from '../../api/client';

export default function ProtectedRoute() {
    const [user, loading] = useAuthState(auth);

    const [authorizing, setAuthorizing] =
        useState(true);

    const [authorized, setAuthorized] =
        useState(false);

    useEffect(() => {
        let active = true;

        const validateAdmin = async () => {
            if (!user) {
                if (active) {
                    setAuthorized(false);
                    setAuthorizing(false);
                }

                return;
            }

            setAuthorizing(true);

            try {
                await api.get('/admin/dashboard');

                if (active) {
                    setAuthorized(true);
                }
            } catch {
                if (active) {
                    setAuthorized(false);
                }
            } finally {
                if (active) {
                    setAuthorizing(false);
                }
            }
        };

        void validateAdmin();

        return () => {
            active = false;
        };
    }, [user]);

    if (loading || authorizing) {
        return (
            <main className="admin-route-loading">
                <p>Verificando acceso...</p>
            </main>
        );
    }

    if (!user || !authorized) {
        return (
            <Navigate
                to="/admin/login"
                replace
            />
        );
    }

    return <Outlet />;
}