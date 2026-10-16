import { Link } from 'react-router-dom';
import './HeroBanner.css';

export default function HeroBanner() {
    return (
        <section className="hero-banner">
            <Link to="/tienda/descuentos" className="hero-banner__link">
                <span>AURA</span>
                <button className="hero-banner__button">SALE UP TO 40%</button>
            </Link>
        </section>
    );
}