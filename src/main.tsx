import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAppIcons } from './utils/iconGenerator.ts';

// Dynamically generate PNG app icons and apple-touch-icon from our vector SVG on startup
initializeAppIcons();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
