import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((registrationError: unknown) => {
    console.debug('ServiceWorker registration handled:', registrationError);
  });
}

createRoot(document.getElementById('root')!).render(<App />);

