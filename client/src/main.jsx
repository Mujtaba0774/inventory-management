import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './mockMode';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
