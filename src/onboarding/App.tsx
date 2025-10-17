import React from 'react';
import ReactDOM from 'react-dom/client';
import Onboarding from './Onboarding';
import '../panel/index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Onboarding />
  </React.StrictMode>
);
