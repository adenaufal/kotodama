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
        toneAttributes: { formality: 5, humor: 5, technicality: 5 },
        exampleTweets: exampleTweets.filter((tweet) => tweet.trim()),
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
    <div className="page-shell bg-gray-50">
      <div className="stack w-full max-w-3xl px-6">
        <div className="stack items-center text-center">
          <h1 className="text-4xl font-bold text-gray-900">Kotodama setup</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
            Spend two quick steps to lock in access and tone. Everything is stored locally and fully encrypted before it
            hits disk.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > 1 ? '\u2713' : '1'}
            </div>
            <span className="text-base font-medium text-gray-700">Connect OpenAI</span>
          </div>
          <div className="h-0.5 w-20 bg-gray-300" />
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <span className="text-base font-medium text-gray-700">Teach your voice</span>
          </div>
        </div>

        {step === 1 && (
          <Card className="stack w-full p-8">
            <CardHeader className="stack-sm border-none p-0">
              <h2 className="text-2xl font-semibold text-gray-900">Connect OpenAI</h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Securely store your OpenAI API key so Kotodama can craft drafts that sound like you.
              </p>
            </CardHeader>

            <CardBody className="stack p-0">
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
                <span className="mb-2 block font-semibold">[secure] Zero accounts. Zero analytics.</span>
                Keys are encrypted locally using Web Crypto before storage. Revoke anytime from settings.
              </Alert>

              {error && <Alert variant="error">{error}</Alert>}

              <Button onClick={handleNext} disabled={!apiKey.trim()} size="lg" className="w-full">
                Continue
              </Button>
            </CardBody>
          </Card>
        )}

        {step === 2 && (
          <Card className="stack w-full p-8">
            <CardHeader className="stack-sm border-none p-0">
              <h2 className="text-2xl font-semibold text-gray-900">Teach your voice</h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Share examples so responses match your tone, pacing, and vocabulary.
              </p>
            </CardHeader>

            <CardBody className="stack p-0">
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
                rows={4}
                helperText="Example: calm professional with warm undertone. Thoughtful yet approachable."
              />

              <div className="stack-sm">
                <label className="text-sm font-semibold text-gray-900">Example tweets (up to 3)</label>
                {exampleTweets.map((tweet, index) => (
                  <Textarea
                    key={index}
                    value={tweet}
                    onChange={(event) => handleExampleChange(index, event.target.value)}
                    placeholder={`Example ${index + 1}`}
                    rows={3}
                  />
                ))}
                <p className="text-sm text-gray-500">Pro tip: mix short and long examples.</p>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
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
