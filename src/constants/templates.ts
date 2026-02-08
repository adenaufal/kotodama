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

export interface TweetTemplate {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'general' | 'engagement' | 'promotion' | 'educational' | 'brainstorm' | 'storytelling' | 'controversial' | 'relatable';
}

export const TWEET_TEMPLATES: TweetTemplate[] = [
  // === GENERAL ===
  {
    id: 'tweet-thought',
    label: 'Quick Thought',
    icon: '💭',
    prompt: 'Write a short, punchy tweet about a random thought or observation. Make it feel authentic and off-the-cuff.',
    category: 'general',
  },
  {
    id: 'tweet-announcement',
    label: 'Announcement',
    icon: '📢',
    prompt: 'Write an exciting announcement tweet that builds anticipation. Create urgency and interest.',
    category: 'general',
  },
  {
    id: 'tweet-motivation',
    label: 'Motivation',
    icon: '💪',
    prompt: 'Write a motivational message that inspires action. Avoid clichés - make it feel fresh and personal.',
    category: 'general',
  },
  {
    id: 'tweet-update',
    label: 'Life Update',
    icon: '✨',
    prompt: 'Share a brief personal or professional update that lets followers into your world. Be genuine and relatable.',
    category: 'general',
  },

  // === ENGAGEMENT ===
  {
    id: 'tweet-question',
    label: 'Ask Audience',
    icon: '❓',
    prompt: 'Write a thought-provoking question that sparks real conversation. Make people want to share their opinion.',
    category: 'engagement',
  },
  {
    id: 'tweet-poll',
    label: 'Poll Idea',
    icon: '📊',
    prompt: 'Create a poll with 3-4 options that people will debate about. Make the options interesting and debatable.',
    category: 'engagement',
  },
  {
    id: 'tweet-meme',
    label: 'Meme Energy',
    icon: '🤣',
    prompt: 'Write a tweet with meme-level humor that people will want to quote tweet or share. Keep it punchy and relatable.',
    category: 'engagement',
  },
  {
    id: 'tweet-this-or-that',
    label: 'This or That',
    icon: '🆚',
    prompt: 'Create a "this or that" comparison that forces people to pick sides. Make both options defensible.',
    category: 'engagement',
  },
  {
    id: 'tweet-fill-blank',
    label: 'Fill in Blank',
    icon: '📝',
    prompt: 'Write a "fill in the blank" tweet that invites creative responses. Make it fun and easy to participate.',
    category: 'engagement',
  },
  {
    id: 'tweet-unpopular-opinion',
    label: 'Unpopular Opinion',
    icon: '🔥',
    prompt: 'Start with "Unpopular opinion:" and share a take that will get people in the replies. Be bold but reasonable.',
    category: 'engagement',
  },

  // === STORYTELLING (NEW) ===
  {
    id: 'tweet-story',
    label: 'Mini Story',
    icon: '📖',
    prompt: 'Write a compelling micro-story with a hook, tension, and satisfying ending. Make readers feel something.',
    category: 'storytelling',
  },
  {
    id: 'tweet-thread-hook',
    label: 'Thread Hook',
    icon: '🧵',
    prompt: 'Write an irresistible opening tweet for a thread. Use a hook that makes people NEED to read the rest. End with "🧵" or "a thread:"',
    category: 'storytelling',
  },
  {
    id: 'tweet-before-after',
    label: 'Before/After',
    icon: '📈',
    prompt: 'Write a "before vs after" transformation tweet that shows progress or change. Make the contrast dramatic.',
    category: 'storytelling',
  },
  {
    id: 'tweet-lesson-learned',
    label: 'Lesson Learned',
    icon: '📚',
    prompt: 'Share a hard-learned lesson from personal experience. Start with the mistake, end with the insight.',
    category: 'storytelling',
  },
  {
    id: 'tweet-behind-scenes',
    label: 'Behind the Scenes',
    icon: '🎬',
    prompt: 'Take followers behind the scenes of your work or life. Show something people usually do not get to see.',
    category: 'storytelling',
  },
  {
    id: 'tweet-confession',
    label: 'Confession',
    icon: '🤫',
    prompt: 'Share a vulnerable confession or admission that others can relate to. Be authentic and a bit raw.',
    category: 'storytelling',
  },

  // === CONTROVERSIAL (NEW) ===
  {
    id: 'tweet-hot-take',
    label: 'Hot Take',
    icon: '🌶️',
    prompt: 'Write a bold, spicy take that challenges conventional wisdom. Be confident but back it up with reasoning.',
    category: 'controversial',
  },
  {
    id: 'tweet-contrarian',
    label: 'Contrarian View',
    icon: '🔄',
    prompt: 'Take the opposite stance on a popular opinion. Play devil\'s advocate with a compelling argument.',
    category: 'controversial',
  },
  {
    id: 'tweet-hard-truth',
    label: 'Hard Truth',
    icon: '💊',
    prompt: 'Share an uncomfortable truth that people need to hear. Be direct but not preachy. No sugarcoating.',
    category: 'controversial',
  },
  {
    id: 'tweet-myth-bust',
    label: 'Myth Buster',
    icon: '❌',
    prompt: 'Bust a common myth or misconception in your niche. Start with "Stop believing that..." or similar hook.',
    category: 'controversial',
  },
  {
    id: 'tweet-rant',
    label: 'Mini Rant',
    icon: '😤',
    prompt: 'Write a passionate mini-rant about something in your field that annoys you. Channel the frustration constructively.',
    category: 'controversial',
  },

  // === RELATABLE (NEW) ===
  {
    id: 'tweet-relatable',
    label: 'So Relatable',
    icon: '💯',
    prompt: 'Write a tweet about a universal experience that makes people think "this is literally me." Tap into shared struggles or joys.',
    category: 'relatable',
  },
  {
    id: 'tweet-introvert',
    label: 'Introvert Mood',
    icon: '🏠',
    prompt: 'Write a relatable tweet about introvert or homebody experiences. Celebrate staying in, overthinking, or social battery depletion.',
    category: 'relatable',
  },
  {
    id: 'tweet-adulting',
    label: 'Adulting Fails',
    icon: '🧾',
    prompt: 'Write a funny tweet about the struggles of being an adult. Taxes, responsibilities, pretending to have it together.',
    category: 'relatable',
  },
  {
    id: 'tweet-work-life',
    label: 'Work Life Mood',
    icon: '💻',
    prompt: 'Write a relatable tweet about work life, WFH struggles, or corporate absurdity. Keep it funny and universal.',
    category: 'relatable',
  },
  {
    id: 'tweet-inner-dialogue',
    label: 'Inner Dialogue',
    icon: '🧠',
    prompt: 'Write a tweet capturing your inner dialogue or thought process. Show the chaos in your head in a relatable way.',
    category: 'relatable',
  },

  // === EDUCATIONAL ===
  {
    id: 'tweet-tip',
    label: 'Quick Tip',
    icon: '💡',
    prompt: 'Share a valuable tip that people can apply immediately. Be specific and actionable, not generic.',
    category: 'educational',
  },
  {
    id: 'tweet-thread',
    label: 'Thread Starter',
    icon: '🧵',
    prompt: 'Write an educational thread opener that promises clear value. Use brackets like "[How to X]" or numbered format.',
    category: 'educational',
  },
  {
    id: 'tweet-breakdown',
    label: 'Breakdown',
    icon: '🔬',
    prompt: 'Break down a complex topic into simple, digestible points. Use numbered list or bullet format.',
    category: 'educational',
  },
  {
    id: 'tweet-framework',
    label: 'Framework',
    icon: '📐',
    prompt: 'Share a mental model or framework that helps with a specific problem. Make it memorable and applicable.',
    category: 'educational',
  },
  {
    id: 'tweet-tool-share',
    label: 'Tool Discovery',
    icon: '🛠️',
    prompt: 'Share an amazing tool or resource you discovered. Explain what problem it solves and why it is game-changing.',
    category: 'educational',
  },
  {
    id: 'tweet-mistake',
    label: 'Common Mistake',
    icon: '⚠️',
    prompt: 'Point out a common mistake people make and how to avoid it. Be helpful, not condescending.',
    category: 'educational',
  },

  // === PROMOTION ===
  {
    id: 'tweet-promo',
    label: 'Soft Promotion',
    icon: '🚀',
    prompt: 'Write a promotional tweet that leads with value, not sales. Focus on benefits and transformation, not features.',
    category: 'promotion',
  },
  {
    id: 'tweet-launch',
    label: 'Launch Hype',
    icon: '🎊',
    prompt: 'Build excitement for a launch or release. Create FOMO and anticipation without being pushy.',
    category: 'promotion',
  },
  {
    id: 'tweet-testimonial',
    label: 'Share Win',
    icon: '🏆',
    prompt: 'Share a customer success story or testimonial in a humble, celebratory way. Let results speak.',
    category: 'promotion',
  },
  {
    id: 'tweet-milestone',
    label: 'Milestone',
    icon: '🎯',
    prompt: 'Celebrate a milestone and thank your audience. Share what you learned along the way.',
    category: 'promotion',
  },

  // === BRAINSTORM ===
  {
    id: 'brainstorm-ideas',
    label: '5 Content Ideas',
    icon: '💡',
    prompt: 'Give me 5 tweet ideas about this topic. Each should be unique, engaging, and ready to post with minor tweaks.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-trending',
    label: 'Trending Angles',
    icon: '📈',
    prompt: 'What are 5 fresh, timely angles to discuss this topic right now? Focus on what is relevant today.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-hooks',
    label: 'Viral Hooks',
    icon: '🎣',
    prompt: 'Give me 5 attention-grabbing hooks for this topic. First lines that make people stop scrolling.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-conversation',
    label: 'Conversation Starters',
    icon: '💬',
    prompt: 'Generate 5 discussion-starting tweets about this topic. Questions or takes that invite replies.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-counter',
    label: 'Counter-Intuitive Takes',
    icon: '🔄',
    prompt: 'Give me 5 counter-intuitive or contrarian takes on this topic. Challenge what everyone assumes.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-stories',
    label: 'Story Angles',
    icon: '📖',
    prompt: 'Give me 5 storytelling angles for this topic. Personal stories or narratives that illustrate points.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-debate',
    label: 'Debate Topics',
    icon: '🎤',
    prompt: 'Give me 5 debate-worthy takes in this space. Opinions that split the room and spark discussion.',
    category: 'brainstorm',
  },
  {
    id: 'brainstorm-threads',
    label: 'Thread Ideas',
    icon: '🧵',
    prompt: 'Give me 5 thread ideas about this topic. Each with a compelling hook and clear value proposition.',
    category: 'brainstorm',
  },
];
