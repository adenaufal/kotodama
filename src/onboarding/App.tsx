import React from 'react';
import ReactDOM from 'react-dom/client';
import Onboarding from './Onboarding';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/pages.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Onboarding />
    </ErrorBoundary>
  </React.StrictMode>
);
