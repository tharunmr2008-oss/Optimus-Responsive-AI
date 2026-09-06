import { ArrowDown, Sparkles, Shield, Cpu, Zap, Activity } from 'lucide-react';
import { EmotionName } from '../types';
import { EMOTION_CONFIGS } from '../constants/emotions';

interface HeroSectionProps {
  onEnterExperience: () => void;
  isStreaming: boolean;
  modelsReady: boolean;
  activeEmotion?: EmotionName | null;
  onStartCamera?: () => void;
}

export function HeroSection({
  onEnterExperience,
  isStreaming,
  modelsReady,
  activeEmotion,
  onStartCamera
}: HeroSectionProps) {
  const currentConfig = activeEmotion ? EMOTION_CONFIGS[activeEmotion] : null;

  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden select-none"
    >
      {/* Ambient background gradients & cybernetic light fields */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top radial neon plume */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-600/18 via-purple-600/12 to-transparent rounded-full blur-3xl animate-pulse-subtle pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Ambient floating light nodes */}
        <div className="absolute top-1/3 left-1/6 w-1.5 h-1.5 rounded-full bg-indigo-400/40 blur-[1px] animate-pulse" />
        <div className="absolute top-2/3 right-1/5 w-2 h-2 rounded-full bg-purple-400/30 blur-[1px] animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-cyan-400/40 blur-[1px]" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Top Product Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-8 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-500/40 transition-colors">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
            Next-Gen Emotion AI
          </span>
          <span className="text-white/20">•</span>
          <span className="text-xs font-medium text-slate-400">
            Optimus Prime Platform
          </span>
        </div>

        {/* Brand Title with High-Contrast Futuristic Typography */}
        <h1
          id="hero-title"
          data-ai-element="true"
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4"
        >
          <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
            OPTIMUS PRIME
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl font-medium text-indigo-300/90 tracking-wide uppercase mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 inline" />
          <span>Emotion-Aware AI Companion</span>
          <Sparkles className="w-4 h-4 text-indigo-400 inline" />
        </p>

        {/* Main Message */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 tracking-tight max-w-2xl mb-4 leading-snug">
          &ldquo;An AI that understands your mood and responds accordingly.&rdquo;
        </h2>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-normal">
          Real-time facial emotion awareness combined with natural AI conversation.
          Edge neural perception that dynamically tunes empathy, tone, and assistance.
        </p>

        {/* Action Buttons with Satisfying Micro-Interactions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-14 w-full sm:w-auto">
          {/* Prominent Primary CTA: Enter AI Experience */}
          <button
            id="hero-enter-experience-btn"
            data-ai-element="true"
            type="button"
            onClick={onEnterExperience}
            className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-base shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] border border-indigo-400/30 cursor-pointer"
          >
            <span>Enter AI Experience</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </button>

          {/* Secondary Quick Action */}
          {!isStreaming && onStartCamera && (
            <button
              id="hero-start-camera-direct-btn"
              type="button"
              onClick={() => {
                onStartCamera();
                onEnterExperience();
              }}
              disabled={!modelsReady}
              className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 font-medium text-sm border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-sm"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Launch Live Camera</span>
            </button>
          )}

          {isStreaming && (
            <div className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Camera Feed Live</span>
              {currentConfig && (
                <span className="ml-1 text-white font-semibold">
                  ({currentConfig.emoji} {currentConfig.label.split(' /')[0]})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Feature Capability Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Edge Facial Vision</p>
              <p className="text-[11px] text-slate-400">100% In-Browser Model</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Total Privacy</p>
              <p className="text-[11px] text-slate-400">Zero Cloud Video Storage</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Empathetic Gemini AI</p>
              <p className="text-[11px] text-slate-400">Continuous Tone Adaptation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
