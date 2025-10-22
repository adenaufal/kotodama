import { BrandVoice, ToneAttributes } from '../types';

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export function validateBrandVoice(voice: Partial<BrandVoice>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Required fields
  if (!voice.name?.trim()) {
    errors.push('Name is required');
  } else if (voice.name.length < 3) {
    warnings.push('Name is very short - consider making it more descriptive');
  }

  if (!voice.description?.trim()) {
    errors.push('Description is required');
  } else if (voice.description.length < 10) {
    warnings.push('Description is too brief - add more details about your voice');
  }

  // Example tweets validation
  const validExamples = voice.exampleTweets?.filter((tweet) => tweet.trim().length > 0) || [];

  if (validExamples.length === 0) {
    errors.push('At least one example tweet is required');
  } else if (validExamples.length < 3) {
    warnings.push('Adding 3-5 example tweets will improve AI generation quality');
  }

  // Check example tweet quality
  validExamples.forEach((tweet, index) => {
    if (tweet.length < 20) {
      warnings.push(`Example ${index + 1} is very short - longer examples work better`);
    }
    if (tweet.length > 280) {
      warnings.push(`Example ${index + 1} exceeds 280 characters (${tweet.length} chars)`);
    }
  });

  // Check for variety in examples
  if (validExamples.length >= 2) {
    const avgLength = validExamples.reduce((sum, t) => sum + t.length, 0) / validExamples.length;
    const allSimilarLength = validExamples.every((t) => Math.abs(t.length - avgLength) < 20);

    if (allSimilarLength) {
      suggestions.push('Vary the length of your example tweets for better versatility');
    }
  }

  // Tone attributes validation
  if (voice.toneAttributes) {
    const toneKeys = ['formality', 'humor', 'technicality', 'empathy', 'energy', 'authenticity'] as const;
    const allAtFifty = toneKeys.every((key) => voice.toneAttributes![key] === 50);

    if (allAtFifty) {
      suggestions.push('Adjust tone attributes to better reflect your unique voice');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// ============================================================================
// TONE PRESETS
// ============================================================================

export interface TonePreset {
  name: string;
  description: string;
  attributes: ToneAttributes;
  icon?: string;
}

export const TONE_PRESETS: Record<string, TonePreset> = {
  professional: {
    name: 'Professional',
    description: 'Formal, measured, and authoritative',
    attributes: {
      formality: 85,
      humor: 20,
      technicality: 60,
      empathy: 50,
      energy: 40,
      authenticity: 50,
    },
  },
  casual: {
    name: 'Casual',
    description: 'Relaxed, friendly, and approachable',
    attributes: {
      formality: 25,
      humor: 65,
      technicality: 35,
      empathy: 70,
      energy: 60,
      authenticity: 75,
    },
  },
  technical: {
    name: 'Technical Expert',
    description: 'Knowledgeable, precise, and detailed',
    attributes: {
      formality: 70,
      humor: 30,
      technicality: 90,
      empathy: 45,
      energy: 50,
      authenticity: 55,
    },
  },
  engaging: {
    name: 'Engaging Storyteller',
    description: 'Energetic, relatable, and compelling',
    attributes: {
      formality: 40,
      humor: 70,
      technicality: 40,
      empathy: 80,
      energy: 85,
      authenticity: 85,
    },
  },
  thoughtLeader: {
    name: 'Thought Leader',
    description: 'Insightful, balanced, and inspiring',
    attributes: {
      formality: 65,
      humor: 45,
      technicality: 70,
      empathy: 65,
      energy: 60,
      authenticity: 70,
    },
  },
  educator: {
    name: 'Educator',
    description: 'Clear, patient, and encouraging',
    attributes: {
      formality: 55,
      humor: 50,
      technicality: 65,
      empathy: 80,
      energy: 55,
      authenticity: 65,
    },
  },
};

// Quick adjustment functions
export function adjustTone(
  current: ToneAttributes,
  adjustment: 'more_professional' | 'more_casual' | 'more_humorous' | 'more_serious' | 'more_energetic' | 'more_calm'
): ToneAttributes {
  const result = { ...current };
  const delta = 15; // Adjustment amount

  switch (adjustment) {
    case 'more_professional':
      result.formality = Math.min(100, result.formality + delta);
      result.humor = Math.max(0, result.humor - delta / 2);
      break;
    case 'more_casual':
      result.formality = Math.max(0, result.formality - delta);
      result.authenticity = Math.min(100, result.authenticity + delta / 2);
      break;
    case 'more_humorous':
      result.humor = Math.min(100, result.humor + delta);
      result.energy = Math.min(100, result.energy + delta / 2);
      break;
    case 'more_serious':
      result.humor = Math.max(0, result.humor - delta);
      result.formality = Math.min(100, result.formality + delta / 2);
      break;
    case 'more_energetic':
      result.energy = Math.min(100, result.energy + delta);
      result.empathy = Math.min(100, result.empathy + delta / 2);
      break;
    case 'more_calm':
      result.energy = Math.max(0, result.energy - delta);
      result.formality = Math.min(100, result.formality + delta / 2);
      break;
  }

  return result;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export const BRAND_VOICE_TEMPLATES: BrandVoice[] = [
  {
    id: 'template_professional_tech',
    name: 'Professional Tech Expert',
    description: 'Authoritative voice for technology professionals and industry leaders',
    exampleTweets: [
      'Just shipped a new feature that reduces API latency by 40%. Performance optimization is an ongoing journey, not a destination.',
      'The key to scalable systems? Design for failure from day one. Assume everything will break, then build accordingly.',
      'Interesting discussion at today\'s conference about edge computing. The future of distributed systems is closer than we think.',
    ],
    guidelines: 'Focus on technical insights, industry trends, and professional expertise. Use data and metrics when relevant. Maintain credibility through precise language.',
    toneAttributes: {
      formality: 75,
      humor: 25,
      technicality: 85,
      empathy: 50,
      energy: 50,
      authenticity: 60,
    },
    category: 'technical',
    tags: ['professional', 'tech', 'business'],
    isTemplate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template_casual_founder',
    name: 'Casual Founder',
    description: 'Authentic, relatable voice for startup founders and entrepreneurs',
    exampleTweets: [
      'Pulled an all-nighter debugging. Coffee count: 6. Bugs fixed: 1. Worth it? Absolutely. This is what we signed up for.',
      'Hot take: Your first product will be terrible. Ship it anyway. You\'ll learn more from real users in a week than months of planning.',
      'Rejected by 20 investors this month. Number 21 said yes. Keep going.',
    ],
    guidelines: 'Be vulnerable and authentic. Share the journey, including failures. Keep it real and relatable. Use casual language and personal anecdotes.',
    toneAttributes: {
      formality: 30,
      humor: 65,
      technicality: 45,
      empathy: 75,
      energy: 70,
      authenticity: 90,
    },
    category: 'personal',
    tags: ['startup', 'founder', 'authentic'],
    isTemplate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template_educator',
    name: 'Tech Educator',
    description: 'Clear, encouraging voice for teaching and explaining technical concepts',
    exampleTweets: [
      'Let\'s break down React hooks: they\'re just functions that let you "hook into" React features. Start with useState and useEffect - they\'ll cover 80% of your needs.',
      'Common mistake: trying to learn everything at once. Pick one thing, get good at it, then expand. Depth beats breadth in tech.',
      'Remember: every expert was once a beginner. That confusing error message? We\'ve all been there. Keep going.',
    ],
    guidelines: 'Explain concepts clearly. Break down complex ideas. Be encouraging and patient. Use analogies and examples. Acknowledge that learning is hard.',
    toneAttributes: {
      formality: 45,
      humor: 55,
      technicality: 70,
      empathy: 85,
      energy: 60,
      authenticity: 75,
    },
    category: 'educational',
    tags: ['teaching', 'education', 'helpful'],
    isTemplate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template_thought_leader',
    name: 'Industry Thought Leader',
    description: 'Insightful, forward-thinking voice for sharing perspectives and predictions',
    exampleTweets: [
      'The most underrated skill in tech: knowing what NOT to build. Every feature has a cost. Choose wisely.',
      'We\'re not in a talent shortage. We\'re in a mentorship shortage. Experienced developers teaching juniors is how we scale the industry.',
      'Prediction: In 5 years, no-code tools will handle 40% of what we currently write code for. This isn\'t a threat - it\'s an opportunity to focus on harder problems.',
    ],
    guidelines: 'Share unique perspectives and insights. Be thought-provoking but balanced. Use experience to inform predictions. Challenge conventional wisdom thoughtfully.',
    toneAttributes: {
      formality: 65,
      humor: 40,
      technicality: 65,
      empathy: 60,
      energy: 60,
      authenticity: 75,
    },
    category: 'professional',
    tags: ['leadership', 'insights', 'industry'],
    isTemplate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template_creative',
    name: 'Creative Developer',
    description: 'Energetic, enthusiastic voice for creative coding and experiments',
    exampleTweets: [
      'Just made a button that wiggles when you hover over it. Is it necessary? No. Is it delightful? Absolutely. This is why I love frontend.',
      'Spent 3 hours on an animation that lasts 0.3 seconds. This is what peak performance looks like.',
      'New project: teaching my smart light to pulse to the beat of my music. Completely unnecessary. Totally doing it anyway.',
    ],
    guidelines: 'Show enthusiasm for creative projects. Celebrate the joy of making things. Don\'t take yourself too seriously. Share experiments and playful work.',
    toneAttributes: {
      formality: 25,
      humor: 80,
      technicality: 60,
      empathy: 65,
      energy: 90,
      authenticity: 85,
    },
    category: 'creative',
    tags: ['creative', 'playful', 'experimental'],
    isTemplate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================================
// IMPORT/EXPORT
// ============================================================================

export interface ExportedBrandVoice extends Omit<BrandVoice, 'createdAt' | 'updatedAt'> {
  version: string;
  exportedAt: string;
}

export function exportBrandVoice(voice: BrandVoice): string {
  const exported: ExportedBrandVoice = {
    ...voice,
    version: '1.0',
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exported, null, 2);
}

export function exportBrandVoiceAsMarkdown(voice: BrandVoice): string {
  let markdown = `# ${voice.name}\n\n`;

  if (voice.description) {
    markdown += `## Description\n\n${voice.description}\n\n`;
  }

  if (voice.guidelines) {
    markdown += `## Guidelines\n\n${voice.guidelines}\n\n`;
  }

  markdown += `## Tone Attributes\n\n`;
  markdown += `- **Formality**: ${voice.toneAttributes.formality}/100\n`;
  markdown += `- **Humor**: ${voice.toneAttributes.humor}/100\n`;
  markdown += `- **Technicality**: ${voice.toneAttributes.technicality}/100\n`;
  markdown += `- **Empathy**: ${voice.toneAttributes.empathy}/100\n`;
  markdown += `- **Energy**: ${voice.toneAttributes.energy}/100\n`;
  markdown += `- **Authenticity**: ${voice.toneAttributes.authenticity}/100\n\n`;

  if (voice.exampleTweets.length > 0) {
    markdown += `## Example Tweets\n\n`;
    voice.exampleTweets.forEach((tweet, i) => {
      markdown += `${i + 1}. ${tweet}\n\n`;
    });
  }

  return markdown;
}

export function importBrandVoice(jsonString: string): BrandVoice {
  const parsed = JSON.parse(jsonString) as ExportedBrandVoice;

  // Validate required fields
  if (!parsed.name || !parsed.toneAttributes) {
    throw new Error('Invalid brand voice format');
  }

  // Set default values for new fields if importing old format
  const toneAttributes: ToneAttributes = {
    formality: parsed.toneAttributes.formality ?? 50,
    humor: parsed.toneAttributes.humor ?? 50,
    technicality: parsed.toneAttributes.technicality ?? 50,
    empathy: parsed.toneAttributes.empathy ?? 50,
    energy: parsed.toneAttributes.energy ?? 50,
    authenticity: parsed.toneAttributes.authenticity ?? 50,
  };

  return {
    ...parsed,
    id: parsed.id || `voice_${Date.now()}`,
    toneAttributes,
    isTemplate: false, // Imported voices are never templates
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDefaultToneAttributes(): ToneAttributes {
  return {
    formality: 50,
    humor: 50,
    technicality: 50,
    empathy: 50,
    energy: 50,
    authenticity: 50,
  };
}

export function getToneAttributeLabel(key: keyof ToneAttributes): { label: string; low: string; high: string } {
  const labels = {
    formality: { label: 'Formality', low: 'Casual', high: 'Professional' },
    humor: { label: 'Humor', low: 'Serious', high: 'Humorous' },
    technicality: { label: 'Technicality', low: 'Simple', high: 'Technical' },
    empathy: { label: 'Empathy', low: 'Direct', high: 'Empathetic' },
    energy: { label: 'Energy', low: 'Calm', high: 'Energetic' },
    authenticity: { label: 'Authenticity', low: 'Reserved', high: 'Vulnerable' },
  };

  return labels[key];
}

export function calculateVoiceSimilarity(voice1: ToneAttributes, voice2: ToneAttributes): number {
  const keys: (keyof ToneAttributes)[] = ['formality', 'humor', 'technicality', 'empathy', 'energy', 'authenticity'];

  let totalDiff = 0;
  keys.forEach((key) => {
    totalDiff += Math.abs(voice1[key] - voice2[key]);
  });

  // Convert to similarity score (0-100)
  const maxDiff = keys.length * 100;
  return 100 - (totalDiff / maxDiff) * 100;
}
