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
  // Premium tier - 1M free tokens/day (250K for tier 1-2)
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5 (Latest)',
    description: 'Most capable model, best reasoning',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  {
    id: 'gpt-4o-2024-11-20',
    name: 'GPT-4o (November)',
    description: 'High quality, excellent performance',
    provider: 'openai',
    category: 'quality',
    tokenTier: 'premium',
  },
  // Mini tier - 10M free tokens/day (2.5M for tier 1-2)  
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    description: 'Fast and capable, great balance',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano',
    description: 'Ultra fast, most cost-effective',
    provider: 'openai',
    category: 'fast',
    tokenTier: 'mini',
  },
  {
    id: 'gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini',
    description: 'Reliable and cheap, stable fallback',
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
