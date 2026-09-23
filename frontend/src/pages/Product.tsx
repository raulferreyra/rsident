import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { publicApi } from '../api/client';
import type { CatalogItem, Product } from '../types';
import { formatPrice, getImageURL, hasDiscount } from '../utils';
import './Product.css';

export default function ProductPage() {
    const { id = '' } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [category, setCategory] = useState<CatalogItem | null>(null);
    const [collection, setCollection] = useState<CatalogItem | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const [productResult, categoriesResult, collectionsResult] =
                    await Promise.all([
                        publicApi.get<Product>(`/products/${id}`),
                        publicApi.get<CatalogItem[]>('/catalog/categories'),
                        publicApi.get<CatalogItem[]>('/catalog/collections'),
                    ]);

                setProduct(productResult);
                setCategory(
                    categoriesResult.find(
                        (item) => item.id === productResult.categoryId,
                    ) ?? null,
                );
                setCollection(
                    collectionsResult.find(
                        (item) => item.id === productResult.collectionId,
                    ) ?? null,
                );

                const firstColor = productResult.colors?.[0];
                setSelectedColor(firstColor?.id ?? '');
                setSelectedSize('');
                setSelectedImage(0);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudo cargar el producto.',
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const availableSizes = useMemo(() => {
        if (!product || !selectedColor) {
            return [];
        }

        return product.variants
            .filter(
                (variant) =>
                    variant.colorId === selectedColor &&
                    variant.stock > 0,
            )
            .map((variant) => variant.size);
    }, [product, selectedColor]);

    const selectedVariant = product?.variants.find(
        (variant) =>
            variant.colorId === selectedColor &&
            variant.size === selectedSize,
    );

    if (loading) {
        return (
            <main className="product-page">
                <p className="product-page__message">Cargando producto...</p>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="product-page">
                <p className="product-page__message">
                    {error || 'Producto no encontrado.'}
                </p>
                <Link to="/tienda" className="product-page__back">
                    Volver a la tienda
                </Link>
            </main>
        );
    }

    const images = product.images
        .slice()
        .sort((a, b) => a.order - b.order);

    const currentImage = images[selectedImage] ?? images[0];

    return (
        <main className="product-page">
            <div className="product-page__breadcrumbs">
                <Link to="/">Inicio</Link>
                <span>/</span>
                <Link to="/tienda">Tienda</Link>
                {category && (
                    <>
                        <span>/</span>
                        <Link to={`/tienda/${category.slug}`}>
                            {category.name}
                        </Link>
                    </>
                )}
            </div>

            <section className="product-page__content">
                <div className="product-page__gallery">
                    <div className="product-page__main-image">
                        {currentImage?.url ? (
                            <img
                                src={getImageURL(currentImage.url)}
                                alt={currentImage.alt || product.name}
                            />
                        ) : (
                            <span>Sin imagen</span>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="product-page__thumbnails">
                            {images.map((image, index) => (
                                <button
                                    key={`${image.url}-${index}`}
                                    type="button"
                                    className={
                                        index === selectedImage
                                            ? 'product-page__thumbnail product-page__thumbnail--active'
                                            : 'product-page__thumbnail'
                                    }
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img
                                        src={getImageURL(image.url)}
                                        alt={image.alt || product.name}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-page__details">
                    <span className="product-page__eyebrow">
                        {collection?.name ?? 'RSIDENT'}
                    </span>

                    <h1>{product.name}</h1>

                    <div className="product-page__price">
                        {hasDiscount(product) && (
                            <span className="product-page__old-price">
                                {formatPrice(product.oldPrice)}
                            </span>
                        )}
                        <span>{formatPrice(product.price)}</span>
                    </div>

                    {product.description && (
                        <p className="product-page__description">
                            {product.description}
                        </p>
                    )}

                    {product.colors.length > 0 && (
                        <section className="product-page__option">
                            <h2>Color</h2>
                            <div className="product-page__colors">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        className={
                                            color.id === selectedColor
                                                ? 'product-page__color product-page__color--active'
                                                : 'product-page__color'
                                        }
                                        onClick={() => {
                                            setSelectedColor(color.id);
                                            setSelectedSize('');
                                        }}
                                    >
                                        {color.imageUrl ? (
                                            <img
                                                src={getImageURL(color.imageUrl)}
                                                alt={color.name}
                                            />
                                        ) : (
                                            <span />
                                        )}
                                        {color.name}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {product.variants.length > 0 && (
                        <section className="product-page__option">
                            <h2>Talla</h2>
                            <div className="product-page__sizes">
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                                    const available = availableSizes.includes(size);
                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            disabled={!available}
                                            className={
                                                size === selectedSize
                                                    ? 'product-page__size product-page__size--active'
                                                    : 'product-page__size'
                                            }
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {selectedVariant && (
                        <p className="product-page__stock">
                            {selectedVariant.stock} unidad(es) disponibles
                        </p>
                    )}

                    <button
                        type="button"
                        className="product-page__action"
                        disabled={
                            product.variants.length > 0 &&
                            (!selectedColor || !selectedSize || !selectedVariant)
                        }
                    >
                        Agregar al carrito
                    </button>
                </div>
            </section>
        </main>
    );
}
