import { useEffect, useState } from 'react';
import './Instagram.css';

interface InstagramMedia {
    id: string;
    media_type: string;
    media_url: string;
    permalink: string;
    timestamp: string;
}

export default function Instagram() {
    const [media, setMedia] = useState<InstagramMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInstagramMedia = async () => {
            try {
                const response = await fetch(
                    'http://localhost:8080/api/instagram/media?limit=6',
                );

                if (!response.ok) {
                    throw new Error('No se pudo obtener el contenido de Instagram');
                }

                const result = await response.json();

                setMedia(result.data ?? []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error obteniendo contenido de Instagram',
                );
            } finally {
                setLoading(false);
            }
        };

        loadInstagramMedia();
    }, []);

    return (
        <section className="instagram">
            <div className="instagram__header">
                <h2 className="instagram__title">Instagram</h2>

                <a
                    href="https://www.instagram.com/rsidentclothing"
                    target="_blank"
                    rel="noreferrer"
                    className="instagram__link"
                >
                    Siguenos en Instagram @rsidentclothing
                </a>
            </div>

            {loading && (
                <p className="instagram__status">
                    Cargando publicaciones...
                </p>
            )}

            {!loading && error && (
                <p className="instagram__status">
                    {error}
                </p>
            )}

            {!loading && !error && media.length === 0 && (
                <p className="instagram__status">
                    No hay publicaciones disponibles.
                </p>
            )}

            {!loading && !error && media.length > 0 && (
                <div className="instagram__grid">
                    {media.map((item) => (
                        <a
                            key={item.id}
                            href={item.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="instagram__item"
                        >
                            <img
                                src={item.media_url}
                                alt="RSIDENT en Instagram"
                                className="instagram__image"
                            />
                        </a>
                    ))}
                </div>
            )}
        </section>
    );
}