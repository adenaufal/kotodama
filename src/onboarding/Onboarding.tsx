import React, { useState } from 'react';
import { BrandVoice, UserSettings } from '../types';

const steps = [
  {
    id: 1,
    title: 'API Configuration',
    description:
      'Connect your OpenAI account so Kotodama can generate tailored tweet ideas for you.',
  },
  {
    id: 2,
    title: 'Brand Voice',
    description: 'Describe how you write so the AI mirrors your tone and personality.',
  },
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [openaiKey, setOpenaiKey] = useState('');
  const [brandVoiceName, setBrandVoiceName] = useState('');
  const [brandVoiceDescription, setBrandVoiceDescription] = useState('');
  const [exampleTweets, setExampleTweets] = useState(['', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExampleTweetChange = (index: number, value: string) => {
    const newTweets = [...exampleTweets];
    newTweets[index] = value;
    setExampleTweets(newTweets);
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

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <aside className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 p-10 text-indigo-50 shadow-2xl">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                Get set up in minutes
              </span>
              <div>
                <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
                  Welcome to Kotodama
                </h1>
                <p className="mt-4 text-lg text-indigo-100">
                  Your AI-powered tweet composition assistant. Personalize the extension so every suggestion feels like you.
                </p>
              </div>
              <dl className="space-y-4 text-sm text-indigo-100/90">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                    1
                  </span>
                  <div>
                    <dt className="font-semibold text-indigo-50">Connect securely</dt>
                    <dd>API keys are encrypted locally on your device—never shared or uploaded.</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                    2
                  </span>
                  <div>
                    <dt className="font-semibold text-indigo-50">Teach your tone</dt>
                    <dd>Provide a few details or examples so Kotodama mirrors your voice effortlessly.</dd>
                  </div>
                </div>
              </dl>
            </div>
            <p className="mt-10 text-xs uppercase tracking-[0.2em] text-indigo-100/70">
              Your data is private & stays on this device
            </p>
          </aside>

          <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-indigo-100/60 sm:p-10">
            <header className="mb-10 space-y-3">
              <p className="text-sm font-medium text-indigo-600">Step {step} of 2</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {steps.find((item) => item.id === step)?.title}
              </h2>
              <p className="text-sm text-slate-600">
                {steps.find((item) => item.id === step)?.description}
              </p>
              <ol className="mt-6 flex items-center gap-3">
                {steps.map((item, index) => {
                  const isActive = step === item.id;
                  const isCompleted = step > item.id;

                  return (
                    <li key={item.id} className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                          isCompleted
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : isActive
                              ? 'border-indigo-500 bg-white text-indigo-600 shadow-[0_0_0_3px_rgba(79,70,229,0.15)]'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                        }`}
                      >
                        {item.id}
                      </span>
                      {index < steps.length - 1 && (
                        <span
                          className={`h-[2px] w-12 rounded-full transition ${
                            isCompleted ? 'bg-indigo-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </header>

            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(event) => setOpenaiKey(event.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <p className="text-sm text-slate-500">
                    Don&apos;t have a key?{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Generate one here
                    </a>
                    .
                  </p>
                </div>

                <div className="rounded-2xl bg-indigo-50/80 p-4 text-sm text-indigo-800">
                  <p className="font-medium">Why we need this</p>
                  <p className="mt-1 text-indigo-700">
                    The API key lives only on your device and is encrypted using the Web Crypto API. Kotodama never sends it to our servers.
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!openaiKey.trim()}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800">Brand voice name</label>
                  <input
                    type="text"
                    value={brandVoiceName}
                    onChange={(event) => setBrandVoiceName(event.target.value)}
                    placeholder="e.g., Confident, Playful, Technical"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800">Description (optional)</label>
                  <textarea
                    value={brandVoiceDescription}
                    onChange={(event) => setBrandVoiceDescription(event.target.value)}
                    placeholder="Share key phrases, tone notes, or instructions for the AI..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-slate-800">
                      Example tweets <span className="text-slate-400">(up to 5)</span>
                    </label>
                    <span className="text-xs font-medium uppercase tracking-wide text-indigo-500">
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
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex-none sm:px-6"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:flex-none sm:px-6"
                  >
                    {isSubmitting ? 'Setting up…' : 'Complete setup'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
