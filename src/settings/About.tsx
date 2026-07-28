import React from 'react';
import { Github, Bug } from 'lucide-react';

const About: React.FC = () => {
  const manifestVersion = chrome.runtime.getManifest().version;

  return (
    <div className="koto-rise space-y-8">
      <p className="text-sm leading-relaxed text-muted">
        <span className="text-ink">Kotodama (言霊)</span> is the idea that spoken words carry power. The
        extension reads the tweet you are replying to — text, images, and the thread above it — then drafts
        a response in a voice you defined. Keys stay on your machine; nothing is sent anywhere except the
        provider you chose.
      </p>

      <hr className="koto-rule" />

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Version</dt>
          <dd className="font-mono text-xs text-ink">{manifestVersion}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Author</dt>
          <dd>
            <a
              href="https://github.com/adenaufal"
              target="_blank"
              rel="noreferrer"
              className="text-accent-text underline underline-offset-2"
            >
              @adenaufal
            </a>
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <a
          href="https://github.com/adenaufal/kotodama"
          target="_blank"
          rel="noreferrer"
          className="koto-btn koto-btn-secondary h-9 text-xs"
        >
          <Github size={14} strokeWidth={1.5} />
          Source
        </a>
        <a
          href="https://github.com/adenaufal/kotodama/issues"
          target="_blank"
          rel="noreferrer"
          className="koto-btn koto-btn-secondary h-9 text-xs"
        >
          <Bug size={14} strokeWidth={1.5} />
          Report an issue
        </a>
      </div>
    </div>
  );
};

export default About;
