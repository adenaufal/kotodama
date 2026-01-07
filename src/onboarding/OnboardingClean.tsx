import React, { useState } from 'react';
import { BrandVoice, UserSettings } from '../types';
import { OnboardingLayout } from './components/OnboardingLayout';
import { ApiKeyStep } from './components/ApiKeyStep';
import { BrandVoiceStep } from './components/BrandVoiceStep';

const OnboardingClean: React.FC = () => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [exampleTweets, setExampleTweets] = useState(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!apiKey.trim()) {
        setError('Please enter a valid API key.');
        return;
      }
      setStep(2);
    }
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
        name: brandName || 'Default Voice',
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
    <OnboardingLayout currentStep={step} totalSteps={2}>
      {step === 1 && (
        <ApiKeyStep
          apiKey={apiKey}
          setApiKey={setApiKey}
          onNext={handleNext}
          error={error}
        />
      )}
      {step === 2 && (
        <BrandVoiceStep
          brandName={brandName}
          setBrandName={setBrandName}
          description={description}
          setDescription={setDescription}
          exampleTweets={exampleTweets}
          setExampleTweets={setExampleTweets}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </OnboardingLayout>
  );
};

export default OnboardingClean;
