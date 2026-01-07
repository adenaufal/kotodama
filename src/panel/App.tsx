import React from 'react';
import ReactDOM from 'react-dom/client';
import Panel from './Panel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Panel />
    </ErrorBoundary>
  </React.StrictMode>
);
