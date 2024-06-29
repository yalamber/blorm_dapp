// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import logo from '../images/logo.png';
import x from '../images/x.png';
import arch from '../images/arch.png';
import AuthButton from './AuthButton';

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <Link to="/" className={styles.navbarLinkTag}>
        <div className={styles.navbarLogo}>
          <img src={logo} alt="Logo" className={styles.logoImage} />
          <span className={styles.logoText}>
            BLORM
          </span>
        </div>
      </Link>
      <div className={styles.navbarLinks}>
        <Link to="https://x.com/blorm_"><img src={x} alt="X" className={styles.logoLink} /></Link>
        <Link to="/"><img src={arch} alt="Arch" className={styles.logoLink} /></Link>
        <AuthButton />
      </div>
    </div>
  );
};

export default Navbar;
