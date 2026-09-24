import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice, getDiscountPercentage, getImageURL, hasDiscount } from '../utils';
import './ProductCard.css';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const image = product.images
        .slice()
        .sort((a, b) => a.order - b.order)[0];

    const discount = getDiscountPercentage(product);

    return (
        <Link
            to={`/producto/${product.id}`}
            className="product-card"
        >
            <div className="product-card__image-container">
                {image?.url ? (
                    <img
                        src={getImageURL(image.url)}
                        alt={image.alt || product.name}
                        className="product-card__image"
                    />
                ) : (
                    <div className="product-card__image-placeholder">
                        Sin imagen
                    </div>
                )}

                {discount > 0 && (
                    <span className="product-card__badge">
                        -{discount}%
                    </span>
                )}

                {product.isNew && !hasDiscount(product) && (
                    <span className="product-card__badge">
                        NUEVO
                    </span>
                )}
            </div>

            <div className="product-card__info">
                <h3>{product.name}</h3>

                <div className="product-card__price">
                    {hasDiscount(product) && (
                        <span className="product-card__old-price">
                            {formatPrice(product.oldPrice)}
                        </span>
                    )}

                    <span>{formatPrice(product.price)}</span>
                </div>
            </div>
        </Link>
    );
}
