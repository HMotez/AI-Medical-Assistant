import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import './theme';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Cards light up where the cursor is: set --mx / --my on the hovered card
document.addEventListener('pointermove', (e) => {
  const card = e.target.closest?.('.card, .kpi');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
