import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Loader2,
  Check,
  Copy
} from 'lucide-react';
import { ChatMessage, EmotionName } from '../types';
import { StabilizedMood } from '../utils/emotionStabilizer';
import { EMOTION_CONFIGS } from '../constants/emotions';

interface ChatAssistantProps {
  stabilizedMood: StabilizedMood | null;
  isStreaming: boolean;
  modelsReady: boolean;
}

const SAMPLE_PROMPTS = [
  'My order is still not delivered.',
  'I was charged twice for my subscription.',
  'I love your product, it works wonderfully!',
  'I received a damaged package today.'
];

export function ChatAssistant({
  stabilizedMood,
  isStreaming,
  modelsReady
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        "Hello! I'm your AI customer support assistant. How can I help you today? Ask about your orders, returns, account, or any support issue.",
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Determine current mood context
  const currentEmotion = stabilizedMood?.hasFace ? stabilizedMood.dominantEmotion : null;
  const currentConfidence = stabilizedMood?.hasFace ? stabilizedMood.confidence : 0;
  const currentStability = stabilizedMood?.hasFace ? stabilizedMood.stabilityLabel : 'No Face';
  const emotionConfig = currentEmotion ? EMOTION_CONFIGS[currentEmotion] : null;

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || isLoading) return;

    setErrorMessage(null);
    setInputMessage('');

    // Create user message with current mood snapshot
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      moodAtTime: currentEmotion,
      confidenceAtTime: currentConfidence,
      stabilityAtTime: currentStability
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Call server-side Gemini API with mood context
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          mood: currentEmotion,
          confidence: currentConfidence,
          stability: currentStability,
          history: newMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();

      let replyText = data.reply;
      if (!res.ok) {
        const rawErr = String(data.error || '');
        const isBusy = res.status === 503 || res.status === 429 || /503|unavailable|busy|overload|demand|rate|quota/i.test(rawErr);
        const fallbackMsg = isBusy || rawErr.includes('{')
          ? 'The AI service is temporarily busy. Please try again in a moment.'
          : (data.error || 'The AI service is temporarily busy. Please try again in a moment.');
        throw new Error(fallbackMsg);
      }

      // Determine tone hint for UI display
      let toneHint = 'Professional & Helpful';
      if (currentEmotion === 'angry') toneHint = 'Calming & Solution-Oriented';
      else if (currentEmotion === 'sad') toneHint = 'Gentle & Supportive';
      else if (currentEmotion === 'happy') toneHint = 'Friendly & Enthusiastic';
      else if (currentEmotion === 'fearful') toneHint = 'Reassuring & Clear';
      else if (currentEmotion === 'surprised') toneHint = 'Clarifying & Transparent';
      else if (currentEmotion === 'disgusted') toneHint = 'Empathetic & Decisive';

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
        moodAtTime: currentEmotion,
        toneHint
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const rawMsg = String(err?.message || '');
      // Format friendly error message - never show raw JSON or technical stack traces
      let friendlyError = 'The AI service is temporarily busy. Please try again in a moment.';
      if (rawMsg && !rawMsg.includes('{') && !rawMsg.includes('503') && !rawMsg.includes('Failed to fetch') && !rawMsg.includes('status')) {
        friendlyError = rawMsg;
      }
      setErrorMessage(friendlyError);

      const errorMsgItem: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: friendlyError,
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsgItem]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content:
          "Hello! I'm your AI customer support assistant. How can I help you today? Ask about your orders, returns, account, or any support issue.",
        timestamp: new Date()
      }
    ]);
    setErrorMessage(null);
  };

  return (
    <div
      id="ai-conversation"
      data-ai-element="true"
      className="glass-panel-glow rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[680px] lg:h-[750px] backdrop-blur-xl overflow-hidden relative"
    >
      {/* Assistant Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                OPTIMUS PRIME
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]" />
                Online ●
              </span>
            </div>
            <p className="text-xs text-indigo-300/80 font-medium">
              Emotion-Aware AI Companion
            </p>
          </div>
        </div>

        {/* Live Detected Mood subtly shown near header (Requirement 7) */}
        <div className="flex items-center gap-2.5">
          <div
            id="chat-header-mood"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs backdrop-blur-md transition-all"
          >
            <span className="text-slate-400 font-medium text-[11px]">Current mood:</span>
            {currentEmotion && emotionConfig ? (
              <span className="font-semibold text-white inline-flex items-center gap-1.5">
                <span className="text-sm">{emotionConfig.emoji}</span>
                <span className="capitalize">{emotionConfig.name}</span>
                <span className="text-[10px] text-indigo-300 font-mono">({currentConfidence}%)</span>
              </span>
            ) : (
              <span className="text-slate-500 italic text-[11px]">
                {isStreaming ? 'Scanning face...' : 'Camera standby'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            title="Reset conversation"
            className="btn-interactive p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const moodConfig = msg.moodAtTime ? EMOTION_CONFIGS[msg.moodAtTime] : null;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
            >
              {!isUser && (
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.isError
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  }`}
                >
                  {msg.isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs shadow-[0_4px_20px_rgba(99,102,241,0.25)] border border-indigo-400/20'
                    : msg.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-bl-xs'
                    : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-xs backdrop-blur-md'
                }`}
              >
                {/* User mood tag at time of sending */}
                {isUser && (
                  <div className="flex items-center justify-end gap-1.5 mb-1.5 text-[10px] text-indigo-200 font-medium">
                    {moodConfig ? (
                      <span className="inline-flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
                        <span>{moodConfig.emoji}</span>
                        <span className="capitalize font-semibold">{moodConfig.name}</span>
                        <span>({msg.confidenceAtTime}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full">
                        <span>Mood: Uncaptured</span>
                      </span>
                    )}
                  </div>
                )}

                {/* AI tone adaptation pill */}
                {!isUser && msg.toneHint && !msg.isError && (
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Adapted Tone: {msg.toneHint}</span>
                  </div>
                )}

                {/* Message Body */}
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.content}
                </p>

                {/* Footer timestamp & copy */}
                <div
                  className={`flex items-center justify-between gap-2 mt-2.5 pt-1.5 border-t text-[11px] ${
                    isUser
                      ? 'border-white/15 text-indigo-200'
                      : 'border-white/5 text-slate-400'
                  }`}
                >
                  <span className="font-mono">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {!isUser && !msg.isError && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="btn-interactive inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl shrink-0 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Polished Three Animated Dots Typing Indicator (Requirement 8) */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-bl-xs px-5 py-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {currentEmotion
                  ? `Optimus Prime responding with ${currentEmotion} awareness...`
                  : 'Optimus Prime is thinking...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample Quick Inquiries */}
      <div className="px-4 sm:px-5 py-2 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 mr-1 font-semibold">
            Prompts:
          </span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(sample)}
              disabled={isLoading}
              className="btn-interactive px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-white text-slate-300 text-xs shrink-0 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>

      {/* Premium Chat Input (Requirement 8) */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-[#07080f]/90 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="space-y-2.5"
        >
          <div className="relative flex items-center">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Optimus Prime anything... (Press Enter to send)"
              disabled={isLoading}
              className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-400 focus:shadow-[0_0_25px_rgba(99,102,241,0.25)] rounded-2xl px-4 py-3.5 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-none font-normal"
            />

            <button
              id="chat-send-btn"
              data-ai-element="true"
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="btn-interactive absolute right-3 bottom-3 p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.4)] cursor-pointer"
              title="Send message to Optimus Prime"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Active Mood Sync Indicator below input */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Conversational Mode:</span>
              {currentEmotion && emotionConfig ? (
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-300">
                  <span>{emotionConfig.emoji}</span>
                  <span className="capitalize">{emotionConfig.name}</span>
                  <span className="font-mono text-slate-400">({currentConfidence}%, {currentStability})</span>
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  Standard tone (No active face detected)
                </span>
              )}
            </div>

            <span className="text-slate-400 hidden sm:inline">
              Shift + Enter for new line
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
