export interface ReplyTemplate {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'supportive' | 'thoughtful' | 'engaging' | 'professional' | 'casual' | 'appreciative';
}

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'supportive-encourage',
    label: 'Encouraging',
    icon: '💪',
    prompt: 'Write an encouraging and supportive reply that shows empathy and offers positive reinforcement.',
    category: 'supportive',
  },
  {
    id: 'supportive-empathy',
    label: 'Empathetic',
    icon: '🤝',
    prompt: 'Write an empathetic reply that acknowledges their feelings and shows understanding.',
    category: 'supportive',
  },
  {
    id: 'thoughtful-insight',
    label: 'Add Insight',
    icon: '💡',
    prompt: 'Share a thoughtful insight or perspective that adds value to their point.',
    category: 'thoughtful',
  },
  {
    id: 'thoughtful-analysis',
    label: 'Analytical',
    icon: '🔍',
    prompt: 'Provide a deeper analysis or breakdown of the topic they mentioned.',
    category: 'thoughtful',
  },
  {
    id: 'engaging-question',
    label: 'Ask Question',
    icon: '❓',
    prompt: 'Ask an engaging follow-up question that deepens the conversation.',
    category: 'engaging',
  },
  {
    id: 'engaging-share',
    label: 'Share Experience',
    icon: '📖',
    prompt: 'Share a relevant personal experience or story that relates to their tweet.',
    category: 'engaging',
  },
  {
    id: 'professional-network',
    label: 'Network',
    icon: '🤝',
    prompt: 'Write a professional networking-focused reply that opens doors for collaboration.',
    category: 'professional',
  },
  {
    id: 'professional-expertise',
    label: 'Share Expertise',
    icon: '🎯',
    prompt: 'Offer professional expertise or industry insights related to their topic.',
    category: 'professional',
  },
  {
    id: 'casual-friendly',
    label: 'Friendly Chat',
    icon: '😊',
    prompt: 'Write a casual, friendly reply like chatting with a friend.',
    category: 'casual',
  },
  {
    id: 'casual-humor',
    label: 'Light Humor',
    icon: '😄',
    prompt: 'Add light humor or a playful take on their tweet.',
    category: 'casual',
  },
  {
    id: 'appreciative-thanks',
    label: 'Say Thanks',
    icon: '🙏',
    prompt: 'Express genuine gratitude and appreciation for their post.',
    category: 'appreciative',
  },
  {
    id: 'appreciative-agree',
    label: 'Show Agreement',
    icon: '✅',
    prompt: 'Show agreement and amplify their message with added context.',
    category: 'appreciative',
  },
];

export interface TweetTemplate {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'general' | 'engagement' | 'promotion' | 'educational';
}

export const TWEET_TEMPLATES: TweetTemplate[] = [
  {
    id: 'tweet-thought',
    label: 'Quick Thought',
    icon: '💭',
    prompt: 'Write a short, punchy tweet about a random thought or observation.',
    category: 'general',
  },
  {
    id: 'tweet-question',
    label: 'Ask Audience',
    icon: '❓',
    prompt: 'Write an engaging question to ask my followers to spark conversation.',
    category: 'engagement',
  },
  {
    id: 'tweet-story',
    label: 'Mini Story',
    icon: '📖',
    prompt: 'Write a short storytelling tweet with a hook, a conflict, and a resolution.',
    category: 'engagement',
  },
  {
    id: 'tweet-tip',
    label: 'Share Tip',
    icon: '💡',
    prompt: 'Share a helpful tip or trick related to my niche.',
    category: 'educational',
  },
  {
    id: 'tweet-poll',
    label: 'Poll Idea',
    icon: '📊',
    prompt: 'Suggest a poll question with 3-4 interesting options.',
    category: 'engagement',
  },
  {
    id: 'tweet-thread',
    label: 'Thread Starter',
    icon: '🧵',
    prompt: 'Write an attention-grabbing opening tweet for a thread about a specific topic.',
    category: 'educational',
  },
  {
    id: 'tweet-promo',
    label: 'Promotion',
    icon: '🚀',
    prompt: 'Write a promotional tweet for a new product or service, focusing on benefits.',
    category: 'promotion',
  },
  {
    id: 'tweet-announcement',
    label: 'Announcement',
    icon: '📢',
    prompt: 'Write an exciting announcement tweet.',
    category: 'general',
  },
  {
    id: 'tweet-motivation',
    label: 'Motivation',
    icon: '💪',
    prompt: 'Write a motivational quote or message to inspire followers.',
    category: 'general',
  },
  {
    id: 'tweet-meme',
    label: 'Meme Concept',
    icon: '🤣',
    prompt: 'Describe a funny meme concept or write a relatable humorous tweet.',
    category: 'engagement',
  },
];
