import React from 'react';
import styles from '../styles/BlintCongrats.module.css';

const BlintCongrats = ({ txHash, tokenId, openseaURL }) => {
    return (
        <div className={styles.container}>
            <div className={styles.backgroundImage}>
            </div>
            <div className={styles.centerContainer}>
                <h1 className={styles.title}>Congratulations!</h1>
                <h2 className={styles.subtitle}>Your Blint has been minted!</h2>
                <div className={styles.txHashContainer}>
                    <p className={styles.txHash}>Transaction Hash: {txHash}</p>
                    <p className={styles.txHash}>Token ID: {tokenId}</p>
                    <p className={styles.txHash}>View on OpenSea: <a href={openseaURL} target="_blank" rel="noreferrer">{openseaURL}</a></p>
                    </div>
            </div>
        </div>
    );
}

export default BlintCongrats;