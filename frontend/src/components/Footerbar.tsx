import { Link } from 'react-router-dom';
import './Footerbar.css';
import politicas from '../assets/Politicas.pdf';

export default function Footerbar() {
    return (
        <nav className={`footer`}>
            <div className="footer__item">
                <Link to="/" rel="noopener noreferrer" target="_blank" className="footer__link">
                    Libro de Reclamaciones
                </Link>
            </div>

            <div className="footer__item">
                <a href={politicas} rel="noopener noreferrer" target="_blank" className="footer__link">
                    Políticas de Privacidad
                </a>
            </div>
        </nav>
    );
}