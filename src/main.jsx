import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles.css';

// Enable performance mode automatically on low-end devices or when users prefer reduced motion
try {
  const rootEl = document.documentElement;
  const hasReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const deviceMemory = navigator.deviceMemory || 0; // Not supported everywhere
  if (hasReducedMotion || (deviceMemory && deviceMemory <= 4)) {
    rootEl.classList.add('perf');
  }
} catch (_) {
  // no-op
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
