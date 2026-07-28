import React, { useEffect, useRef, useState } from 'react';
import { AIProvider, BrandVoice, UserSettings } from '../types';
import { getDefaultModelForProvider } from '../constants/models';
import { parseBrandVoiceMarkdown } from './brandVoiceImport';
import { useRuntimeMessaging } from '../hooks/useRuntimeMessaging';
import { RuntimeInvalidatedModal } from '../components/RuntimeInvalidatedModal';
import { VOICE_TEMPLATES } from './constants/voiceTemplates';
import { getDefaultToneAttributes } from '../utils/brandVoiceUtils';
import { BrandLogo } from '../components/BrandLogo';
import { applyTheme } from '../utils/theme';

const MAX_EXAMPLE_TWEETS = 5;

type ExampleTweetStatus = 'idle' | 'loading' | 'error';
type Step2Mode = 'selection' | 'form';

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

const PROVIDER_META: { id: AIProvider; label: string; placeholder: string; keyUrl: string }[] = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', label: 'Gemini', placeholder: 'AIza...', keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'claude', label: 'Claude', placeholder: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
];

const steps = [
  {
    id: 1,
    title: 'Connect an AI',
    description: 'One API key. Kotodama uses it to read tweets and draft your replies.',
  },
  {
    id: 2,
    title: 'Teach your voice',
    description: 'A description and a few examples are enough for replies to sound like you.',
  },
];

