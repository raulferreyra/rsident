
import instagramData from '../data/instagram.json';
import './Instagram.css';

interface InstagramPost {
    image: string;
    url: string;
}

// Se conservan como referencia los tipos y la integración anterior con Meta.
// La consulta a /api/instagram/media queda desactivada mientras se utilizan
// publicaciones estáticas desde instagram.json.
//
// Antes:
// fetch('http://localhost:8080/api/instagram/media?limit=6')

const imageModules = import.meta.glob<string>(
    '../assets/ig/*',
    {
        eager: true,
        query: '?url',
        import: 'default',
    },
);

export default function Instagram() {
    const posts = (instagramData as InstagramPost[])
        .filter((post) => post.image.trim() !== '' && post.url.trim() !== '')
        .slice(0, 4);

    return (
        <section className="instagram">
            <div className="instagram__header">
                <h2 className="instagram__title">Instagram</h2>

                <a
                    href="https://www.instagram.com/rsidentclothing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram__link"
                >
                    Síguenos en Instagram @rsidentclothing
                </a>
            </div>

            {posts.length > 0 && (
                <div className="instagram__grid">
                    {posts.map((post) => {
                        const imageUrl =
                            imageModules[`../assets/ig/${post.image}`];

                        if (!imageUrl) return null;

                        return (
                            <a
                                key={post.image}
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="instagram__item"
                                aria-label="Ver publicación de RSIDENT en Instagram"
                            >
                                <img
                                    src={imageUrl}
                                    alt="RSIDENT en Instagram"
                                    className="instagram__image"
                                    loading="lazy"
                                />
                            </a>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
