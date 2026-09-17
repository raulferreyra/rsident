import { Link } from 'react-router-dom';
import pruebaImage from '../assets/prueba.jpg';
import './BestSellers.css';

const products = [
    { id: 1, name: 'Producto 01', price: 'S/ 129.00' },
    { id: 2, name: 'Producto 02', price: 'S/ 139.00' },
    { id: 3, name: 'Producto 03', price: 'S/ 149.00' },
    { id: 4, name: 'Producto 04', price: 'S/ 119.00' },
    { id: 5, name: 'Producto 05', price: 'S/ 159.00' },
    { id: 6, name: 'Producto 06', price: 'S/ 129.00' },
    { id: 7, name: 'Producto 07', price: 'S/ 149.00' },
    { id: 8, name: 'Producto 08', price: 'S/ 139.00' },
];

export default function BestSellers() {
    return (
        <section className="best-sellers">
            <h2 className="best-sellers__title">
                Los más vendidos
            </h2>

            <div className="best-sellers__grid">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        to={`/producto/${product.id}`}
                        className="best-sellers__product"
                    >
                        <div className="best-sellers__image-container">
                            <img
                                src={pruebaImage}
                                alt={product.name}
                                className="best-sellers__image"
                            />
                        </div>

                        <div className="best-sellers__info">
                            <h3>{product.name}</h3>
                            <span>{product.price}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}