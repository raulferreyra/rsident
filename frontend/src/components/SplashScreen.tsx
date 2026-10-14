
import { useEffect, useState } from 'react';
import './SplashScreen.css';
import logo from '../assets/logo-intro-rsidnt.png';

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [mounted, setMounted] = useState(true);

    useEffect(() => {
        const fadeTimer = window.setTimeout(() => {
            setVisible(false);
        }, 3000);

        const unmountTimer = window.setTimeout(() => {
            setMounted(false);
        }, 3700);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(unmountTimer);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div
            className={`splash-screen ${visible ? 'splash-screen--visible' : ''}`}
            aria-hidden="true"
        >
            <img src={logo} alt="" className="splash-screen__logo" />
        </div>
    );
}
