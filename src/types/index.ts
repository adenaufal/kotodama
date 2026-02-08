export interface ToneAttributes {
  formality: number;      // 0-100: Casual to Professional
  humor: number;          // 0-100: Serious to Humorous
  technicality: number;   // 0-100: Simple to Technical
  empathy: number;        // 0-100: Direct to Empathetic
  energy: number;         // 0-100: Calm to Energetic
  authenticity: number;   // 0-100: Reserved to Authentic/Vulnerable
}

export interface BrandVoice {
  id: string;
  name: string;
  description?: string;
  exampleTweets: string[];
  guidelines?: string;
  toneAttributes: ToneAttributes;
  category?: 'professional' | 'casual' | 'technical' | 'creative' | 'educational' | 'personal' | 'custom';
  tags?: string[];
  isTemplate?: boolean; // Built-in templates that can't be deleted
  createdAt: Date;
  updatedAt: Date;

  // V2 Fields (Optional for backward compatibility)
  vocabulary?: {
    approved: string[];
    avoid: string[];
  };
  platformGuidelines?: Record<string, {
    style: string;
    format: string;
    emojiUsage: string;
    length: string;
  }>;
  characterVoices?: Record<string, {
    role: string;
    traits: string;
    usedFor: string;
  }>;
  coreValues?: string[];
  messagingFramework?: {
    primaryValue: string;
    brandPromises: string[];
    audienceSegments?: Record<string, {
      tone: string;
      focus: string;
      keyMessage: string;
    }>;
  };
  dosList?: string[];
  dontsList?: string[];
  version?: string;
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

export interface TweetContext {
  text: string;
  username: string; // @handle
  displayName?: string; // Display Name
  timestamp?: string; // ISO string or relative time
  images?: string[]; // Alt text of attached images
  metrics?: {
    replies?: number;
    retweets?: number;
    likes?: number;
  };
  isThread?: boolean;
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
  replyContext?: TweetContext; // Store context for history
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
  defaultModel?: string; // Model ID to use for generation (e.g., 'gpt-4o', 'gpt-4o-mini')
  customModels?: { id: string; name: string }[]; // User-defined models
  modelPriority?: 'maximize-free' | 'always-quality' | 'always-mini'; // Smart model selection strategy
  userTier?: 1 | 2 | 3 | 4 | 5; // OpenAI usage tier for quota calculation
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
  replyContext?: TweetContext; // New field for structured context
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
  type:
  | 'generate'
  | 'analyze-profile'
  | 'save-settings'
  | 'get-settings'
  | 'get-brand-voice'
  | 'save-brand-voice'
  | 'list-brand-voices'
  | 'delete-brand-voice'
  | 'open-settings';
  payload?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
