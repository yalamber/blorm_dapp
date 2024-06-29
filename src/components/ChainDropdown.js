import React, { useState } from 'react';
import blintChains from '../utils/blintChains.json';
import styles from '../styles/ChainDropdown.module.css';

const ChainDropdown = ({ onSelectChain }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedChain, setSelectedChain] = useState('');

    const handleSelect = (chainID) => {
        const chain = blintChains[chainID];
        setSelectedChain(chain.name);
        onSelectChain(chain);
        setIsOpen(false);
    };

    return (
        <div className={styles.dropdown}>
            <div className={styles.selected} onClick={() => setIsOpen(!isOpen)}>
                {selectedChain || `Select Chain ↓`}
            </div>

            {isOpen && (
                <div className={styles.options}>
                    {Object.entries(blintChains).map(([chainID, chain]) => (
                        <div
                            key={chainID}
                            className={styles.option}
                            onClick={() => handleSelect(chainID)}
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
