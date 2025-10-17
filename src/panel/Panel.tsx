import React, { useState, useEffect } from 'react';
import { GenerateRequest, BrandVoice, UserSettings } from '../types';

interface ContextData {
  type: 'compose' | 'reply' | null;
  tweetContext?: {
    text: string;
    username: string;
  };
}

const Panel: React.FC = () => {
  const [context, setContext] = useState<ContextData>({ type: null });
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | string[]>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isThread, setIsThread] = useState(false);
  const [threadLength, setThreadLength] = useState(5);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');

  useEffect(() => {
    // Load settings and brand voices
    loadInitialData();

    // Listen for context from content script
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'context') {
      setContext({
        type: event.data.context,
        tweetContext: event.data.tweetContext,
      });

      // Pre-fill prompt for replies
      if (event.data.context === 'reply' && event.data.tweetContext) {
        setPrompt(`Reply to @${event.data.tweetContext.username}'s tweet about: "${event.data.tweetContext.text.substring(0, 50)}..."`);
      }
    }
  };

  const loadInitialData = async () => {
    try {
      // Get settings
      const settingsResponse = await chrome.runtime.sendMessage({
        type: 'get-settings',
      });

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
        setSelectedVoiceId(settingsResponse.data.defaultBrandVoiceId || '');
      }

      // Load brand voices from IndexedDB
      // We'll implement this with a proper store later
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!selectedVoiceId) {
      setError('Please select a brand voice');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: GenerateRequest = {
        prompt,
        brandVoiceId: selectedVoiceId,
        isThread,
        threadLength: isThread ? threadLength : undefined,
      };

      // If replying, analyze the profile first
      if (context.type === 'reply' && context.tweetContext) {
        // For now, skip profile analysis in MVP
        // In full version, we'd fetch and analyze tweets here
      }

      const response = await chrome.runtime.sendMessage({
        type: 'generate',
        payload: request,
      });

      if (response.success) {
        setGeneratedContent(response.data.content);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    const contentToInsert = Array.isArray(generatedContent)
      ? generatedContent.join('\n\n')
      : generatedContent;

    window.parent.postMessage(
      {
        type: 'insert-tweet',
        content: contentToInsert,
      },
      '*'
    );
  };

  const handleClose = () => {
    window.parent.postMessage({ type: 'close-panel' }, '*');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">AI Tweet Composer</h1>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Context Info */}
      {context.type === 'reply' && context.tweetContext && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-900">
            Replying to <span className="font-semibold">@{context.tweetContext.username}</span>
          </p>
          <p className="text-xs text-blue-700 mt-1 line-clamp-2">
            {context.tweetContext.text}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you want to say?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              context.type === 'reply'
                ? 'Describe your reply intent...'
                : 'Describe your tweet...'
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        {/* Thread Toggle */}
        {context.type === 'compose' && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isThread}
                onChange={(e) => setIsThread(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Create thread</span>
            </label>
            {isThread && (
              <input
                type="number"
                value={threadLength}
                onChange={(e) => setThreadLength(Math.max(2, Math.min(10, parseInt(e.target.value) || 5)))}
                min="2"
                max="10"
                className="w-16 p-1 border border-gray-300 rounded text-sm"
              />
            )}
          </div>
        )}

        {/* Brand Voice Selector (placeholder) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Voice
          </label>
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a voice...</option>
            {/* We'll populate this from the store */}
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim() || !selectedVoiceId}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Generated Content */}
        {generatedContent && !isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Generated Content</h3>
              <button
                onClick={handleGenerate}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Regenerate
              </button>
            </div>

            {Array.isArray(generatedContent) ? (
              <div className="space-y-2">
                {generatedContent.map((tweet, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="text-xs text-gray-500 mb-1">Tweet {index + 1}</div>
                    <div className="text-sm">{tweet}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {tweet.length} characters
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm whitespace-pre-wrap">{generatedContent}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {generatedContent.length} characters
                </div>
              </div>
            )}

            {/* Insert Button */}
            <button
              onClick={handleInsert}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Insert to Twitter
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Powered by AI • Kotodama v1.0
        </p>
      </div>
    </div>
  );
};

export default Panel;
