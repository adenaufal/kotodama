import React, { useState } from 'react';
import { BrandVoice, UserSettings } from '../types';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Alert } from '../components/Alert';

const OnboardingClean: React.FC = () => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [exampleTweets, setExampleTweets] = useState(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleExampleChange = (index: number, value: string) => {
    const next = [...exampleTweets];
    next[index] = value;
    setExampleTweets(next);
  };

  const handleNext = async () => {
    setError('');
    if (step === 1) {
      if (!apiKey.trim()) {
        setError('API key is required');
        return;
      }
      setStep(2);
      return;
    }

    await handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const settings: UserSettings = {
        apiKeys: { openai: apiKey },
        defaultProvider: 'openai',
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

      const settingsResponse = await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      if (!settingsResponse.success) {
        throw new Error(settingsResponse.error || 'Failed to save settings');
      }

      const brandVoice: BrandVoice = {
        id: crypto.randomUUID(),
        name: brandName || 'Default voice',
        description,
        guidelines: description,
        toneAttributes: {
          formality: 50,
          humor: 50,
          technicality: 50,
          empathy: 50,
          energy: 50,
          authenticity: 50,
        },
        exampleTweets: exampleTweets.filter((tweet) => tweet.trim()),
        category: 'custom',
        tags: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const voiceResponse = await chrome.runtime.sendMessage({
        type: 'save-brand-voice',
        payload: brandVoice,
      });

      if (!voiceResponse.success) {
        throw new Error(voiceResponse.error || 'Failed to save brand voice');
      }

      settings.defaultBrandVoiceId = brandVoice.id;
      await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      window.location.href = chrome.runtime.getURL('src/settings/index.html');
    } catch (err) {
      console.error('Setup failed:', err);
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 light-mode" style={{ backgroundColor: 'var(--koto-bg-light)' }}>
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Kotodama setup</h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Spend two quick steps to lock in access and tone. Everything is stored locally and fully encrypted before it
            hits disk.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full text-xs md:text-sm font-semibold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > 1 ? '\u2713' : '1'}
            </div>
            <span className="text-sm md:text-base font-medium text-gray-700">Connect OpenAI</span>
          </div>
          <div className="h-0.5 w-12 md:w-20 bg-gray-300" />
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full text-xs md:text-sm font-semibold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <span className="text-sm md:text-base font-medium text-gray-700">Teach your voice</span>
          </div>
        </div>

        {step === 1 && (
          <Card className="w-full p-6 md:p-8 space-y-5">
            <CardHeader className="border-none p-0 space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Connect OpenAI</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Securely store your OpenAI API key so Kotodama can craft drafts that sound like you.
              </p>
            </CardHeader>

            <CardBody className="p-0 space-y-4">
              <Input
                label="OpenAI API key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm"
                helperText="Need a key? Generate one at platform.openai.com/api-keys"
              />

              <Alert variant="info">
                <span className="mb-1 block font-semibold text-sm">[secure] Zero accounts. Zero analytics.</span>
                <span className="text-sm">Keys are encrypted locally using Web Crypto before storage. Revoke anytime from settings.</span>
              </Alert>

              {error && <Alert variant="error">{error}</Alert>}

              <Button onClick={handleNext} disabled={!apiKey.trim()} size="lg" className="w-full">
                Continue
              </Button>
            </CardBody>
          </Card>
        )}

        {step === 2 && (
          <Card className="w-full p-6 md:p-8 space-y-5">
            <CardHeader className="border-none p-0 space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Teach your voice</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Share examples so responses match your tone, pacing, and vocabulary.
              </p>
            </CardHeader>

            <CardBody className="p-0 space-y-4">
              <Input
                label="Brand voice name (optional)"
                type="text"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="e.g., Professional, Casual, Technical"
              />

              <Textarea
                label="Description (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe your writing style, tone, vocabulary preferences..."
                rows={3}
                helperText="Example: calm professional with warm undertone. Thoughtful yet approachable."
              />

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Example tweets (up to 3)</label>
                {exampleTweets.map((tweet, index) => (
                  <Textarea
                    key={index}
                    value={tweet}
                    onChange={(event) => handleExampleChange(index, event.target.value)}
                    placeholder={`Example ${index + 1}`}
                    rows={2}
                  />
                ))}
                <p className="text-xs md:text-sm text-gray-500">Pro tip: mix short and long examples.</p>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={() => setStep(1)} variant="secondary" size="lg" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isSubmitting} size="lg" className="flex-1">
                  {isSubmitting ? 'Setting up...' : 'Complete'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingClean;
