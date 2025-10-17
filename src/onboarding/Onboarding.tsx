import React, { useState } from 'react';
import { BrandVoice, UserSettings } from '../types';

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
      // Save API key to settings
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

      // Create default brand voice
      const brandVoice: BrandVoice = {
        id: crypto.randomUUID(),
        name: brandVoiceName || 'My Brand Voice',
        description: brandVoiceDescription,
        exampleTweets: exampleTweets.filter((t) => t.trim() !== ''),
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

      // Update settings with default voice ID
      settings.defaultBrandVoiceId = brandVoice.id;
      await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: settings,
      });

      // Show success and close
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Kotodama
          </h1>
          <p className="text-gray-600">
            Your AI-powered tweet composition assistant
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2].map((i) => (
              <React.Fragment key={i}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= i
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i}
                </div>
                {i < 2 && (
                  <div
                    className={`w-16 h-1 ${
                      step > i ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: API Key */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Step 1: API Configuration</h2>
              <p className="text-gray-600 mb-6">
                Enter your OpenAI API key to power the AI generation. Your key is encrypted
                and stored locally on your device.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key *
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Don't have an API key?{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Get one here
                </a>
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!openaiKey.trim()}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Brand Voice */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Step 2: Define Your Brand Voice</h2>
              <p className="text-gray-600 mb-6">
                Help the AI understand your unique writing style by providing examples or a
                description.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Voice Name
              </label>
              <input
                type="text"
                value={brandVoiceName}
                onChange={(e) => setBrandVoiceName(e.target.value)}
                placeholder="e.g., Professional, Casual, Technical"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={brandVoiceDescription}
                onChange={(e) => setBrandVoiceDescription(e.target.value)}
                placeholder="Describe your writing style..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Example Tweets (5 recommended)
              </label>
              <div className="space-y-3">
                {exampleTweets.map((tweet, index) => (
                  <input
                    key={index}
                    type="text"
                    value={tweet}
                    onChange={(e) => handleExampleTweetChange(index, e.target.value)}
                    placeholder={`Example tweet ${index + 1}...`}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Your data is stored locally and never shared</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
