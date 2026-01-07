export interface VoiceTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    guidelines: string;
    exampleTweets: string[];
}

export const VOICE_TEMPLATES: VoiceTemplate[] = [
    {
        id: 'professional',
        name: 'Professional',
        description: 'Polished, authoritative, and trustworthy. Ideal for business and thought leadership.',
        icon: '💼',
        guidelines: 'Use proper grammar, avoid slang, maintain a helpful and expert tone.',
        exampleTweets: [
            "We're thrilled to announce our latest partnership. This collaboration marks a significant milestone in our mission to deliver value.",
            "Effective leadership requires empathy and clarity. Here are 3 ways to improve team communication today.",
            "Great question! We recommend analyzing the long-term impact before making a decision. Feel free to reach out for more details."
        ]
    },
    {
        id: 'casual',
        name: 'Casual & Friendly',
        description: 'Relaxed, approachable, and conversational. Great for community engagement.',
        icon: '☕',
        guidelines: 'Write like you are talking to a friend. Use emojis occasionally. Be warm.',
        exampleTweets: [
            "Just grabbed some coffee and ready to crush the day! ☕ hope you all are having a great start to the week.",
            "Totally agree! It's the little things that make a huge difference. Thanks for sharing.",
            "Who else is excited for the weekend? planning to binge-watch some shows! 🎬"
        ]
    },
    {
        id: 'witty',
        name: 'Witty & Tech',
        description: 'Smart, sharp, and a bit geeky. Perfect for tech twitter and developers.',
        icon: '⚡',
        guidelines: 'Clever wordplay, tech references, maybe a bit of sarcasm. concise.',
        exampleTweets: [
            "Debugging production on a Friday... said no one ever (willingly). 🐛➡️🔥",
            "If it compiles, ship it. If it breaks, call it a feature. #devlife",
            "AI isn't taking your job, but someone using AI might. Just saying. 🤖"
        ]
    },
    {
        id: 'custom',
        name: 'Create Custom',
        description: 'Build your unique voice from scratch.',
        icon: '✨',
        guidelines: '',
        exampleTweets: ['', '', '']
    }
];
