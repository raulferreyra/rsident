import { useEffect, useState } from 'react';
import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom';

import {
    api,
} from '../../api/client';

import type {
    Order,
    OrderStatus,
} from '../../types';

import './OrderDetail.css';

const statuses: OrderStatus[] = [
    'pending_review',
    'confirmed',
    'preparing',
    'shipped',
    'delivered',
    'cancelled',
];

const statusLabels: Record<string, string> = {
    pending_review:
        'Pendiente de revisión',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    rejected: 'Rechazado',
};

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] =
        useState<Order | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [proofURL, setProofURL] =
        useState('');

    const load = async () => {
        if (!id) {
            return;
        }

        try {
            const result =
                await api.getOrder(id);

            setOrder(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo cargar el pedido',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [id]);

    useEffect(() => {
        let objectURL = '';
        let cancelled = false;

        if (!id || !order?.paymentProofUrl) {
            setProofURL('');
            return;
        }

        void api.getOrderPaymentProof(id)
            .then((blob) => {
                if (cancelled) return;
                objectURL = URL.createObjectURL(blob);
                setProofURL(objectURL);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error
                        ? err.message
                        : 'No se pudo cargar el comprobante');
                }
            });

        return () => {
            cancelled = true;
            if (objectURL) URL.revokeObjectURL(objectURL);
        };
    }, [id, order?.paymentProofUrl]);

    const approvePayment = async () => {
        if (!id) {
            return;
        }

        setSaving(true);

        try {
            const result =
                await api.approvePayment(id);

            setOrder(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo aprobar el pago',
            );
        } finally {
            setSaving(false);
        }
    };

    const rejectPayment = async () => {
        if (!id) {
            return;
        }

        if (
            !window.confirm(
                '¿Rechazar el pago? El stock será restaurado.',
            )
        ) {
            return;
        }

        setSaving(true);

        try {
            const result =
                await api.rejectPayment(id);

            setOrder(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo rechazar el pago',
            );
        } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (
        status: string,
    ) => {
        if (!id) {
            return;
        }

        if (
            status === 'cancelled' &&
            !window.confirm(
                '¿Cancelar este pedido? El stock será restaurado.',
            )
        ) {
            return;
        }

        setSaving(true);

        try {
            const result =
                await api.updateOrderStatus(
                    id,
                    status,
                );

            setOrder(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo actualizar el estado',
            );
        } finally {
            setSaving(false);
        }
    };

    const updateReceipt = async (
        status: string,
    ) => {
        if (!id) {
            return;
        }

        setSaving(true);

        try {
            const result =
                await api.updateReceiptStatus(
                    id,
                    status,
                );

            setOrder(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo actualizar la boleta',
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="admin-order-detail">
                <p>Cargando pedido...</p>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="admin-order-detail">
                <p>
                    {error ||
                        'Pedido no encontrado'}
                </p>

                <Link to="/admin/orders">
                    Volver a pedidos
                </Link>
            </main>
        );
    }

    return (
        <main className="admin-order-detail">
            <header className="admin-order-detail__header">
                <div>
                    <Link to="/admin/orders">
                        ← Pedidos
                    </Link>

                    <h1>
                        {order.orderNumber}
                    </h1>

                    <p>
                        {order.customerEmail}
                    </p>
                </div>
            </header>

            {error && (
                <p className="admin-order-detail__error">
                    {error}
                </p>
            )}

            <section className="admin-order-detail__grid">
                <section className="admin-order-detail__card">
                    <h2>Pago</h2>

                    <p>
                        Estado:{' '}
                        <strong>
                            {statusLabels[
                                order.paymentStatus
                            ] ??
                                order.paymentStatus}
                        </strong>
                    </p>

                    {proofURL && (
                        <a
                            href={proofURL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Ver comprobante de pago
                        </a>
                    )}

                    {order.paymentStatus ===
                        'pending_review' && (
                            <div className="admin-order-detail__actions">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={
                                        approvePayment
                                    }
                                >
                                    Aprobar pago
                                </button>

                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={
                                        rejectPayment
                                    }
                                >
                                    Rechazar pago
                                </button>
                            </div>
                        )}
                </section>

                <section className="admin-order-detail__card">
                    <h2>Pedido</h2>

                    <label>
                        Estado

                        <select
                            value={
                                order.orderStatus
                            }
                            disabled={saving}
                            onChange={(event) => {
                                void updateStatus(
                                    event.target.value,
                                );
                            }}
                        >
                            {statuses.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {
                                            statusLabels[
                                            status
                                            ]
                                        }
                                    </option>
                                ),
                            )}

                            {order.orderStatus ===
                                'rejected' && (
                                    <option value="rejected">
                                        Rechazado
                                    </option>
                                )}
                        </select>
                    </label>
                </section>

                <section className="admin-order-detail__card">
                    <h2>Boleta</h2>

                    <p>
                        Estado:{' '}
                        <strong>
                            {order.receiptStatus ===
                                'sent'
                                ? 'Enviada'
                                : 'Pendiente'}
                        </strong>
                    </p>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                            void updateReceipt(
                                order.receiptStatus ===
                                    'pending'
                                    ? 'sent'
                                    : 'pending',
                            );
                        }}
                    >
                        {order.receiptStatus ===
                            'pending'
                            ? 'Marcar como enviada'
                            : 'Marcar como pendiente'}
                    </button>
                </section>
            </section>

            <section className="admin-order-detail__card">
                <h2>Productos</h2>

                <div className="admin-order-detail__items">
                    {order.items.map((item) => (
                        <article
                            key={`${item.productId}-${item.variantId}`}
                        >
                            <div>
                                <strong>
                                    {
                                        item.productName
                                    }
                                </strong>

                                <p>
                                    {item.colorName}
                                    {' · '}
                                    {item.size}
                                    {' · '}
                                    {item.sku}
                                </p>
                            </div>

                            <div>
                                {item.quantity}
                                {' × '}
                                S/{' '}
                                {item.unitPrice.toFixed(
                                    2,
                                )}
                            </div>

                            <strong>
                                S/{' '}
                                {item.subtotal.toFixed(
                                    2,
                                )}
                            </strong>
                        </article>
                    ))}
                </div>
            </section>

            <section className="admin-order-detail__card">
                <h2>Entrega</h2>

                <p>
                    Zona:{' '}
                    {order.shippingZone}
                </p>

                <p>
                    Dirección:{' '}
                    {order.address}
                </p>

                <p>
                    Recibe:{' '}
                    {order.pickupName}
                </p>

                <p>
                    DNI:{' '}
                    {order.pickupDni}
                </p>

                <p>
                    Courier:{' '}
                    {order.courier}
                </p>
            </section>

            <section className="admin-order-detail__totals">
                <p>
                    Subtotal:{' '}
                    <strong>
                        S/{' '}
                        {order.subtotal.toFixed(
                            2,
                        )}
                    </strong>
                </p>

                <p>
                    Envío:{' '}
                    <strong>
                        S/{' '}
                        {order.shippingCost.toFixed(
                            2,
                        )}
                    </strong>
                </p>

                <p>
                    Total:{' '}
                    <strong>
                        S/{' '}
                        {order.total.toFixed(
                            2,
                        )}
                    </strong>
                </p>
            </section>
        </main>
    );
}