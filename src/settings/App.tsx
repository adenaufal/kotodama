import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Settings from './Settings';
import About from './About';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../panel/index.css';

export type PageType = 'settings' | 'about';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('settings');

  const navItems: Array<{ id: PageType; label: string; icon: React.ReactElement }> = [
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'about',
      label: 'About',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden light-mode font-sans" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Full Page Background Gradient */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.15) 0%, rgba(255,255,255,0) 70%)' }}></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full blur-[100px] opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.12) 0%, rgba(255,255,255,0) 70%)' }}></div>
      </div>

      {/* Fixed Floating Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
        <nav className="flex gap-1 rounded-2xl p-1.5 bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/30">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: isActive ? 'var(--koto-sakura-pink)' : 'transparent',
                  color: isActive ? 'white' : 'var(--koto-text-secondary)',
                  boxShadow: isActive ? '0 4px 12px rgba(232, 92, 143, 0.25)' : 'none'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {currentPage === 'settings' && <Settings />}
          {currentPage === 'about' && <About />}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 text-center py-4 pointer-events-none">
        <p className="text-[10px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Kotodama. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
