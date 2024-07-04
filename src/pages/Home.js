import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import logo from '../images/logo.png';
import arch from '../images/arch.png';
import { Link } from 'react-router-dom';
import homeBg from '../images/home-bg.png';
import mobileBg from '../images/mobile-bg.png';
import xLogo from '../images/x.png';

const Home = () => {
    const [isMobile, setIsMobile] = useState(false);

    const checkIfMobile = () => {
        // Check for mobile user agents or screen width
        if (typeof window !== 'undefined') {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileDevice = /android|iphone|ipad|iPod|opera mini|iemobile|wpdesktop/i.test(userAgent) ||
                window.innerWidth <= 768; // You can adjust this width for your specific needs
            setIsMobile(isMobileDevice);
        }
    };

    useEffect(() => {
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    if (isMobile) {
        return (
            <div className="container-mobile">
                {/* Mobile version of the HTML */}
                <img className={styles.homeBg} src={mobileBg} alt="home background"></img>
                <div className={styles.topleft}>
                    <Link to="https://x.com/blorm_" className={styles.topLeftImage}>
                        <img className={styles.topleftImage} src={xLogo} alt="x logo"></img>
                    </Link>
                </div>
                <div className={styles.topCenter}>
                    <span className={styles.topCenterText}>BLORM</span>
                </div>
                <div className={styles.topRight}>
                    <Link to="https://x.com/blorm_" className={styles.topRightImage}>
                        <img className={styles.topRightImage} src={arch} alt="arch logo"></img>
                    </Link>
                </div>
                <div className={styles.center}>
                    <img className={styles.centerImage} src={logo} alt="center logo"></img>
                    <Link to="/blint" className={styles.actionButton}>BLINT</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Desktop version of the HTML */}
            <img className={styles.homeBg} src={homeBg} alt="home background"></img>
            <div className={styles.topleft}>
                <img className={styles.topleftImage} src={arch} alt="arch logo"></img>
                <span className={styles.topleftText}>&nbsp;/ BLORM</span>
            </div>
            <div className={styles.topRight}>
                <span className={styles.topRightText}>BLORM EVERYTHING</span>
                <span className={styles.topRightText}>A BLORM IS A BLORM</span>
            </div>
            <div className={styles.bottomLeft}>
                424C4F524D
            </div>
            <div className={styles.bottomRight}>
                <Link to="/blint" className={styles.actionButton}>BLINT</Link>
            </div>
            <div className={styles.center}>
                <img className={styles.centerImage} src={logo} alt="center logo"></img>
                <span className={styles.centerText}>B L O R M</span>
            </div>
        </div>
    );
}

export default Home;
