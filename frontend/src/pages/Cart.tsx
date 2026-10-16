import { Link } from 'react-router-dom';

import { useCart } from '../cart';
import { formatPrice, getImageURL } from '../utils';
import './Cart.css';

export default function Cart() {
    const { items, subtotal, updateQuantity, removeItem } = useCart();

    return (
        <main className="cart-page">
            <div className="cart-page__header">
                <span>RSIDENT</span>
                <h1>Carrito</h1>
            </div>

            {items.length === 0 ? (
                <section className="cart-page__empty">
                    <h2>Tu carrito está vacío</h2>
                    <p>Agrega una prenda para comenzar tu compra.</p>
                    <Link to="/tienda" className="cart-page__button">
                        Ver tienda
                    </Link>
                </section>
            ) : (
                <div className="cart-page__layout">
                    <section className="cart-page__items">
                        {items.map((item) => (
                            <article key={item.key} className="cart-item">
                                <Link to={`/producto/${item.productId}`} className="cart-item__image">
                                    {item.imageUrl ? (
                                        <img
                                            src={getImageURL(item.imageUrl)}
                                            alt={item.productName}
                                        />
                                    ) : (
                                        <span>Sin imagen</span>
                                    )}
                                </Link>

                                <div className="cart-item__content">
                                    <div>
                                        <Link
                                            to={`/producto/${item.productId}`}
                                            className="cart-item__name"
                                        >
                                            {item.productName}
                                        </Link>

                                        {item.colorName && (
                                            <p>Color: {item.colorName}</p>
                                        )}

                                        {item.size && (
                                            <p>Talla: {item.size}</p>
                                        )}

                                        {item.sku && (
                                            <p>SKU: {item.sku}</p>
                                        )}
                                    </div>

                                    <div className="cart-item__bottom">
                                        <div className="cart-item__quantity">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.key,
                                                        item.quantity - 1,
                                                    )
                                                }
                                                aria-label="Reducir cantidad"
                                            >
                                                −
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.key,
                                                        item.quantity + 1,
                                                    )
                                                }
                                                aria-label="Aumentar cantidad"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <strong>
                                            {formatPrice(
                                                item.price * item.quantity,
                                            )}
                                        </strong>

                                        <button
                                            type="button"
                                            className="cart-item__remove"
                                            onClick={() => removeItem(item.key)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>

                    <aside className="cart-summary">
                        <h2>Resumen</h2>
                        <div>
                            <span>Subtotal</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </div>
                        <p>
                            El costo de envío se calculará en el siguiente paso.
                        </p>
                        <Link to="/checkout" className="cart-summary__button">
                            Continuar con la compra
                        </Link>
                    </aside>
                </div>
            )}
        </main>
    );
}
