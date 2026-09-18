import { FormEvent, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { auth } from '../../config/firebase';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password,
            );

            navigate('/admin/dashboard');
        } catch {
            setError('Correo o contraseña incorrectos.');
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
                                setEmail(event.target.value);
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
                                setPassword(event.target.value);
                            }}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <p className="admin-login__error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </section>
        </main>
    );
}