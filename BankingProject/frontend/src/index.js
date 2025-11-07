import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import SecurityProvider from './components/SecurityProvider';
import { unregister } from './utils/serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SecurityProvider>
      <App />
    </SecurityProvider>
  </React.StrictMode>
);

// Dev-only: aggressively unregister any existing service workers and clear caches
if (typeof window !== 'undefined') {
  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(window.location.hostname)
  );
  const isDevRuntime = isLocalhost || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
  if (isDevRuntime && 'serviceWorker' in navigator) {
    try {
      unregister();
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    } catch (e) {
      // no-op
    }
    if ('caches' in window) {
      caches.keys().then(names => Promise.all(names.map(name => caches.delete(name)))).catch(() => {});
    }
    console.log('Development: ensured service workers unregistered and caches cleared');
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
