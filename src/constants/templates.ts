export interface ReplyTemplate {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'supportive' | 'thoughtful' | 'engaging' | 'professional' | 'casual' | 'appreciative' | 'witty' | 'constructive';
}

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  // === SUPPORTIVE ===
  {
    id: 'supportive-encourage',
    label: 'Encouraging',
    icon: '💪',
    prompt: 'Write an encouraging and supportive reply that shows empathy and offers positive reinforcement. Be genuine and warm.',
    category: 'supportive',
  },
  {
    id: 'supportive-empathy',
    label: 'Empathetic',
    icon: '🤝',
    prompt: 'Write an empathetic reply that acknowledges their feelings and shows deep understanding. Make them feel heard.',
    category: 'supportive',
  },
  {
    id: 'supportive-celebrate',
    label: 'Celebrate Win',
    icon: '🎉',
    prompt: 'Celebrate their achievement with genuine enthusiasm! Highlight why this matters and hype them up.',
    category: 'supportive',
  },

  // === THOUGHTFUL ===
  {
    id: 'thoughtful-insight',
    label: 'Add Insight',
    icon: '💡',
    prompt: 'Share a thoughtful insight or perspective that adds value to their point. Build on what they said with something fresh.',
    category: 'thoughtful',
  },
  {
    id: 'thoughtful-analysis',
    label: 'Analytical',
    icon: '🔍',
    prompt: 'Provide a deeper analysis or breakdown of the topic. Add nuance and context they might not have considered.',
    category: 'thoughtful',
  },
  {
    id: 'thoughtful-connection',
    label: 'Connect Ideas',
    icon: '🔗',
    prompt: 'Connect their point to a broader concept or related idea. Show patterns they might have missed.',
    category: 'thoughtful',
  },

  // === ENGAGING ===
  {
    id: 'engaging-question',
    label: 'Curious Question',
    icon: '❓',
    prompt: 'Ask an intriguing follow-up question that shows genuine curiosity and invites them to share more.',
    category: 'engaging',
  },
  {
    id: 'engaging-share',
    label: 'Share Experience',
    icon: '📖',
    prompt: 'Share a relevant personal experience or story that relates to their tweet. Make it relatable and concise.',
    category: 'engaging',
  },
  {
    id: 'engaging-amplify',
    label: 'Agree & Amplify',
    icon: '📢',
    prompt: 'Strongly agree with their point and amplify it by adding your own supporting evidence or perspective. Make their take even stronger.',
    category: 'engaging',
  },
  {
    id: 'engaging-tag-worthy',
    label: 'Tag-Worthy',
    icon: '👀',
    prompt: 'Write a reply so good that others will want to tag their friends. Be insightful or funny enough to spark more discussion.',
    category: 'engaging',
  },

  // === WITTY (NEW) ===
  {
    id: 'witty-banter',
    label: 'Playful Banter',
    icon: '😏',
    prompt: 'Write a clever, playful reply with light banter. Keep it friendly and fun, like joking with a friend.',
    category: 'witty',
  },
  {
    id: 'witty-meme',
    label: 'Meme Energy',
    icon: '🤣',
    prompt: 'Reply with meme-like humor or reference a popular internet joke that fits the context. Keep it punchy.',
    category: 'witty',
  },
  {
    id: 'witty-sarcasm',
    label: 'Light Sarcasm',
    icon: '🙃',
    prompt: 'Write a witty reply with light, friendly sarcasm. Make sure it is clearly humorous and not mean-spirited.',
    category: 'witty',
  },
  {
    id: 'witty-roast',
    label: 'Friendly Roast',
    icon: '🔥',
    prompt: 'Write a playful, friendly roast reply. Keep it lighthearted and obviously joking. Never be mean.',
    category: 'witty',
  },
  {
    id: 'witty-pun',
    label: 'Clever Pun',
    icon: '🎯',
    prompt: 'Reply with a clever wordplay or pun related to their tweet. Be creative with the language.',
    category: 'witty',
  },

  // === CONSTRUCTIVE (NEW) ===
  {
    id: 'constructive-counterpoint',
    label: 'Respectful Counter',
    icon: '🤔',
    prompt: 'Offer a respectful counterpoint or alternative perspective. Be thoughtful and open-minded, not argumentative.',
    category: 'constructive',
  },
  {
    id: 'constructive-nuance',
    label: 'Add Nuance',
    icon: '⚖️',
    prompt: 'Add nuance to their point by acknowledging the complexity. Mention what they got right and what else to consider.',
    category: 'constructive',
  },
  {
    id: 'constructive-resource',
    label: 'Share Resource',
    icon: '📚',
    prompt: 'Reply with a helpful resource, article, or reference that expands on their topic. Be genuinely helpful.',
    category: 'constructive',
  },

  // === PROFESSIONAL ===
  {
    id: 'professional-network',
    label: 'Network',
    icon: '💼',
    prompt: 'Write a professional networking-focused reply that opens doors for collaboration. Be genuine, not salesy.',
    category: 'professional',
  },
  {
    id: 'professional-expertise',
    label: 'Share Expertise',
    icon: '🎯',
    prompt: 'Offer professional expertise or industry insights related to their topic. Position yourself as knowledgeable.',
    category: 'professional',
  },
  {
    id: 'professional-offer-help',
    label: 'Offer Help',
    icon: '🙋',
    prompt: 'Offer genuine help or advice based on your experience. Be specific about how you can contribute.',
    category: 'professional',
  },

  // === CASUAL ===
  {
    id: 'casual-friendly',
    label: 'Friendly Chat',
    icon: '😊',
    prompt: 'Write a casual, warm reply like chatting with a friend. Keep it natural and conversational.',
    category: 'casual',
  },
  {
    id: 'casual-relatable',
    label: 'So Relatable',
    icon: '💯',
    prompt: 'React to how relatable their tweet is. Share a quick "same here" moment that shows you get it.',
    category: 'casual',
  },
  {
    id: 'casual-hype',
    label: 'Hype Up',
    icon: '🙌',
    prompt: 'Hype them up with genuine excitement! Be their biggest cheerleader in this moment.',
    category: 'casual',
  },

  // === APPRECIATIVE ===
  {
    id: 'appreciative-thanks',
    label: 'Say Thanks',
    icon: '🙏',
    prompt: 'Express genuine gratitude and appreciation for their post. Explain specifically what you found valuable.',
    category: 'appreciative',
  },
  {
    id: 'appreciative-bookmark',
    label: 'Bookmark Worthy',
    icon: '🔖',
    prompt: 'Tell them this is bookmark-worthy content. Explain why you are saving it and what makes it valuable.',
    category: 'appreciative',
  },
  {
    id: 'appreciative-mindblown',
    label: 'Mind Blown',
    icon: '🤯',
    prompt: 'Express that this tweet completely changed your perspective or blew your mind. Be enthusiastic about the insight.',
    category: 'appreciative',
  },
];
