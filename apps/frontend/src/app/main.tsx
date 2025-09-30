import React from 'react';
import '../styles/tailwind.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const containerElement = document.getElementById('root');
if (!containerElement) throw new Error('Root container element not found');
const root = createRoot(containerElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
