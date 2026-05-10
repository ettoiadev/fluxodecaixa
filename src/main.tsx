import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

document.documentElement.classList.remove("dark");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
