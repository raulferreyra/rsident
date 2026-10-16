import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';

import {
    useLocation,
    useNavigate,
} from 'react-router-dom';

import { auth } from '../../config/firebase';
import {
    api,
    ApiError,
} from '../../api/client';

import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const message = (
            location.state as
            | { message?: string }
            | null
        )?.message;

        if (message) {
            setError(message);

            window.history.replaceState(
                {},
                '',
            );
        }
    }, [location.state]);

    useEffect(() => {
        if (!auth.currentUser) {
            return;
        }

        let active = true;

        const validateExistingSession =
            async () => {
                try {
                    await api.get(
                        '/admin/dashboard',
                    );

                    if (active) {
                        navigate(
                            '/admin/dashboard',
                            {
                                replace: true,
                            },
                        );
                    }
                } catch {
                    await signOut(auth);
                }
            };

        void validateExistingSession();

        return () => {
            active = false;
        };
    }, [navigate]);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password,
            );

            await api.get(
                '/admin/dashboard',
            );

            navigate(
                '/admin/dashboard',
                {
                    replace: true,
                },
            );
        } catch (err) {
            await signOut(auth);

            if (
                err instanceof ApiError &&
                err.status === 403
            ) {
                setError(
                    'La cuenta es válida, pero no tiene permisos de administrador.',
                );
            } else if (
                err instanceof ApiError &&
                err.status === 401
            ) {
                setError(
                    'La sesión no pudo ser validada. Intenta nuevamente.',
                );
            } else {
                setError(
                    getLoginError(err),
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="admin-login">
            <section className="admin-login__image" />

            <section className="admin-login__form-container">
                <form
                    className="admin-login__form"
                    onSubmit={handleSubmit}
                >
                    <h1>Iniciar sesión</h1>

                    <div className="admin-login__field">
                        <label htmlFor="email">
                            Correo
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(
                                    event.target.value,
                                );

                                setError('');
                            }}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="admin-login__field">
                        <label htmlFor="password">
                            Contraseña
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => {
                                setPassword(
                                    event.target.value,
                                );

                                setError('');
                            }}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <p
                            className="admin-login__error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Verificando...'
                            : 'Ingresar'}
                    </button>
                </form>
            </section>
        </main>
    );
}

function getLoginError(error: unknown) {
    if (!(error instanceof Error)) {
        return 'No se pudo iniciar sesión. Intenta nuevamente.';
    }

    if (
        error.message.includes(
            'auth/invalid-credential',
        )
    ) {
        return 'Correo o contraseña incorrectos.';
    }

    if (
        error.message.includes(
            'auth/user-disabled',
        )
    ) {
        return 'Esta cuenta se encuentra deshabilitada.';
    }

    if (
        error.message.includes(
            'auth/too-many-requests',
        )
    ) {
        return 'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.';
    }

    if (
        error.message.includes(
            'auth/network-request-failed',
        )
    ) {
        return 'No se pudo conectar con el servicio de autenticación.';
    }

    return 'No se pudo iniciar sesión. Intenta nuevamente.';
}