import React from 'react';
import styles from '../styles/BlintCongrats.module.css';

const BlintCongrats = ({ txHash, tokenId, openseaURL }) => {
    return (
        <div className={styles.container}>
            <h1>Congratulations!</h1>
            <p>You've successfully minted an Opepen.</p>
            <p>Transaction Hash: {txHash}</p>
            <p>Token ID: {tokenId}</p>
            <p>OpenSea URL: <a href={openseaURL}>{openseaURL}</a></p>
        </div>
    );
}

export default BlintCongrats;