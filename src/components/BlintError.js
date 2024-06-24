import React from 'react';
import '../styles/BlintError.module.css';

const BlintError = ({ messages, onClose }) => {
    return (
        <div className="message-bubble">
            <button className="close-button" onClick={onClose}>×</button>
            <div className="message-content">
                {messages.map((message, index) => (
                    <div key={index} className="message-item">
                        <strong>{message.type}:</strong> {message.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlintError;
