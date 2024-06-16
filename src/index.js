import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { Buffer } from 'buffer';
import process from 'process/browser';

// Assign to global objects
global.Buffer = Buffer;
global.process = process;

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);