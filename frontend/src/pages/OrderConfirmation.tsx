import { Link, useLocation, useParams } from 'react-router-dom';

import './OrderConfirmation.css';

export default function OrderConfirmation() {
    const { orderNumber = '' } = useParams();
    const location = useLocation();
    const paymentResult = new URLSearchParams(location.search).get('payment');

    return (
        <main className="order-confirmation">
            <section>
                <span>RSIDENT</span>
                <h1>{paymentResult === 'success' ? 'Pago procesado' : paymentResult === 'failure' ? 'Pago no completado' : 'Compra registrada'}</h1>
                <p>
                    {paymentResult === 'success'
                        ? 'Mercado Pago indicó que el pago fue aprobado. RSIDENT verificará la notificación del servidor antes de confirmar el pedido.'
                        : paymentResult === 'failure'
                            ? 'El pago no se completó. Si deseas volver a intentarlo, comunícate con RSIDENT indicando tu número de pedido.'
                            : paymentResult === 'pending'
                                ? 'Mercado Pago dejó el pago pendiente. El estado se actualizará cuando el servidor reciba y valide la notificación.'
                                : 'Hemos recibido tu pedido. Si elegiste Yape, el comprobante será revisado manualmente.'}
                </p>
                <p>
                    Número de pedido: <strong>{orderNumber}</strong>
                </p>
                <p>
                    Te enviaremos un correo con la confirmación y la
                    información correspondiente para recoger tu pedido en
                    Shalom.
                </p>
                <Link to="/tienda">Continuar comprando</Link>
            </section>
        </main>
    );
}
