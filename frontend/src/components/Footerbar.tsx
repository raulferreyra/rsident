import { Link } from 'react-router-dom';
import './Footerbar.css';
import libro from '../assets/libro-de-reclamaciones.webp';
import politicas from '../assets/Politicas.pdf';

export default function Footerbar() {
    return (
        <nav className={`footer`}>
            <div className="frame">
                <div className="column">
                    <div className="footer__item">
                        <Link to="/" rel="noopener noreferrer" target="_blank" className="footer__link">
                            <img src={libro} alt="Libro de Reclamaciones" title="Libro de Reclamaciones" className="reclaim-book" />
                            Libro de Reclamaciones
                        </Link>
                    </div>
                    <div className="footer__item">
                        <a href={politicas} rel="noopener noreferrer" target="_blank" className="footer__link">
                            Políticas de Privacidad
                        </a>
                    </div>
                </div>
                <div className="column">
                    <p>&copy; 2026 RSIDNT.<br />Todos los derechos reservados.</p>
                </div>
                <div className="column">
                </div>
            </div>
        </nav>
    );
}