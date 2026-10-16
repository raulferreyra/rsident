import { Link } from 'react-router-dom';

import './NotFound.css';

export default function NotFound() {
    return (
        <main className="not-found">
            <p className="not-found__code">
                404
            </p>

            <h1>
                Página no encontrada
            </h1>

            <p className="not-found__message">
                La página que buscas no existe o
                ya no está disponible.
            </p>

            <Link
                to="/"
                className="not-found__link"
            >
                Volver a la tienda
            </Link>
        </main>
    );
}