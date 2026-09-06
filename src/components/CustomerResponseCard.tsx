import { useState } from 'react';
import { EmotionName, DetectionResult } from '../types';
import { EMOTION_CONFIGS } from '../constants/emotions';
import {
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  ShieldAlert,
  HeartHandshake,
  Volume2,
  Sparkles
} from 'lucide-react';

interface CustomerResponseCardProps {
  detection: DetectionResult | null;
  isStreaming: boolean;
}

export function CustomerResponseCard({ detection, isStreaming }: CustomerResponseCardProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const hasFace = detection?.hasFace ?? false;
  const emotion: EmotionName = detection?.dominantEmotion || 'neutral';
  const config = EMOTION_CONFIGS[emotion];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Determine urgency level
  let urgencyBadge = {
    label: 'Standard Inflow',
    bgColor: 'bg-white/5 text-slate-400 border-white/10'
  };

  if (emotion === 'angry') {
    urgencyBadge = {
      label: 'High Priority • De-escalate',
      bgColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.25)]'
    };
  } else if (emotion === 'sad' || emotion === 'disgusted') {
    urgencyBadge = {
      label: 'Attention Needed • Empathy First',
      bgColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    };
  } else if (emotion === 'happy') {
    urgencyBadge = {
      label: 'Positive Experience • Retain',
      bgColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
    };
  }

  return (
    <div className="bg-[#0c0e17] rounded-2xl border border-white/10 shadow-2xl p-5 flex flex-col justify-between backdrop-blur-md">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.2)]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Adaptive Service Response</h3>
              <p className="text-xs text-slate-400">Auto-tailored agent recommendations</p>
            </div>
          </div>

          <span
            id="service-urgency-badge"
            className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${urgencyBadge.bgColor}`}
          >
            {urgencyBadge.label}
          </span>
        </div>

        {/* Dynamic Primary Response Quote Card (Design Match) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-400" />
              AI Recommendation
            </span>
            <button
              id="copy-primary-response-btn"
              type="button"
              onClick={() => handleCopy(config.response)}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer transition-colors"
            >
              {copiedText === config.response ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Response Quote Box */}
          <div
            id="customer-service-response-card"
            className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 shadow-[0_0_25px_rgba(79,70,229,0.15)]"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <MessageSquare className="w-20 h-20 text-indigo-500" />
            </div>
            <p className="text-base sm:text-lg font-medium text-white italic leading-relaxed relative z-10">
              "{config.response}"
            </p>
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10 text-xs text-slate-400 relative z-10">
              <span className="font-semibold text-indigo-300 uppercase text-[10px] tracking-wider">Trigger:</span>
              <span className="capitalize text-slate-200">{config.name} emotion detected</span>
              {hasFace && (
                <span className="text-slate-400 font-mono">({detection?.confidence}% confidence)</span>
              )}
            </div>
          </div>
        </div>

        {/* Tone & Strategy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Recommended Tone
            </span>
            <p className="text-xs sm:text-sm font-medium text-white">
              {config.agentTone}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Recommended Action
            </span>
            <p className="text-xs text-slate-300 line-clamp-2">
              {config.recommendedAction}
            </p>
          </div>
        </div>

        {/* Quick Follow-up Responses */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            One-Click Follow-Up Templates:
          </span>
          <div className="space-y-1.5">
            {config.suggestedFollowUp.map((phrase, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/30 transition-colors group text-xs"
              >
                <span className="text-slate-300 font-normal pr-2">"{phrase}"</span>
                <button
                  type="button"
                  onClick={() => handleCopy(phrase)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-colors shrink-0"
                  title="Copy to clipboard"
                >
                  {copiedText === phrase ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-4 border-t border-white/10 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Empathetic AI Rules Engine
        </span>
        <span className="text-slate-400">Continuous Adaptive Evaluation</span>
      </div>
    </div>
  );
}
