import React, { useRef, useState } from 'react';
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
          theme: 'auto',
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
        name: brandVoiceName || 'My Brand Voice',
        description: brandVoiceDescription,
        exampleTweets: exampleTweets.filter((tweet) => tweet.trim() !== ''),
        toneAttributes: {
          formality: 50,
          humor: 50,
          technicality: 50,
        },
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
  const progress = (step / totalSteps) * 100;
  const activeStep = steps.find((item) => item.id === step);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-20%] h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-40%] h-[360px] bg-gradient-to-t from-slate-900 via-slate-950" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-5 py-14 sm:px-8 lg:flex-row lg:items-start lg:py-20">
        <aside className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_70px_-15px_rgba(15,23,42,0.65)] backdrop-blur xl:w-[340px]">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-indigo-500/40 blur-3xl" />
            <div className="absolute bottom-4 right-6 h-40 w-40 rounded-full bg-blue-400/30 blur-3xl" />
          </div>

          <div className="relative space-y-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-indigo-200">
                Kotodama setup
              </span>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Make the assistant sound like you
              </h1>
              <p className="text-sm text-slate-200/85">
                Spend two quick steps to lock in access and tone. Everything is stored locally and fully encrypted before it hits disk.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/80">You&apos;ll cover</p>
              <ul className="space-y-5 text-sm text-slate-200/90">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/80 text-[0.75rem] font-semibold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-slate-100">Connect your key</p>
                    <p className="text-slate-300/80">We never transmit or log it—everything stays on this browser profile.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/80 text-[0.75rem] font-semibold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-slate-100">Tune your voice</p>
                    <p className="text-slate-300/80">Add signature phrases or references so generated drafts hit your vibe immediately.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-3 text-xs uppercase tracking-[0.35em] text-indigo-200/70">
              <p>Zero accounts. Zero analytics.</p>
              <p>Revoke, export, and delete any time.</p>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="h-full rounded-3xl border border-white/10 bg-slate-900/75 shadow-[0_35px_70px_-20px_rgba(15,23,42,0.55)] backdrop-blur">
            <header className="space-y-6 border-b border-white/10 px-6 py-8 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300/90">
                    Step {step} of {totalSteps}
                  </p>
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">{activeStep?.title}</h2>
                  <p className="max-w-xl text-sm text-slate-300 sm:text-base">{activeStep?.description}</p>
                </div>

                <ol className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2">
                  {steps.map((item, index) => {
                    const isActive = step === item.id;
                    const isCompleted = step > item.id;

                    return (
                      <li key={item.id} className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                            isCompleted
                              ? 'bg-indigo-500 text-white shadow-[0_8px_16px_rgba(79,70,229,0.45)]'
                              : isActive
                                ? 'bg-white text-indigo-600 shadow-[0_0_0_3px_rgba(129,140,248,0.35)]'
                                : 'text-slate-500'
                          }`}
                        >
                          {item.id}
                        </span>
                        {index < totalSteps - 1 && (
                          <span
                            className={`h-px w-10 rounded-full transition ${
                              isCompleted ? 'bg-indigo-400/80' : 'bg-white/10'
                            }`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800">Brand voice name</label>
                  <input
                    type="text"
                    value={brandVoiceName}
                    onChange={(event) => {
                      setBrandVoiceName(event.target.value);
                      setImportFeedback(null);
                    }}
                    placeholder="e.g., Confident, Playful, Technical"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800">Description (optional)</label>
                  <textarea
                    value={brandVoiceDescription}
                    onChange={(event) => {
                      setBrandVoiceDescription(event.target.value);
                      setImportFeedback(null);
                    }}
                    placeholder="Share key phrases, tone notes, or instructions for the AI..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              )}
            </header>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">Import from markdown</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100"
                    >
                      Upload .md file
                    </button>
                    <p className="text-xs text-slate-500">
                      Use headings like “Name”, “Description”, and “Example Tweets” to prefill the form automatically.
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
                        importFeedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {importFeedback.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-slate-800">
                      Example tweets <span className="text-slate-400">(up to 5)</span>
                    </label>
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(event) => setOpenaiKey(event.target.value)}
                      placeholder="sk-..."
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-slate-100 placeholder:text-slate-400 focus:border-indigo-300/80 focus:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    />
                    <p className="text-sm text-slate-400">
                      Don&apos;t have a key?{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-300 hover:text-indigo-200"
                      >
                        Generate one here
                      </a>
                      .
                    </p>
                  </div>
                  <div className="space-y-2">
                    {exampleTweets.map((tweet, index) => (
                      <div key={index} className="space-y-1">
                        <input
                          type="text"
                          value={tweet}
                          onChange={(event) => handleExampleTweetChange(index, event.target.value)}
                          placeholder={`Example ${index + 1}...`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                        {exampleTweetStatuses[index] === 'loading' && (
                          <p className="px-1 text-xs text-indigo-500">Fetching tweet text…</p>
                        )}
                        {exampleTweetStatuses[index] === 'error' && (
                          <p className="px-1 text-xs text-rose-600">{exampleTweetErrors[index]}</p>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-slate-500">
                      Paste a tweet link to pull in its text automatically.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={() => setOpenaiKey('')}
                      className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base font-medium text-slate-100 transition hover:bg-white/10 sm:flex-none sm:px-6"
                    >
                      Clear field
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!openaiKey.trim()}
                      className="flex-1 rounded-2xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow-[0_18px_35px_-12px_rgba(79,70,229,0.65)] transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600/60 disabled:text-slate-300 disabled:shadow-none sm:flex-none sm:px-6"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-200">Brand voice name</label>
                    <input
                      type="text"
                      value={brandVoiceName}
                      onChange={(event) => setBrandVoiceName(event.target.value)}
                      placeholder="e.g., Confident, Playful, Technical"
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-slate-100 placeholder:text-slate-400 focus:border-indigo-300/80 focus:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-200">Description (optional)</label>
                    <textarea
                      value={brandVoiceDescription}
                      onChange={(event) => setBrandVoiceDescription(event.target.value)}
                      placeholder="Share key phrases, tone notes, or instructions for the AI..."
                      rows={4}
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-slate-100 placeholder:text-slate-400 focus:border-indigo-300/80 focus:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-sm font-medium text-slate-200">
                        Example tweets <span className="text-slate-400">(up to 5)</span>
                      </label>
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                        Optional but powerful
                      </span>
                    </div>
                    <div className="space-y-2">
                      {exampleTweets.map((tweet, index) => (
                        <input
                          key={index}
                          type="text"
                          value={tweet}
                          onChange={(event) => handleExampleTweetChange(index, event.target.value)}
                          placeholder={`Example ${index + 1}...`}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 transition focus:border-indigo-300/70 focus:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                    <p className="font-semibold text-white">Pro tip</p>
                    <p className="mt-1 text-slate-300">
                      Mix short and long examples. Mention catchphrases or hashtags so Kotodama highlights them when drafting replies.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base font-semibold text-slate-100 transition hover:bg-white/10 sm:flex-none sm:px-6"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow-[0_18px_35px_-12px_rgba(79,70,229,0.65)] transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600/60 disabled:text-slate-300 disabled:shadow-none sm:flex-none sm:px-6"
                    >
                      {isSubmitting ? 'Setting up…' : 'Complete setup'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Onboarding;
