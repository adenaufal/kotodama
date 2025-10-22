import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Settings from './Settings';
import About from './About';
import Navigation, { PageType } from './Navigation';
import '../panel/index.css';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('settings');

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
  };

  return (
    <div className="page-shell light-mode min-h-screen" style={{ backgroundColor: 'var(--koto-bg-light)' }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        <div className="mt-4">
          {currentPage === 'settings' && <Settings />}
          {currentPage === 'about' && <About />}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
