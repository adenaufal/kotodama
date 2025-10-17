import React from 'react';
import ReactDOM from 'react-dom/client';
import Settings from './Settings';
import '../panel/index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Settings />
  </React.StrictMode>
);
