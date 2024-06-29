import React, { useState } from 'react';
import styles from '../styles/ProfilePicDropdown.module.css';

const ProfilePicDropdown = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown}>
      <div className={styles.selected} onClick={() => setIsOpen(!isOpen)}>
        {value ? (
          <div className={styles.optionContent}>
            <img src={value.metadata.image} alt={`NFT ${value.tokenId}`} className={styles.nftOptionImage} />
            {`${value.chain} - Token ${value.tokenId}`}
          </div>
        ) : (
          "Select a profile picture"
        )}
      </div>
      {isOpen && (
        <div className={styles.options}>
          {options.map((option, index) => (
            <div
              key={index}
              className={styles.option}
              onClick={() => handleSelect(option)}
            >
              <div className={styles.optionContent}>
                <img src={option.metadata.image} alt={`NFT ${option.tokenId}`} className={styles.nftOptionImage} />
                {`${option.chain} - NFT ${option.tokenId}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePicDropdown;
