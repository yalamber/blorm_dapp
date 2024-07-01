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
            <img src={value.metadata.image} alt={value.label} className={styles.nftOptionImage} />
            {value.label}
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
                <img src={option.metadata.image} alt={option.label} className={styles.nftOptionImage} />
                {option.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePicDropdown;
