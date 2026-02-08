// Available AI models per provider

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'gemini' | 'claude';
  category: 'quality' | 'fast' | 'reasoning';
  tokenTier?: 'premium' | 'mini'; // For OpenAI free token quota tracking
}

export const OPENAI_MODELS: ModelOption[] = [
  // Premium - Quality
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Current state-of-the-art',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    description: 'Previous flagship',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: 'Original GPT-5 base',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-5-chat-latest',
    name: 'GPT-5 Chat',
    description: 'Latest chat optimization',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'High intelligence',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Omni model',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },

  // Efficient - Mini/Nano
  {
    id: 'gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    description: 'Specialized for code',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    description: 'Efficient reasoning',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    description: 'Fastest response',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Cost effective 4.1',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    description: 'Ultra lightweight 4.1',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Standard efficient',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },

  // Dated / Specific Versions
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5 (Aug 2025)',
    description: 'Snapshot 2025-08-07',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-4o-2024-11-20',
    name: 'GPT-4o (Nov 2024)',
    description: 'Snapshot 2024-11-20',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini (Aug)',
    description: 'Snapshot 2025-08-07',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano (Aug)',
    description: 'Snapshot 2025-08-07',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4.1-mini-2025-04-14',
    name: 'GPT-4.1 Mini (Apr)',
    description: 'Snapshot 2025-04-14',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4.1-nano-2025-04-14',
    name: 'GPT-4.1 Nano (Apr)',
    description: 'Snapshot 2025-04-14',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini (Jul)',
    description: 'Snapshot 2024-07-18',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
];

export const GEMINI_MODELS: ModelOption[] = [
  // Future: Gemini models will be added in v1.1
];

export const CLAUDE_MODELS: ModelOption[] = [
  // Future: Claude models will be added in v1.2
];

export const ALL_MODELS: ModelOption[] = [
  ...OPENAI_MODELS,
  ...GEMINI_MODELS,
  ...CLAUDE_MODELS,
];

export function getModelsByProvider(provider: 'openai' | 'gemini' | 'claude'): ModelOption[] {
  return ALL_MODELS.filter(model => model.provider === provider);
}

export function getModelById(id: string): ModelOption | undefined {
  return ALL_MODELS.find(model => model.id === id);
}

export function getDefaultModelForProvider(provider: 'openai' | 'gemini' | 'claude'): string {
  if (provider === 'openai') {
    return 'gpt-5-mini-2025-08-07'; // Default to mini for free token optimization
  }
  // Future defaults for other providers
  return '';
}

export function getModelsByTier(tier: 'premium' | 'mini'): ModelOption[] {
  return OPENAI_MODELS.filter(model => model.tokenTier === tier);
}
