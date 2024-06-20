import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <div className={styles.navbarLogo}>
        <Link to="/">
          <img src="logo.png" alt="Logo" className={styles.logoImage} />
        </Link>
        <span className={styles.logoText}>
          BLORM
        </span>
      </div>
      <div className={styles.navbarLinks}>
        <Link to="https://x.com/blorm_"><img src="x.png" alt="X" className={styles.logoLink}/></Link>
        <Link to="/"><img src="arch.png" alt="Arch" className={styles.logoLink}/></Link>
      </div>
    </div>
  );
};

export default Navbar;
