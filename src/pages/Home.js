import styles from '../styles/Home.module.css';
import logo from '../images/logo.png';
import arch from '../images/arch.png';
import { Link } from 'react-router-dom';
import homeBg from '../images/home-bg.png';


const Home = () => {

    return (
        <div className="container">
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
