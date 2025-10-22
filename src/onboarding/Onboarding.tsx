import React, { useEffect, useRef, useState } from 'react';
import { BrandVoice, UserSettings } from '../types';
import { parseBrandVoiceMarkdown } from './brandVoiceImport';

const MAX_EXAMPLE_TWEETS = 5;

type ExampleTweetStatus = 'idle' | 'loading' | 'error';

const isTwitterStatusUrl = (value: string) =>
  /^(https?:\/\/)?(www\.)?(twitter|x)\.com\/[A-Za-z0-9_]+\/status\/\d+/i.test(value.trim());

const extractTweetId = (url: string) => {
  const match = url.match(/status\/(\d+)/i);
  return match ? match[1] : undefined;
};

const fetchTweetText = async (url: string): Promise<string | null> => {
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    return null;
  }

  try {
    const response = await fetch(`https://cdn.syndication.twimg.com/widgets/tweet?id=${tweetId}&lang=en`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    if (data && typeof data === 'object') {
      const text =
        (data as { text?: string; full_text?: string }).text ||
        (data as { text?: string; full_text?: string }).full_text;
      if (typeof text === 'string' && text.trim()) {
        return text.replace(/\s+/g, ' ').trim();
      }
    }
  } catch (error) {
    console.error('Failed to fetch tweet text', error);
    return null;
  }

  return null;
};

