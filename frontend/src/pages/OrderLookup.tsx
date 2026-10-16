import {
    FormEvent,
    useState,
} from 'react';

import {
    lookupOrder,
} from '../api/client';

import type { CustomerOrderLookup } from '../types';

import './OrderLookup.css';

const labels: Record<string, string> = {
    pending_review:
        'Pendiente de revisión',
    approved: 'Pago aprobado',
    rejected: 'Pago rechazado',

    confirmed: 'Pedido confirmado',
    preparing: 'Preparando pedido',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

export default function OrderLookup() {
    const [orderNumber, setOrderNumber] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [order, setOrder] =
        useState<CustomerOrderLookup | null>(null);

    const [error, setError] =
        useState('');

    const [loading, setLoading] =
        useState(false);

    const submit = async (
        event: FormEvent,
    ) => {
        event.preventDefault();

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const result =
                await lookupOrder(
                    orderNumber,
                    email,
                );

            setOrder(result);
        } catch {
            setError(
                'No encontramos un pedido con esos datos.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="order-lookup">
            <section className="order-lookup__card">
                <h1>
                    Consulta tu pedido
                </h1>

                <p>
                    Ingresa tu número de pedido y
                    el correo utilizado durante la compra.
                </p>

                <form onSubmit={submit}>
                    <label>
                        Número de pedido

                        <input
                            type="text"
                            value={orderNumber}
                            onChange={(event) =>
                                setOrderNumber(
                                    event.target.value,
                                )
                            }
                            placeholder="RS-20261007-1234"
                            required
                        />
                    </label>

                    <label>
                        Correo electrónico

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value,
                                )
                            }
                            required
                        />
                    </label>

                    {error && (
                        <p className="order-lookup__error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Consultando...'
                            : 'Consultar pedido'}
                    </button>
                </form>
            </section>

            {order && (
                <section className="order-lookup__result">
                    <h2>
                        {order.orderNumber}
                    </h2>

                    <div className="order-lookup__statuses">
                        <div>
                            <span>
                                Pago
                            </span>

                            <strong>
                                {
                                    labels[
                                    order.paymentStatus
                                    ] ??
                                    order.paymentStatus
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Pedido
                            </span>

                            <strong>
                                {
                                    labels[
                                    order.orderStatus
                                    ] ??
                                    order.orderStatus
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Boleta
                            </span>

                            <strong>
                                {order.receiptStatus ===
                                    'sent'
                                    ? 'Enviada'
                                    : 'Pendiente'}
                            </strong>
                        </div>
                    </div>

                    <h3>
                        Productos
                    </h3>

                    {order.items.map(
                        (item) => (
                            <div
                                className="order-lookup__item"
                                key={`${item.productId}-${item.variantId}`}
                            >
                                <span>
                                    {
                                        item.productName
                                    }
                                    {' · '}
                                    {item.size}
                                </span>

                                <span>
                                    {item.quantity}
                                </span>
                            </div>
                        ),
                    )}

                    <div className="order-lookup__total">
                        Total:{' '}
                        <strong>
                            S/{' '}
                            {order.total.toFixed(
                                2,
                            )}
                        </strong>
                    </div>
                </section>
            )}
        </main>
    );
}