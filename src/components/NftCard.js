import React from 'react';
import styles from '../styles/NftCard.module.css';
import blintChains from '../utils/blintChains.json';

const NftCard = ({ nft }) => {
  return (
    <div className={styles.card}>
      <img src={nft.metadata.image} alt={nft.metadata.name} className={styles.image} />

      <div className={styles.details}>
        <span>{nft.tokenId} | {nft.chain}</span>
      </div>
    </div>
  );
};

export default NftCard;
