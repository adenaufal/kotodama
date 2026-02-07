import React, { useEffect, useRef, useState } from 'react';
import { BrandVoice, UserSettings } from '../types';
import { parseBrandVoiceMarkdown } from './brandVoiceImport';
import { useRuntimeMessaging } from '../hooks/useRuntimeMessaging';
import { RuntimeInvalidatedModal } from '../components/RuntimeInvalidatedModal';
import { VOICE_TEMPLATES } from './constants/voiceTemplates';
import { getDefaultToneAttributes } from '../utils/brandVoiceUtils';
import { OnboardingLayout } from './components/OnboardingLayout';

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

const steps = [
  {
    id: 1,
    title: 'Connect OpenAI',
    description:
      'Securely store your OpenAI API key so Kotodama can craft drafts that sound like you.',
  },
  {
    id: 2,
    title: 'Teach Your Voice',
    description:
      'Share a few cues and examples so responses match the tone you use on social.',
  },
];

const Onboarding: React.FC = () => {
  const { sendMessage, isInvalidated } = useRuntimeMessaging();
  const [step, setStep] = useState(1);
  const [step2Mode, setStep2Mode] = useState<Step2Mode>('selection');

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

  const [toneAttributes, setToneAttributes] = useState(getDefaultToneAttributes());
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (url.searchParams.get('skipRedirect') === '1') {
      return;
    }

    const checkExistingConfiguration = async () => {
      try {
        const existingSettings = await sendMessage<UserSettings>({
          type: 'get-settings',
        });

        const existingKey = existingSettings.apiKeys.openai;

        if (typeof existingKey === 'string' && existingKey.trim()) {
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

      alert('Setup complete! Visit Twitter/X and click the sparkle button in any compose box.');
      window.close();
    } catch (error) {
      console.error('Setup failed:', error);
      alert('Setup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStep = steps.find((item) => item.id === step);

  return (
    <>
      <OnboardingLayout
        currentStep={step}
        totalSteps={steps.length}
        stepLabels={steps.map(s => s.title)}
      >
        {/* Step Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--koto-sakura-pink)] mb-2">
            Step {step} of {steps.length}
          </p>
          <h2 className="text-2xl font-bold text-[var(--koto-text-primary)] mb-2">
            {activeStep?.title}
          </h2>
          <p className="text-sm text-[var(--koto-text-secondary)]">
            {activeStep?.description}
          </p>
        </div>

        <div className="koto-divider" />

        {/* Step 1: API Key */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="koto-label">OpenAI API Key</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(event) => setOpenaiKey(event.target.value)}
                placeholder="sk-..."
                className="koto-input font-mono"
              />
              <p className="text-xs text-[var(--koto-text-tertiary)]">
                Don&apos;t have a key?{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--koto-sakura-pink)] hover:underline"
                >
                  Generate one here
                </a>
                .
              </p>
            </div>

            <div className="koto-info-box neutral">
              <p className="font-semibold text-[var(--koto-text-primary)] mb-1">🔒 Your data is safe</p>
              <p>
                Keys are encrypted locally using the Web Crypto API before they&apos;re stored. You can revoke or replace them any time from settings.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => setOpenaiKey('')}
                className="koto-btn koto-btn-secondary flex-1 sm:flex-none"
              >
                Clear field
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!openaiKey.trim()}
                className="koto-btn koto-btn-primary flex-1 sm:flex-none"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Template Selection */}
        {step === 2 && step2Mode === 'selection' && (
          <div className="space-y-6">
            <p className="text-sm text-[var(--koto-text-secondary)]">
              Choose a starting point for your voice profile:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOICE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="group relative overflow-hidden text-left p-6 rounded-2xl border border-[var(--koto-border-light)] bg-[var(--koto-bg-elevated)] hover:border-[var(--koto-border)] hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 origin-bottom-left text-[var(--koto-text-primary)] opacity-80 group-hover:opacity-100">
                    {template.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--koto-text-primary)] mb-2 group-hover:text-[var(--koto-accent)] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-[var(--koto-text-secondary)] leading-relaxed mb-6 flex-1">
                    {template.description}
                  </p>
                  <div className="w-full py-2.5 rounded-xl bg-[var(--koto-bg-tertiary)] text-[var(--koto-text-secondary)] font-semibold text-xs text-center group-hover:bg-[var(--koto-accent)] group-hover:text-white transition-all tracking-wide">
                    Select Voice
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-start pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="koto-btn koto-btn-secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Voice Form */}
        {step === 2 && step2Mode === 'form' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="koto-label">
                Brand voice name <span className="text-[var(--koto-error)]">*</span>
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
                className="koto-input"
              />
            </div>

            <div className="space-y-3">
              <label className="koto-label">
                Description <span className="text-[var(--koto-error)]">*</span>
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
                className="koto-input resize-none"
              />
            </div>

            <div className="koto-divider" />

            <div className="space-y-3">
              <label className="koto-label">Import from markdown</label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="koto-btn koto-btn-secondary text-sm !py-2"
                >
                  📄 Upload .md file
                </button>

                <button
                  type="button"
                  onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                  className="text-xs underline text-[var(--koto-text-tertiary)] hover:text-[var(--koto-text-primary)] transition-colors"
                >
                  {showMarkdownHelp ? 'Hide example' : 'View format example'}
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
                <div className="mt-2 p-4 rounded-xl bg-[var(--koto-bg-card)] border border-[var(--koto-border)] text-xs font-mono text-[var(--koto-text-secondary)] overflow-x-auto">
                  <pre>{`# My Brand Voice

# Description
Friendly, approachable, and professional. Uses emojis occasionally.

# Example Tweets
- Just launched our new feature! 🚀 Check it out here.
- Thanks for the feedback, we really appreciate it! 🙌
- Dealing with bugs? We've got you covered.`}</pre>
                </div>
              )}

              {importFeedback && (
                <p
                  className={`text-xs font-medium ${importFeedback.type === 'error'
                    ? 'text-[var(--koto-error)]'
                    : 'text-[var(--koto-success)]'
                    }`}
                >
                  {importFeedback.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="koto-label !mb-0">
                  Example tweets <span className="text-[var(--koto-text-tertiary)] font-normal">(up to {MAX_EXAMPLE_TWEETS})</span>
                </label>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--koto-sakura-pink)]">
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
                      className="koto-input !py-2.5 text-sm"
                    />
                    {exampleTweetStatuses[index] === 'loading' && (
                      <p className="px-1 text-xs text-[var(--koto-sakura-pink)]">Fetching tweet text…</p>
                    )}
                    {exampleTweetStatuses[index] === 'error' && (
                      <p className="px-1 text-xs text-[var(--koto-error)]">{exampleTweetErrors[index]}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--koto-text-tertiary)]">
                Paste a tweet link to pull in its text automatically.
              </p>
            </div>

            <div className="koto-info-box neutral">
              <p className="font-semibold text-[var(--koto-text-primary)] mb-1">💡 Pro tip</p>
              <p>
                Mix short and long examples. Mention catchphrases or hashtags so Kotodama highlights them when drafting replies.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep2Mode('selection')}
                className="koto-btn koto-btn-secondary flex-1 sm:flex-none"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="koto-btn koto-btn-primary flex-1 sm:flex-none"
              >
                {isSubmitting ? 'Setting up…' : 'Complete setup'}
              </button>
            </div>
          </div>
        )}
      </OnboardingLayout>

      <RuntimeInvalidatedModal isOpen={isInvalidated} />
    </>
  );
};

export default Onboarding;
