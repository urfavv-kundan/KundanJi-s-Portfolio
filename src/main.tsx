import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully prevent Firebase Auth popup dismissals and internal assertion quirks from bubbling to unhandled errors
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  const code = reason?.code || '';
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    msg.includes('popup-closed-by-user') ||
    msg.includes('INTERNAL ASSERTION FAILED: Pending promise was never set')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
