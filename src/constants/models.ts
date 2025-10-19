// Available AI models per provider

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'gemini' | 'claude';
  category: 'quality' | 'fast' | 'reasoning';
}

export const OPENAI_MODELS: ModelOption[] = [
  {
    id: 'gpt-4o-2024-11-20',
    name: 'GPT-4o (Latest)',
    description: 'Best quality and most capable model',
    provider: 'openai',
    category: 'quality',
  },
  {
    id: 'gpt-4o-2024-08-06',
    name: 'GPT-4o (August)',
    description: 'Alternative high-quality model',
    provider: 'openai',
    category: 'quality',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Latest)',
    description: 'Fast and cost-effective',
    provider: 'openai',
    category: 'fast',
  },
  {
    id: 'gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini (July)',
    description: 'Stable fast model',
    provider: 'openai',
    category: 'fast',
  },
  {
    id: 'o1-2024-12-17',
    name: 'o1 (Reasoning)',
    description: 'Advanced reasoning model',
    provider: 'openai',
    category: 'reasoning',
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
    return 'gpt-4o-2024-11-20';
  }
  // Future defaults for other providers
  return '';
}
