import React, { useState, useEffect } from 'react';
import styles from '../styles/ChainDropdown.module.css';
import blintChains from '../utils/blintChains.json';

const ChainDropdown = ({ onSelectChain }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState('Select Chain');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (chain) => {
    const selectedChain = blintChains[chain.chainID];
    setSelectedChain(selectedChain.name);
    onSelectChain(chain);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer}>
      <div className={styles.dropdown} onClick={() => setIsOpen(!isOpen)}>
        {selectedChain}
        <span className={styles.arrow}>▼</span>
      </div>
      {isOpen && (
        <div className={styles.options}>
          {Object.entries(blintChains).map(([chainID, chain]) => (
            <div
              key={chainID}
              className={styles.option}
              onClick={() => handleSelect(chain)}
            >
              {chain.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChainDropdown;