import React from 'react';
import styles from '../styles/NftCard.module.css';

const NftCard = ({ nft, chain }) => {
  return (
    <div className={styles.card}>
      <img src={nft.metadata.image} alt={nft.metadata.name} className={styles.image} />
      <div className={styles.details}>
        <h2>{nft.metadata.name}</h2>
        <p>{nft.metadata.description}</p>
        {nft.metadata.attributes && (
          <div className={styles.attributes}>
            {nft.metadata.attributes.map((attribute, index) => (
              <div key={index} className={styles.attribute}>
                <strong>{attribute.trait_type}:</strong> {attribute.value}
              </div>
            ))}
            <p>Chain: {chain}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NftCard;
