import React, { useEffect, useState } from 'react';
import styles from '../styles/BlintDisplayMessage.module.css';

const BlintDisplayMessage = ({ messages, clearMessage }) => {
    const [visibleMessages, setVisibleMessages] = useState([]);

    useEffect(() => {
        if (messages.length > 0) {
            setVisibleMessages(messages);
            const timer = setTimeout(() => {
                setVisibleMessages([]);
            }, 5000); // Hide messages after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [messages]);

    return (
        <div className={styles.messageContainer}>
            {visibleMessages.map((msg, index) => (
                <div key={index} className={`${styles.message} ${styles[msg.type]}`}>
                    {msg.message}
                    <button className={styles.closeButton} onClick={() => clearMessage(index)}>X</button>
                </div>
            ))}
        </div>
    );
};

export default BlintDisplayMessage;
