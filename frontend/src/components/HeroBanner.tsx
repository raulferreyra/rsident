import { Link } from 'react-router-dom';
import './HeroBanner.css';

export default function HeroBanner() {
    return (
        <section className="hero-banner">
            <Link to="/tienda/descuentos" className="hero-banner__link">
                <span>SALE</span>
                <span>UP TO 40%</span>
            </Link>
        </section>
    );
}