const Onboarding: React.FC = () => {
  const { sendMessage, isInvalidated } = useRuntimeMessaging();
  const [step, setStep] = useState(1);
  const [step2Mode, setStep2Mode] = useState<Step2Mode>('selection');

  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
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

  const [toneAttributes, setToneAttributes] = useState(getDefaultToneAttributes());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  const exampleTweetRequestTokens = useRef<number[]>(
    Array.from({ length: MAX_EXAMPLE_TWEETS }, () => 0),
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    // `skipRedirect` means "re-running setup on purpose" — still load settings,
    // just don't bounce back out. That's also the case where an explicit theme
    // exists to honour.
    const skipRedirect = url.searchParams.get('skipRedirect') === '1';

    const checkExistingConfiguration = async () => {
      try {
        const existingSettings = await sendMessage<UserSettings>({
          type: 'get-settings',
        });

        applyTheme(existingSettings.ui?.theme);

        const hasKey = PROVIDER_META.some(({ id }) => existingSettings.apiKeys?.[id]?.trim());

        if (hasKey && !skipRedirect) {
          const settingsUrl = chrome.runtime.getURL('src/settings/index.html');
          window.location.replace(settingsUrl);
        }
      } catch (error) {
        console.error('Failed to verify existing configuration', error);
      }
    };

    checkExistingConfiguration();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const template = VOICE_TEMPLATES.find(t => t.id === templateId);

    if (template) {
      if (template.id === 'custom') {
        setBrandVoiceName('');
        setBrandVoiceDescription('');
        setExampleTweets(Array.from({ length: MAX_EXAMPLE_TWEETS }, () => ''));
        setToneAttributes(getDefaultToneAttributes());
      } else {
        setBrandVoiceName(template.name);
        setBrandVoiceDescription(template.description);

        const examples = [...template.exampleTweets];
        while (examples.length < MAX_EXAMPLE_TWEETS) examples.push('');
        setExampleTweets(examples);

        let attrs = getDefaultToneAttributes();
        if (template.id === 'professional') attrs = { ...attrs, formality: 80, humor: 10, technicality: 60 };
        if (template.id === 'casual') attrs = { ...attrs, formality: 20, humor: 70, empathy: 80 };
        if (template.id === 'witty') attrs = { ...attrs, formality: 40, humor: 90, technicality: 80, energy: 70 };
        setToneAttributes(attrs);
      }

      setStep2Mode('form');
    }
  };

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
    const validExamples = exampleTweets.filter((tweet) => tweet.trim() !== '');

    // Inline, next to the button that failed — not an OS alert box.
    if (!brandVoiceName.trim()) return setSubmitError('Give this voice a name.');
    if (!brandVoiceDescription.trim()) return setSubmitError('Add a short description of how this voice sounds.');
    if (validExamples.length === 0) return setSubmitError('Add at least one example so the model has something to imitate.');

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const settings: UserSettings = {
        apiKeys: { [provider]: apiKey.trim() },
        defaultProvider: provider,
        defaultModel: getDefaultModelForProvider(provider),
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

      await sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      const brandVoice: BrandVoice = {
        id: crypto.randomUUID(),
        name: brandVoiceName.trim(),
        description: brandVoiceDescription.trim(),
        exampleTweets: validExamples,
        toneAttributes: toneAttributes,
        category: 'custom',
        tags: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await sendMessage({
        type: 'save-brand-voice',
        payload: brandVoice,
      });

      settings.defaultBrandVoiceId = brandVoice.id;
      await sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      setStep(3);
    } catch (error) {
      console.error('Setup failed:', error);
      setSubmitError('Could not save your setup. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStep = steps.find((item) => item.id === step);
  const activeProvider = PROVIDER_META.find((item) => item.id === provider) ?? PROVIDER_META[0];

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-[34rem] flex-col px-6 py-12 sm:py-20">
        <header className="flex items-center gap-2.5">
          <BrandLogo size={22} />
          <span className="text-sm font-medium tracking-tight text-ink">Kotodama</span>
        </header>

        {/* Progress: one segment per step. A row of numbered circles was
            three elements saying what two hairlines say. */}
        {step <= steps.length && (
          <div className="mt-10 flex gap-1.5" role="group" aria-label={`Step ${step} of ${steps.length}`}>
            {steps.map((s) => (
              <span
                key={s.id}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${s.id <= step ? 'bg-accent' : 'bg-line'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Step 3 is the done screen — no form, no progress bar. */}
        {step === 3 ? (
          <main className="koto-rise mt-16 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">You&apos;re set up.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Open any tweet on X and hit Reply. The sparkle button reads the tweet — text, images and the
              thread above it — then drafts a response in your voice.
            </p>
            <button type="button" onClick={() => window.close()} className="koto-btn koto-btn-primary mt-8">
              Close this tab
            </button>
          </main>
        ) : (
          <main className="koto-rise mt-8 flex-1">
            <p className="text-xs font-medium text-accent-text">Step {step} of {steps.length}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{activeStep?.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{activeStep?.description}</p>

            {/* Step 1: API key */}
            {step === 1 && (
              <div className="mt-10 space-y-8">
                <fieldset>
                  <legend className="koto-label">Provider</legend>
                  <div className="flex flex-wrap gap-2">
                    {PROVIDER_META.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setProvider(id)}
                        aria-pressed={provider === id}
                        className={`h-9 rounded-koto border px-3.5 text-sm transition-colors duration-150 ${provider === id
                          ? 'border-ink bg-ink font-medium text-canvas'
                          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-faint">
                    One key is enough. The others can be added later in settings.
                  </p>
                </fieldset>

                <div>
                  <label className="koto-label" htmlFor="onboarding-api-key">
                    {activeProvider.label} API key
                  </label>
                  <input
                    id="onboarding-api-key"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={activeProvider.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="koto-field font-mono"
                  />
                  <p className="mt-2 text-xs text-faint">
                    No key yet?{' '}
                    <a
                      href={activeProvider.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-text underline underline-offset-2"
                    >
                      Generate one
                    </a>
                    . It is encrypted with the Web Crypto API before it touches storage, and never leaves
                    your machine except to call {activeProvider.label}.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!apiKey.trim()}
                    className="koto-btn koto-btn-primary"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2a: pick a starting point */}
            {step === 2 && step2Mode === 'selection' && (
              <div className="mt-10">
                {/* A list, not a grid of emoji cards — these are options, not products. */}
                <ul className="divide-y divide-line border-y border-line">
                  {VOICE_TEMPLATES.map((template) => (
                    <li key={template.id}>
                      <button
                        type="button"
                        onClick={() => handleTemplateSelect(template.id)}
                        className="group flex w-full items-start gap-3 py-4 text-left transition-colors duration-150 hover:bg-raise"
                      >
                        <span aria-hidden className="mt-0.5 w-5 shrink-0 text-center text-sm">
                          {template.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink">{template.name}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                            {template.description}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-0.5 text-sm text-faint transition-colors group-hover:text-ink"
                        >
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button type="button" onClick={() => setStep(1)} className="koto-btn koto-btn-ghost -ml-3.5">
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 2b: the voice itself */}
            {step === 2 && step2Mode === 'form' && (
              <div className="mt-10 space-y-8">
                <div>
                  <label className="koto-label" htmlFor="voice-name">Name</label>
                  <input
                    id="voice-name"
                    type="text"
                    value={brandVoiceName}
                    onChange={(event) => {
                      setBrandVoiceName(event.target.value);
                      setImportFeedback(null);
                      setSubmitError(null);
                    }}
                    placeholder="Confident, Playful, Technical…"
                    className="koto-field"
                  />
                </div>

                <div>
                  <label className="koto-label" htmlFor="voice-description">How it sounds</label>
                  <textarea
                    id="voice-description"
                    value={brandVoiceDescription}
                    onChange={(event) => {
                      setBrandVoiceDescription(event.target.value);
                      setImportFeedback(null);
                      setSubmitError(null);
                    }}
                    placeholder="Key phrases, tone notes, things to avoid…"
                    rows={4}
                    className="koto-field resize-none"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <label className="koto-label mb-0" htmlFor="example-0">Examples</label>
                    <span className="text-xs text-faint">Up to {MAX_EXAMPLE_TWEETS}</span>
                  </div>
                  <div className="space-y-2">
                    {exampleTweets.map((tweet, index) => (
                      <div key={index}>
                        <input
                          id={`example-${index}`}
                          type="text"
                          value={tweet}
                          onChange={(event) => handleExampleTweetChange(index, event.target.value)}
                          placeholder={index === 0 ? 'Paste a tweet you wrote, or its link' : ''}
                          aria-label={`Example ${index + 1}`}
                          className="koto-field"
                        />
                        {exampleTweetStatuses[index] === 'loading' && (
                          <p className="mt-1 text-xs text-faint">Fetching tweet text…</p>
                        )}
                        {exampleTweetStatuses[index] === 'error' && (
                          <p className="mt-1 text-xs text-danger">{exampleTweetErrors[index]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-faint">
                    Paste a tweet link and its text is pulled in automatically. Mixing short and long ones
                    gives the model more to work with.
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="koto-btn koto-btn-secondary h-9 text-xs"
                    >
                      Import markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                      className="text-xs text-muted underline underline-offset-2 hover:text-ink"
                    >
                      {showMarkdownHelp ? 'Hide format' : 'What format?'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.markdown,text/markdown"
                      onChange={handleMarkdownImport}
                      className="hidden"
                    />
                  </div>

                  {showMarkdownHelp && (
                    <pre className="mt-3 overflow-x-auto rounded-koto border border-line bg-raise p-3 font-mono text-xs leading-relaxed text-muted">{`# My Brand Voice

# Description
Friendly, approachable, professional. Occasional emoji.

# Example Tweets
- Just shipped the new feature. Go break it.
- Thanks for the feedback — genuinely useful.`}</pre>
                  )}

                  {importFeedback && (
                    <p
                      className={`mt-2 text-xs ${importFeedback.type === 'error' ? 'text-danger' : 'text-ok'}`}
                    >
                      {importFeedback.message}
                    </p>
                  )}
                </div>

                {submitError && (
                  <p role="alert" className="text-xs text-danger">{submitError}</p>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep2Mode('selection')}
                    className="koto-btn koto-btn-ghost -ml-3.5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="koto-btn koto-btn-primary"
                  >
                    {isSubmitting ? 'Saving…' : 'Finish setup'}
                  </button>
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      <RuntimeInvalidatedModal isOpen={isInvalidated} />
    </>
  );
};

export default Onboarding;
