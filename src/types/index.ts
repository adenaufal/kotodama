export interface BrandVoice {
  id: string;
  name: string;
  description?: string;
  exampleTweets: string[];
  guidelines?: string;
  toneAttributes: {
    formality: number; // 0-100
    humor: number;     // 0-100
    technicality: number; // 0-100
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  analyzedTweets: {
    tweetId: string;
    content: string;
    timestamp: Date;
  }[];
  styleAttributes: {
    avgLength: number;
    commonPhrases: string[];
    toneProfile: ToneAttributes;
  };
  lastAnalyzed: Date;
}

export interface ToneAttributes {
  formality: number;
  humor: number;
  technicality: number;
}

export interface GeneratedTweet {
  id: string;
  prompt: string;
  generatedContent: string;
  finalContent?: string;
  brandVoiceId: string;
  targetProfileId?: string;
  isThread: boolean;
  threadPosition?: number;
  posted: boolean;
  timestamp: Date;
  apiUsed: 'openai' | 'gemini' | 'claude';
  tokenUsage: number;
}

export interface UserSettings {
  apiKeys: {
    openai?: string; // encrypted
    gemini?: string; // encrypted
    claude?: string; // encrypted
  };
  claudeCookie?: string; // encrypted - For Claude web account
  defaultProvider?: AIProvider;
  claudeAuthType?: 'api' | 'cookie'; // API key or cookie authentication
  defaultBrandVoiceId?: string;
  analysisDepth: 10 | 20 | 30 | 50;
  ui: {
    buttonPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    panelWidth: number;
    theme: 'light' | 'dark' | 'auto';
  };
  features: {
    autoAnalyze: boolean;
    rememberHistory: boolean;
    showToneControls: boolean;
  };
}

export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface GenerateRequest {
  prompt: string;
  brandVoiceId: string;
  targetProfileId?: string;
  isThread?: boolean;
  threadLength?: number;
  toneAdjustment?: Partial<ToneAttributes>;
  provider?: AIProvider;
  fastMode?: boolean | 'ultra' | 'haiku-45'; // true=fast, 'ultra'=ultra fast, 'haiku-45'=Haiku 4.5
  quality?: 'opus' | 'opus-max'; // Claude: opus=Opus 4, opus-max=Opus 4.1
  reasoning?: boolean; // OpenAI: Use o1 reasoning model
  coding?: boolean; // OpenAI: Use codex for code generation
}

export interface GenerateResponse {
  content: string | string[]; // single tweet or thread
  tokenUsage: number;
  provider: AIProvider;
}

export interface Message {
  type: 'generate' | 'analyze-profile' | 'save-settings' | 'get-settings' | 'get-brand-voice' | 'save-brand-voice';
  payload: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
