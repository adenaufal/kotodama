import React from 'react';

const About: React.FC = () => {
  // Get version from manifest
  const manifestVersion = chrome.runtime.getManifest().version;

  return (
    <div className="stack w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="stack rounded-3xl p-8 shadow-2xl ring-1 sm:p-10" style={{
        backgroundColor: 'var(--koto-surface)',
        boxShadow: 'var(--koto-shadow-lg)',
        borderColor: 'var(--koto-border)'
      }}>
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--koto-sakura-pink)' }}>About</p>
              <h1 className="text-3xl font-semibold leading-tight" style={{ color: 'var(--koto-text-primary)' }}>Kotodama</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--koto-text-secondary)' }}>
                言霊 - The Spirit of Words
              </p>
            </div>
          </div>
        </header>

        <div className="stack">
          <section className="stack-sm">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>What is Kotodama?</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--koto-text-secondary)' }}>
              Kotodama is a Chrome/Edge browser extension that helps you compose tweets and replies using AI
              while maintaining your unique brand voice. The extension integrates seamlessly with Twitter/X,
              providing a side panel UI for tweet generation with support for multiple brand voices and AI models.
            </p>
          </section>

          <section className="stack-sm">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Features</h2>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--koto-sakura-pink)' }}>•</span>
                <span>AI-powered tweet generation with OpenAI GPT models</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--koto-sakura-pink)' }}>•</span>
                <span>Multiple brand voices with customizable tone attributes</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--koto-sakura-pink)' }}>•</span>
                <span>Context-aware replies that adapt to target user's style</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--koto-sakura-pink)' }}>•</span>
                <span>Encrypted local storage for API keys</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--koto-sakura-pink)' }}>•</span>
                <span>Tweet length presets (standard, long-form)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--koto-sakura-pink)' }}>•</span>
                <span>Seamless integration with Twitter/X compose boxes</span>
              </li>
            </ul>
          </section>

          <section className="stack-sm">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Version Information</h2>
            <div className="rounded-xl px-4 py-3" style={{
              backgroundColor: 'var(--koto-bg-dark)',
              border: '1px solid var(--koto-border)'
            }}>
              <p className="text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>
                Version: <span style={{ color: 'var(--koto-sakura-pink)' }}>{manifestVersion}</span>
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                Manifest Version 3
              </p>
            </div>
          </section>

          <section className="stack-sm">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Privacy & Security</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--koto-text-secondary)' }}>
              Your privacy is our priority. Kotodama stores all data locally in your browser using IndexedDB
              and Chrome's storage API. Your API keys are encrypted using the Web Crypto API before storage.
              We never upload or share your data with any external services except when you explicitly request
              tweet generation through your configured AI provider.
            </p>
          </section>

          <section className="stack-sm">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Open Source</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--koto-text-secondary)' }}>
              Kotodama is open source software. We welcome contributions, bug reports, and feature requests.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://github.com/kotodama/kotodama"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition koto-button-hover"
                style={{
                  borderColor: 'var(--koto-border)',
                  color: 'var(--koto-text-primary)'
                }}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>
              <a
                href="https://github.com/kotodama/kotodama/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition koto-button-hover"
                style={{
                  borderColor: 'var(--koto-border)',
                  color: 'var(--koto-text-primary)'
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Issue
              </a>
            </div>
          </section>

          <section className="stack-sm">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>License</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--koto-text-secondary)' }}>
              Licensed under the ISC License. See the LICENSE file in the source repository for details.
            </p>
          </section>
        </div>

        <footer className="border-t pt-6 text-center" style={{ borderColor: 'var(--koto-border)' }}>
          <p className="text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
            Made with ❤️ by the Kotodama Team
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
            © {new Date().getFullYear()} Kotodama. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default About;
