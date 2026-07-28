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

export interface TweetImage {
  url: string; // pbs.twimg.com media URL, normalized to ?name=small
  alt?: string; // Author-provided alt text, when present
}

/** A preceding tweet in the same thread. Flat on purpose - no nesting. */
export interface ThreadEntry {
  username: string;
  displayName?: string;
  text: string;
}

export interface TweetContext {
  text: string;
  username: string; // @handle
  displayName?: string; // Display Name
  timestamp?: string; // ISO string or relative time
  images?: TweetImage[];
  metrics?: {
    replies?: number;
    retweets?: number;
    likes?: number;
  };
  /** Tweets above this one in the thread, oldest first. */
  thread?: ThreadEntry[];
}

export interface GeneratedTweet {
  id: string;
  prompt: string;
  generatedContent: string;
  brandVoiceId: string;
  targetProfileId?: string;
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
  prompt: string; // What the user wants to say back
  brandVoiceId: string;
  targetProfileId?: string;
  replyContext: TweetContext; // Reply-only: always present
  /** Plain-language reading of the tweet from the context pass, incl. any images. */
  contextSummary?: string;
  toneAdjustment?: Partial<ToneAttributes>;
  provider?: AIProvider;
}

export interface GenerateResponse {
  content: string;
  tokenUsage: number;
  provider: AIProvider;
}

/** Reads the tweet (and its images) with a vision-capable model. */
export interface AnalyzeContextRequest {
  context: TweetContext;
  provider?: AIProvider;
}

export interface AnalyzeContextResponse {
  summary: string;
  provider: AIProvider;
  /** True when images were present but could not be read; summary is text-only. */
  visionFailed?: boolean;
}

export interface Message {
  type:
  | 'generate'
  | 'analyze-context'
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