const steps = [
  {
    id: 1,
    title: 'Connect OpenAI',
    description:
      'Securely store your OpenAI API key so Kotodama can craft drafts that sound like you.',
    helper:
      'Keys are encrypted locally using the Web Crypto API before being written to storage. You can revoke or replace them any time from settings.',
  },
  {
    id: 2,
    title: 'Teach Your Voice',
    description:
      'Share a few cues and examples so responses match the tone, pacing, and vocabulary you use on social.',
    helper:
      'Aim for 2–5 high-signal examples. Mention go-to phrases, emojis, or hashtags to keep in heavy rotation.',
  },
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [openaiKey, setOpenaiKey] = useState('');
  const [brandVoiceName, setBrandVoiceName] = useState('');
  const [brandVoiceDescription, setBrandVoiceDescription] = useState('');
  const [exampleTweets, setExampleTweets] = useState<string[]>(() =>
    Array.from({ length: MAX_EXAMPLE_TWEETS }, () => ''),
  );
  const [exampleTweetStatuses, setExampleTweetStatuses] = useState<ExampleTweetStatus[]>(() =>
    Array.from({ length: MAX_EXAMPLE_TWEETS }, () => 'idle'),
  );
  const [exampleTweetErrors, setExampleTweetErrors] = useState<string[]>(() =>
    Array.from({ length: MAX_EXAMPLE_TWEETS }, () => ''),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);
  const exampleTweetRequestTokens = useRef<number[]>(
    Array.from({ length: MAX_EXAMPLE_TWEETS }, () => 0),
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('skipRedirect') === '1') {
      return;
    }

    const checkExistingConfiguration = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'get-settings',
        });

        if (response.success) {
          const existingSettings = response.data as UserSettings;
          const existingKey = existingSettings.apiKeys.openai;

          if (typeof existingKey === 'string' && existingKey.trim()) {
            const settingsUrl = chrome.runtime.getURL('src/settings/index.html');
            window.location.replace(settingsUrl);
          }
        }
      } catch (error) {
        console.error('Failed to verify existing configuration', error);
      }
    };

    checkExistingConfiguration();
  }, []);

  const handleExampleTweetChange = (index: number, value: string) => {
    setImportFeedback(null);
    setExampleTweets((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });

    setExampleTweetErrors((previous) => {
      const next = [...previous];
      next[index] = '';
      return next;
    });

    const nextToken = exampleTweetRequestTokens.current[index] + 1;
    exampleTweetRequestTokens.current[index] = nextToken;

    const trimmed = value.trim();
    if (!isTwitterStatusUrl(trimmed)) {
      setExampleTweetStatuses((previous) => {
        const next = [...previous];
        next[index] = 'idle';
        return next;
      });
      return;
    }

    setExampleTweetStatuses((previous) => {
      const next = [...previous];
      next[index] = 'loading';
      return next;
    });

    fetchTweetText(trimmed)
      .then((text) => {
        if (exampleTweetRequestTokens.current[index] !== nextToken) {
          return;
        }

        if (text) {
          setExampleTweets((previous) => {
            const next = [...previous];
            next[index] = text;
            return next;
          });
          setExampleTweetStatuses((previous) => {
            const next = [...previous];
            next[index] = 'idle';
            return next;
          });
        } else {
          setExampleTweetStatuses((previous) => {
            const next = [...previous];
            next[index] = 'error';
            return next;
          });
          setExampleTweetErrors((previous) => {
            const next = [...previous];
            next[index] = 'We could not extract text from that tweet link.';
            return next;
          });
        }
      })
      .catch(() => {
        if (exampleTweetRequestTokens.current[index] !== nextToken) {
          return;
        }

        setExampleTweetStatuses((previous) => {
          const next = [...previous];
          next[index] = 'error';
          return next;
        });
        setExampleTweetErrors((previous) => {
          const next = [...previous];
          next[index] = 'Failed to fetch the tweet content. Try pasting the text manually.';
          return next;
        });
      });
  };

  const handleMarkdownImport: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportFeedback(null);
      const text = await file.text();
      const parsed = parseBrandVoiceMarkdown(text);

      if (!parsed.name && !parsed.description && parsed.exampleTweets.length === 0) {
        throw new Error('No brand voice content found');
      }

      if (parsed.name) {
        setBrandVoiceName(parsed.name);
      }

      if (parsed.description !== undefined) {
        setBrandVoiceDescription(parsed.description);
      }

      if (parsed.exampleTweets.length > 0) {
        const normalized = Array.from({ length: MAX_EXAMPLE_TWEETS }, (_, index) =>
          parsed.exampleTweets[index] ?? '',
        );
        setExampleTweets(normalized);
      }

      setExampleTweetStatuses(Array.from({ length: MAX_EXAMPLE_TWEETS }, () => 'idle'));
      setExampleTweetErrors(Array.from({ length: MAX_EXAMPLE_TWEETS }, () => ''));
      exampleTweetRequestTokens.current = Array.from({ length: MAX_EXAMPLE_TWEETS }, () => 0);

      setImportFeedback({
        type: 'success',
        message: 'Loaded your brand voice from markdown.',
      });
    } catch (error) {
      console.error('Failed to import brand voice markdown', error);
      setImportFeedback({
        type: 'error',
        message:
          'Could not parse the markdown file. Include "Name", "Description", and "Example Tweets" sections.',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      } else {
        event.target.value = '';
      }
    }
  };

  const handleComplete = async () => {
    if (!brandVoiceName.trim()) {
      alert('Please enter a name for your brand voice');
      return;
    }

    if (!brandVoiceDescription.trim()) {
      alert('Please enter a description for your brand voice');
      return;
    }

    const validExamples = exampleTweets.filter((tweet) => tweet.trim() !== '');
    if (validExamples.length === 0) {
      alert('Please provide at least one example tweet');
      return;
    }

    setIsSubmitting(true);

    try {
      const settings: UserSettings = {
        apiKeys: {
          openai: openaiKey,
        },
        analysisDepth: 20,
        ui: {
          buttonPosition: 'top-right',
          panelWidth: 400,
          theme: 'light',
        },
        features: {
          autoAnalyze: true,
          rememberHistory: true,
          showToneControls: true,
        },
      };

      await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      const brandVoice: BrandVoice = {
        id: crypto.randomUUID(),
        name: brandVoiceName.trim(),
        description: brandVoiceDescription.trim(),
        exampleTweets: validExamples,
        toneAttributes: {
          formality: 50,
          humor: 50,
          technicality: 50,
          empathy: 50,
          energy: 50,
          authenticity: 50,
        },
        category: 'custom',
        tags: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await chrome.runtime.sendMessage({
        type: 'save-brand-voice',
        payload: brandVoice,
      });

      settings.defaultBrandVoiceId = brandVoice.id;
      await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      alert('Setup complete! Visit Twitter/X and click the sparkle button in any compose box.');
      window.close();
    } catch (error) {
      console.error('Setup failed:', error);
      alert('Setup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = steps.length;
  const activeStep = steps.find((item) => item.id === step);

  return (
    <div className="relative min-h-screen overflow-hidden light-mode" style={{ backgroundColor: 'var(--koto-bg-light)', color: 'var(--koto-text-primary)' }}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-5 py-14 sm:px-8 lg:flex-row lg:items-start lg:py-20">
        <aside className="relative w-full overflow-hidden rounded-3xl border p-8 shadow-2xl backdrop-blur xl:w-[340px]" style={{
          borderColor: 'var(--koto-border)',
          backgroundColor: 'var(--koto-surface)',
          boxShadow: 'var(--koto-shadow-lg)'
        }}>
          <div className="relative space-y-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.35em]" style={{
                borderColor: 'var(--koto-border)',
                backgroundColor: 'rgba(232, 92, 143, 0.1)',
                color: 'var(--koto-sakura-pink)'
              }}>
                Kotodama setup
              </span>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: 'var(--koto-text-primary)' }}>
                Make the assistant sound like you
              </h1>
              <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                Spend two quick steps to lock in access and tone. Everything is stored locally and fully encrypted before it hits disk.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border p-6" style={{
              borderColor: 'var(--koto-border)',
              backgroundColor: 'rgba(240, 242, 248, 0.5)'
            }}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--koto-sakura-pink)' }}>You&apos;ll cover</p>
              <ul className="space-y-5 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/80 text-[0.75rem] font-semibold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--koto-text-primary)' }}>Connect your key</p>
                    <p style={{ color: 'var(--koto-text-secondary)' }}>We never transmit or log it—everything stays on this browser profile.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/80 text-[0.75rem] font-semibold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--koto-text-primary)' }}>Tune your voice</p>
                    <p style={{ color: 'var(--koto-text-secondary)' }}>Add signature phrases or references so generated drafts hit your vibe immediately.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--koto-text-secondary)' }}>
              <p>Zero accounts. Zero analytics.</p>
              <p>Revoke, export, and delete any time.</p>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="h-full rounded-3xl border backdrop-blur" style={{
            borderColor: 'var(--koto-border)',
            backgroundColor: 'var(--koto-surface)',
            boxShadow: 'var(--koto-shadow-lg)'
          }}>
            <header className="space-y-6 border-b px-6 py-8 sm:px-8" style={{ borderColor: 'var(--koto-border)' }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: 'var(--koto-sakura-pink)' }}>
                    Step {step} of {totalSteps}
                  </p>
                  <h2 className="text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--koto-text-primary)' }}>{activeStep?.title}</h2>
                  <p className="max-w-xl text-sm sm:text-base" style={{ color: 'var(--koto-text-secondary)' }}>{activeStep?.description}</p>
                </div>

                <ol className="flex items-center gap-2 rounded-full border p-2" style={{
                  borderColor: 'var(--koto-border)',
                  backgroundColor: 'rgba(240, 242, 248, 0.5)'
                }}>
                  {steps.map((item, index) => {
                    const isActive = step === item.id;
                    const isCompleted = step > item.id;

                    return (
                      <li key={item.id} className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                            isCompleted
                              ? 'bg-indigo-500 text-white'
                              : isActive
                                ? 'text-indigo-600'
                                : ''
                          }`}
                          style={
                            isActive && !isCompleted
                              ? { backgroundColor: 'white', color: 'rgb(79, 70, 229)', boxShadow: '0 0 0 3px rgba(129, 140, 248, 0.25)' }
                              : isCompleted
                                ? { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }
                                : !isActive && !isCompleted
                                  ? { color: 'var(--koto-text-secondary)' }
                                  : {}
                          }
                        >
                          {item.id}
                        </span>
                        {index < totalSteps - 1 && (
                          <span
                            className="h-px w-10 rounded-full transition"
                            style={{
                              backgroundColor: isCompleted
                                ? 'rgba(129, 140, 248, 0.8)'
                                : 'var(--koto-border)'
                            }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </header>

            <div className="space-y-8 px-6 py-8 sm:px-8">
              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>OpenAI API key</label>
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(event) => setOpenaiKey(event.target.value)}
                      placeholder="sk-..."
                      className="w-full rounded-2xl border px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'var(--koto-bg-dark)',
                        color: 'var(--koto-text-primary)'
                      }}
                    />
                    <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                      Don&apos;t have a key?{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium"
                        style={{ color: 'var(--koto-sakura-pink)' }}
                      >
                        Generate one here
                      </a>
                      .
                    </p>
                  </div>

                  <div className="rounded-2xl border p-5 text-sm" style={{
                    borderColor: 'var(--koto-border)',
                    backgroundColor: 'rgba(240, 242, 248, 0.5)',
                    color: 'var(--koto-text-secondary)'
                  }}>
                    <p className="font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Why we ask</p>
                    <p className="mt-1">
                      Keys are encrypted locally using the Web Crypto API before they&apos;re stored. You can revoke or replace them
                      any time from settings.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setOpenaiKey('')}
                      className="flex-1 rounded-2xl border px-4 py-3 text-base font-medium transition sm:flex-none sm:px-6"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'rgba(240, 242, 248, 0.5)',
                        color: 'var(--koto-text-primary)'
                      }}
                    >
                      Clear field
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!openaiKey.trim()}
                      className="flex-1 rounded-2xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:shadow-none sm:flex-none sm:px-6"
                      style={{
                        backgroundColor: !openaiKey.trim()
                          ? 'var(--koto-border)'
                          : 'rgb(99, 102, 241)',
                        color: !openaiKey.trim()
                          ? 'var(--koto-text-secondary)'
                          : 'white',
                        boxShadow: !openaiKey.trim()
                          ? 'none'
                          : '0 4px 12px rgba(79, 70, 229, 0.3)'
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>
                      Brand voice name <span style={{ color: 'var(--koto-error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={brandVoiceName}
                      onChange={(event) => {
                        setBrandVoiceName(event.target.value);
                        setImportFeedback(null);
                      }}
                      placeholder="e.g., Confident, Playful, Technical"
                      required
                      className="w-full rounded-2xl border px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'var(--koto-bg-dark)',
                        color: 'var(--koto-text-primary)'
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>
                      Description <span style={{ color: 'var(--koto-error)' }}>*</span>
                    </label>
                    <textarea
                      value={brandVoiceDescription}
                      onChange={(event) => {
                        setBrandVoiceDescription(event.target.value);
                        setImportFeedback(null);
                      }}
                      placeholder="Share key phrases, tone notes, or instructions for the AI..."
                      rows={4}
                      required
                      className="w-full rounded-2xl border px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'var(--koto-bg-dark)',
                        color: 'var(--koto-text-primary)'
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>Import from markdown</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition"
                        style={{
                          borderColor: 'var(--koto-sakura-pink)',
                          backgroundColor: 'rgba(232, 92, 143, 0.1)',
                          color: 'var(--koto-sakura-pink)'
                        }}
                      >
                        Upload .md file
                      </button>
                      <p className="text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                        Use headings like "Name", "Description", and "Example Tweets" to prefill the form automatically.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.markdown,text/markdown"
                      onChange={handleMarkdownImport}
                      className="hidden"
                    />
                    {importFeedback && (
                      <p
                        className={`text-xs ${
                          importFeedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {importFeedback.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>
                        Example tweets <span style={{ color: 'var(--koto-text-secondary)' }}>(up to {MAX_EXAMPLE_TWEETS})</span>
                      </label>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--koto-sakura-pink)' }}>
                        Optional but powerful
                      </span>
                    </div>
                    <div className="space-y-2">
                      {exampleTweets.map((tweet, index) => (
                        <div key={index} className="space-y-1">
                          <input
                            type="text"
                            value={tweet}
                            onChange={(event) => handleExampleTweetChange(index, event.target.value)}
                            placeholder={`Example ${index + 1}...`}
                            className="w-full rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-2"
                            style={{
                              borderColor: 'var(--koto-border)',
                              backgroundColor: 'var(--koto-bg-dark)',
                              color: 'var(--koto-text-primary)'
                            }}
                          />
                          {exampleTweetStatuses[index] === 'loading' && (
                            <p className="px-1 text-xs" style={{ color: 'var(--koto-sakura-pink)' }}>Fetching tweet text…</p>
                          )}
                          {exampleTweetStatuses[index] === 'error' && (
                            <p className="px-1 text-xs text-rose-400">{exampleTweetErrors[index]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--koto-text-secondary)' }}>Paste a tweet link to pull in its text automatically.</p>
                  </div>

                  <div className="rounded-2xl border p-5 text-sm" style={{
                    borderColor: 'var(--koto-border)',
                    backgroundColor: 'rgba(240, 242, 248, 0.5)',
                    color: 'var(--koto-text-secondary)'
                  }}>
                    <p className="font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Pro tip</p>
                    <p className="mt-1">
                      Mix short and long examples. Mention catchphrases or hashtags so Kotodama highlights them when drafting replies.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-2xl border px-4 py-3 text-base font-semibold transition sm:flex-none sm:px-6"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'rgba(240, 242, 248, 0.5)',
                        color: 'var(--koto-text-primary)'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:shadow-none sm:flex-none sm:px-6"
                      style={{
                        backgroundColor: isSubmitting
                          ? 'var(--koto-border)'
                          : 'rgb(99, 102, 241)',
                        color: isSubmitting
                          ? 'var(--koto-text-secondary)'
                          : 'white',
                        boxShadow: isSubmitting
                          ? 'none'
                          : '0 4px 12px rgba(79, 70, 229, 0.3)'
                      }}
                    >
                      {isSubmitting ? 'Setting up…' : 'Complete setup'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Onboarding;
