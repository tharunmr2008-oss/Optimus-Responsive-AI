import { EmotionName, EmotionServiceConfig } from '../types';

export const EMOTION_CONFIGS: Record<EmotionName, EmotionServiceConfig> = {
  happy: {
    name: 'happy',
    label: 'Happy / Satisfied',
    emoji: '😊',
    color: '#10B981', // emerald-500
    bgColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-400',
    response: "We're glad to see you're having a good experience. How can we assist you further?",
    agentTone: 'Warm, Enthusiastic & Receptive',
    recommendedAction: 'Acknowledge positive feedback, explore additional value-add services, and ask for a rating or review.',
    suggestedFollowUp: [
      "Can we help you explore any other features today?",
      "Would you like us to send a summary of your account to your email?",
      "Thank you for being a valued customer!"
    ]
  },
  sad: {
    name: 'sad',
    label: 'Sad / Distressed',
    emoji: '😔',
    color: '#3B82F6', // blue-500
    bgColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    response: "I'm sorry you're having a difficult time. Please tell us how we can help.",
    agentTone: 'Empathetic, Gentle & Patient',
    recommendedAction: 'Demonstrate immediate empathy, listen without interrupting, validate their concern, and provide direct hands-on assistance.',
    suggestedFollowUp: [
      "Please take your time; I am here with you until this is completely solved.",
      "Would you like me to walk you through the steps one by one?",
      "Let me handle this directly on our end so you don't have to worry."
    ]
  },
  angry: {
    name: 'angry',
    label: 'Angry / Frustrated',
    emoji: '😠',
    color: '#EF4444', // red-500
    bgColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_25px_rgba(239,68,68,0.2)]',
    borderColor: 'border-rose-500',
    textColor: 'text-rose-400',
    response: "I understand that this is frustrating. Let us help you resolve the issue as quickly as possible.",
    agentTone: 'De-escalation, Calm, Direct & Urgent',
    recommendedAction: 'Prioritize resolution speed, apologize sincerely for the friction, avoid defensive statements, and offer immediate tangible remedies.',
    suggestedFollowUp: [
      "I am expediting this right now as our top priority.",
      "I hear your frustration completely and take full ownership of resolving this.",
      "Let me issue a direct credit/replacement while we investigate."
    ]
  },
  fearful: {
    name: 'fearful',
    label: 'Fearful / Anxious',
    emoji: '😨',
    color: '#8B5CF6', // purple-500
    bgColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-400',
    response: "Don't worry. We're here to help you through this.",
    agentTone: 'Reassuring, Clear & Grounded',
    recommendedAction: 'Reassure safety and data security, clarify potential misunderstandings, and outline clear step-by-step next actions.',
    suggestedFollowUp: [
      "Rest assured your account and data are completely secure.",
      "Nothing irreversible has happened; we can easily restore everything.",
      "Here is the exact 2-step plan to get you back on track."
    ]
  },
  surprised: {
    name: 'surprised',
    label: 'Surprised / Inquisitive',
    emoji: '😲',
    color: '#F59E0B', // amber-500
    bgColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    response: "It looks like something caught your attention. How can we assist you?",
    agentTone: 'Attentive, Informative & Clarifying',
    recommendedAction: 'Verify if the unexpected event was positive or confusing; offer clear explanations or documentation.',
    suggestedFollowUp: [
      "Did you notice an unexpected update or charge? I can explain it in detail.",
      "Would you like an overview of recent changes to your plan?",
      "Is there anything specific that looks different from what you expected?"
    ]
  },
  disgusted: {
    name: 'disgusted',
    label: 'Disgusted / Dissatisfied',
    emoji: '😣',
    color: '#F97316', // orange-500
    bgColor: 'bg-orange-500/10 text-orange-300 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-400',
    response: "I'm sorry this experience has been unpleasant. Let us help resolve it.",
    agentTone: 'Apologetic, Respectful & Solution-Oriented',
    recommendedAction: 'Acknowledge the negative experience, express genuine regret, and take decisive steps to fix the root cause immediately.',
    suggestedFollowUp: [
      "We hold our service to higher standards, and I apologize for falling short.",
      "I'd like to make this right immediately. Here is what we can do for you.",
      "Your feedback is being shared directly with our quality management team."
    ]
  },
  neutral: {
    name: 'neutral',
    label: 'Neutral / Attentive',
    emoji: '😐',
    color: '#94A3B8', // slate-400
    bgColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30 shadow-[0_0_15px_rgba(148,163,184,0.1)]',
    borderColor: 'border-slate-500',
    textColor: 'text-slate-400',
    response: "Hello! How can I assist you today?",
    agentTone: 'Professional, Polite & Ready to Assist',
    recommendedAction: 'Welcome the customer courteously, ask open-ended questions, and offer guidance based on their inquiry.',
    suggestedFollowUp: [
      "What can I help you take care of today?",
      "Feel free to ask any question about your services or orders.",
      "I'm ready whenever you are."
    ]
  }
};

export const ALL_EMOTIONS: EmotionName[] = [
  'happy',
  'sad',
  'angry',
  'fearful',
  'surprised',
  'disgusted',
  'neutral'
];
