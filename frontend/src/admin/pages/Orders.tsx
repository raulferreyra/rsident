import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../../api/client';
import type { Order } from '../../types';

import './Orders.css';

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadOrders = async () => {
        try {
            setError('');

            const result =
                await api.getOrders();

            setOrders(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudieron cargar los pedidos',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadOrders();
    }, []);

    if (loading) {
        return (
            <main className="admin-orders">
                <p>Cargando pedidos...</p>
            </main>
        );
    }

    return (
        <main className="admin-orders">
            <header className="admin-orders__header">
                <div>
                    <h1>Pedidos</h1>

                    <p>
                        Administración de compras,
                        pagos y estados.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setLoading(true);
                        void loadOrders();
                    }}
                >
                    Actualizar
                </button>
            </header>

            {error && (
                <p className="admin-orders__error">
                    {error}
                </p>
            )}

            {orders.length === 0 ? (
                <p>No hay pedidos registrados.</p>
            ) : (
                <div className="admin-orders__table-wrapper">
                    <table className="admin-orders__table">
                        <thead>
                            <tr>
                                <th>Pedido</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Pedido</th>
                                <th>Boleta</th>
                                <th />
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <strong>
                                            {order.orderNumber}
                                        </strong>
                                    </td>

                                    <td>
                                        {order.customerEmail}
                                    </td>

                                    <td>
                                        S/ {order.total.toFixed(2)}
                                    </td>

                                    <td>
                                        <Status
                                            value={
                                                order.paymentStatus
                                            }
                                        />
                                    </td>

                                    <td>
                                        <Status
                                            value={
                                                order.orderStatus
                                            }
                                        />
                                    </td>

                                    <td>
                                        <Status
                                            value={
                                                order.receiptStatus
                                            }
                                        />
                                    </td>

                                    <td>
                                        <Link
                                            to={`/admin/orders/${order.id}`}
                                        >
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

function Status({
    value,
}: {
    value: string;
}) {
    const labels: Record<string, string> = {
        pending_review:
            'Pendiente de revisión',

        approved: 'Aprobado',
        rejected: 'Rechazado',

        confirmed: 'Confirmado',
        preparing: 'Preparando',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado',

        pending: 'Pendiente',
        sent: 'Enviada',
    };

    return (
        <span className="admin-orders__status">
            {labels[value] ?? value}
        </span>
    );
}