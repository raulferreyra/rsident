import { Link, useParams } from 'react-router-dom';

import './OrderConfirmation.css';

export default function OrderConfirmation() {
    const { orderNumber = '' } = useParams();

    return (
        <main className="order-confirmation">
            <section>
                <span>RSIDENT</span>
                <h1>Compra registrada</h1>
                <p>
                    Hemos recibido tu pedido y el comprobante de pago.
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
