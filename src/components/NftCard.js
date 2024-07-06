import React from 'react';
import styles from '../styles/NftCard.module.css';
import blintChains from '../utils/blintChains.json';

const NftCard = ({ nft, width }) => {
  const chainInfo = blintChains[nft.chainId];
  const tokenId = parseInt(nft.tokenId);

  return (
    <div className={styles.card} style={{ width: `${width}` }}>
      <div className={styles.border}>
        <div className={`${styles.line} ${styles.lineTop}`}>
          <div className={styles.diamond}></div>
          <div className={styles.diamond}></div>
        </div>
        <div className={`${styles.line} ${styles.lineBottom}`}>
          <div className={styles.diamond}></div>
          <div className={styles.diamond}></div>
        </div>
        <div className={`${styles.line} ${styles.lineLeft}`}>
          <div className={styles.diamond}></div>
          <div className={styles.diamond}></div>
        </div>
        <div className={`${styles.line} ${styles.lineRight}`}>
          <div className={styles.diamond}></div>
          <div className={styles.diamond}></div>
        </div>
        <img src={nft.metadata.image} alt={nft.metadata.name} className={styles.image} />
      </div>
      <div className={styles.details}>
        <span className={styles.cardBLINT}>BLINT:</span>
        <div className={styles.chainIconsContainer}>
          {chainInfo && (
            <img src={chainInfo.image} alt={chainInfo.name} className={styles.chainIcon} />
          )}
        </div>
      </div>
      <div className={styles.dividerContainer}>
        <hr className={styles.divider} />
      </div>
      <div className={styles.details2}>
        <span>{tokenId}</span>
        <span>{nft.chain}</span>
      </div>
    </div>

  );
};

export default NftCard;
