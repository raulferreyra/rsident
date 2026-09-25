import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useCart } from '../cart';
import { publicUpload } from '../api/client';
import { formatPrice, getImageURL } from '../utils';
import './Checkout.css';

const shippingOptions = [
    {
        value: 'lima_metropolitana',
        label: 'Lima Metropolitana',
        price: 12,
    },
    {
        value: 'lima_provincias',
        label: 'Lima Provincias',
        price: 15,
    },
    {
        value: 'otras_provincias',
        label: 'Otras provincias',
        price: 12,
    },
] as const;

interface OrderResponse {
    orderNumber: string;
    total: number;
}

export default function Checkout() {
    const navigate = useNavigate();
    const { items, subtotal, clearCart } = useCart();

    const [shippingZone, setShippingZone] = useState(
        'lima_metropolitana',
    );
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [pickupName, setPickupName] = useState('');
    const [pickupDNI, setPickupDNI] = useState('');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const shipping = useMemo(
        () =>
            shippingOptions.find(
                (option) => option.value === shippingZone,
            ) ?? shippingOptions[0],
        [shippingZone],
    );

    const total = subtotal + shipping.price;

    if (items.length === 0) {
        return (
            <main className="checkout-page">
                <section className="checkout-page__empty">
                    <h1>No hay productos para comprar</h1>
                    <Link to="/tienda">Volver a la tienda</Link>
                </section>
            </main>
        );
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!paymentProof) {
            setError('Debes adjuntar la imagen del comprobante de pago.');
            return;
        }

        if (!/^\d{8}$/.test(pickupDNI)) {
            setError('El DNI debe tener 8 dígitos.');
            return;
        }

        setSubmitting(true);

        try {
            const result = await publicUpload<OrderResponse>(
                '/orders',
                {
                    order: JSON.stringify({
                        email,
                        address,
                        shippingZone,
                        shippingCarrier: 'Shalom',
                        pickupName,
                        pickupDNI,
                        items: items.map((item) => ({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                        })),
                    }),
                },
                paymentProof,
            );

            clearCart();
            navigate(`/compra-confirmada/${result.orderNumber}`);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo registrar la compra.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="checkout-page">
            <div className="checkout-page__header">
                <Link to="/carrito">← Carrito</Link>
                <h1>Finalizar compra</h1>
            </div>

            <div className="checkout-page__layout">
                <form className="checkout-form" onSubmit={handleSubmit}>
                    <section className="checkout-section">
                        <h2>Datos de contacto</h2>
                        <label>
                            Correo electrónico
                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                            />
                            <small>
                                Te enviaremos aquí la confirmación y la
                                información de la tienda Shalom donde podrás
                                recoger tu pedido.
                            </small>
                        </label>
                    </section>

                    <section className="checkout-section">
                        <h2>Envío</h2>
                        <label>
                            Destino del envío
                            <select
                                value={shippingZone}
                                onChange={(event) =>
                                    setShippingZone(event.target.value)
                                }
                            >
                                {shippingOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label} — {formatPrice(option.price)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Dirección
                            <textarea
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                                rows={4}
                                required
                            />
                        </label>

                        <div className="checkout-section__notice">
                            El envío se realizará mediante Shalom. La tienda
                            Shalom de destino será informada por correo cuando
                            tu pedido sea procesado.
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h2>Persona que recogerá el pedido</h2>
                        <label>
                            Nombres completos
                            <input
                                type="text"
                                value={pickupName}
                                onChange={(event) =>
                                    setPickupName(event.target.value)
                                }
                                required
                            />
                        </label>

                        <label>
                            DNI
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={8}
                                value={pickupDNI}
                                onChange={(event) =>
                                    setPickupDNI(
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                required
                            />
                        </label>
                    </section>

                    <section className="checkout-section checkout-section--payment">
                        <h2>Pago</h2>
                        <p>
                            Realiza el pago mediante el siguiente QR y adjunta
                            una imagen del comprobante.
                        </p>

                        <div className="checkout-payment__qr">
                            <img
                                src="/QR.png"
                                alt="QR de pago RSIDENT"
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                    event.currentTarget.parentElement?.classList.add(
                                        'checkout-payment__qr--missing',
                                    );
                                }}
                            />
                            <span>QR.png no configurado</span>
                        </div>

                        <label>
                            Comprobante de pago
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                    setPaymentProof(
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                required
                            />
                            <small>
                                Formatos permitidos: JPG, PNG o WEBP. Máximo 5
                                MB.
                            </small>
                        </label>
                    </section>

                    {error && (
                        <div className="checkout-form__error">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="checkout-form__submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? 'Registrando compra...'
                            : 'Confirmar compra'}
                    </button>
                </form>

                <aside className="checkout-summary">
                    <h2>Tu compra</h2>

                    <div className="checkout-summary__items">
                        {items.map((item) => (
                            <div
                                key={item.key}
                                className="checkout-summary__item"
                            >
                                {item.imageUrl && (
                                    <img
                                        src={getImageURL(item.imageUrl)}
                                        alt={item.productName}
                                    />
                                )}
                                <div>
                                    <strong>{item.productName}</strong>
                                    <span>
                                        {item.colorName} {item.size && `· ${item.size}`}
                                    </span>
                                    <span>
                                        {item.quantity} × {formatPrice(item.price)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-summary__line">
                        <span>Subtotal</span>
                        <strong>{formatPrice(subtotal)}</strong>
                    </div>

                    <div className="checkout-summary__line">
                        <span>Envío</span>
                        <strong>{formatPrice(shipping.price)}</strong>
                    </div>

                    <div className="checkout-summary__total">
                        <span>Total</span>
                        <strong>{formatPrice(total)}</strong>
                    </div>
                </aside>
            </div>
        </main>
    );
}
