import React from 'react';
import { Github, Bug, Heart, ExternalLink } from 'lucide-react';

const About: React.FC = () => {
  const manifestVersion = chrome.runtime.getManifest().version;

  return (
    <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
      {/* App Info */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">About</h2>
        <p className="text-[var(--koto-text-secondary)] leading-relaxed">
          <strong className="text-[var(--koto-text-primary)]">Kotodama (言霊)</strong> implies that words hold magical power.
          This extension empowers your digital communication by blending your unique human voice with AI capabilities.
        </p>
      </section>

      {/* Version & Links */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Version & Links</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-sm font-mono text-[var(--koto-text-secondary)]">
            <span>v</span>
            <span className="text-[var(--koto-accent)] font-bold">{manifestVersion}</span>
          </div>
          <a
            href="https://github.com/adenaufal/kotodama"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-sm font-semibold text-[var(--koto-text-primary)] hover:border-[var(--koto-accent)] hover:text-[var(--koto-accent)] transition-colors"
          >
            <Github size={16} />
            GitHub
            <ExternalLink size={12} className="opacity-50" />
          </a>
          <a
            href="https://github.com/adenaufal/kotodama/issues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-sm font-semibold text-[var(--koto-text-primary)] hover:border-[var(--koto-accent)] hover:text-[var(--koto-accent)] transition-colors"
          >
            <Bug size={16} />
            Report Issue
            <ExternalLink size={12} className="opacity-50" />
          </a>
        </div>
      </section>

      <div className="h-px bg-[var(--koto-border-light)]" />

      {/* Credits & Philosophy */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Philosophy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold text-[var(--koto-text-primary)] text-sm">Privacy Focused</h3>
            <p className="text-xs text-[var(--koto-text-tertiary)] mt-1">Your keys, your data. Locally stored.</p>
          </div>
          <div className="p-5 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-center">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="font-semibold text-[var(--koto-text-primary)] text-sm">Open Source</h3>
            <p className="text-xs text-[var(--koto-text-tertiary)] mt-1">Transparent and community-driven.</p>
          </div>
          <div className="p-5 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-center">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-semibold text-[var(--koto-text-primary)] text-sm">AI Powered</h3>
            <p className="text-xs text-[var(--koto-text-tertiary)] mt-1">Smart writing, your voice.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-6 border-t border-[var(--koto-border-light)]">
        <p className="text-xs text-[var(--koto-text-tertiary)] flex items-center justify-center gap-1">
          Made with <Heart size={12} className="text-red-400" /> by <a href="https://github.com/adenaufal" target="_blank" rel="noreferrer" className="text-[var(--koto-accent)] hover:underline">@adenaufal</a>
        </p>
      </div>
    </div>
  );
};

export default About;
