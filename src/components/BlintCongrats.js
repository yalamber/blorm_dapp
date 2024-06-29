import React from 'react';
import styles from '../styles/BlintCongrats.module.css';
import logo from '../images/logo.png';
import NftCard from './NftCard'; // Import the NftCard component
import { Link } from 'react-router-dom';

const BlintCongrats = ({ txHash, tokenId, openseaURL, nft }) => {
    console.log('BlintCongrats:', { txHash, tokenId, openseaURL, nft });
    return (
        <div className={styles.container}>
            <div className={styles.backgroundImage}></div>
            <div className={styles.centerContainer}>
                <div className={styles.leftPanel}>
                    {/* Render NftCard only if nft and nft.tokenId are available */}
                    <div className={styles.blintImageContainer}>
                        {nft && nft.tokenId && <NftCard nft={nft} width={20} />}
                    </div>
                </div>
                <div className={styles.rightPanel}>
                    <h1 className={styles.title}>Congrats On Blinting</h1>
                    <p className={styles.subtitle}>
                        Your opepen is ready for life. <br />
                        Continue your onchain journey. <br />
                        This is only one blorm of many to come.
                    </p>
                    <div className={styles.callToAction}>
                        <Link to="/profile">
                            <button className={styles.actionButton}> See Profile → </button>
                        </Link>
                        <img src={logo} className={styles.callToActionLogo}></img>
                    </div>
                </div>
            </div>
        </div >
    );
}
export default BlintCongrats;
