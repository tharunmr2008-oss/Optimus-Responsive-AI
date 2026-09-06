import { useState, useEffect } from 'react';
import { Sparkles, Video, ShieldCheck, Cpu, Bot } from 'lucide-react';
import { EmotionName } from '../types';
import { EMOTION_CONFIGS } from '../constants/emotions';

interface HeaderProps {
  isStreaming: boolean;
  modelsReady: boolean;
  activeEmotion?: EmotionName | null;
}

export function Header({ isStreaming, modelsReady, activeEmotion }: HeaderProps) {
  const [activeSection, setActiveSection] = useState<'hero' | 'workspace' | 'emotion' | 'conversation' | 'history' | 'about'>('hero');

  // Track active section via scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      const sections: Array<{ id: string; key: typeof activeSection }> = [
        { id: 'hero', key: 'hero' },
        { id: 'ai-workspace', key: 'workspace' },
        { id: 'emotion-camera', key: 'emotion' },
        { id: 'ai-conversation', key: 'conversation' },
        { id: 'interaction-history', key: 'history' },
        { id: 'how-it-works', key: 'about' }
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].key);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string, key: typeof activeSection) => {
    setActiveSection(key);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentConfig = activeEmotion ? EMOTION_CONFIGS[activeEmotion] : null;

  return (
    <header className="bg-[#07080f]/85 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div
          onClick={() => scrollToSection('hero', 'hero')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                OPTIMUS PRIME
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                AI Companion
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block font-normal">
              Emotion-Aware AI Companion
            </p>
          </div>
        </div>

        {/* Futuristic Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/10 p-1 rounded-full text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => scrollToSection('hero', 'hero')}
            className={`btn-interactive px-3.5 py-1.5 rounded-full font-medium transition-all ${
              activeSection === 'hero'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ai-workspace', 'workspace')}
            className={`btn-interactive px-3.5 py-1.5 rounded-full font-medium transition-all ${
              activeSection === 'workspace'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            AI Experience
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('emotion-camera', 'emotion')}
            className={`btn-interactive px-3.5 py-1.5 rounded-full font-medium transition-all ${
              activeSection === 'emotion'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Emotion
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ai-conversation', 'conversation')}
            className={`btn-interactive px-3.5 py-1.5 rounded-full font-medium transition-all ${
              activeSection === 'conversation'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Conversation
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('interaction-history', 'history')}
            className={`btn-interactive px-3.5 py-1.5 rounded-full font-medium transition-all ${
              activeSection === 'history'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works', 'about')}
            className={`btn-interactive px-3.5 py-1.5 rounded-full font-medium transition-all ${
              activeSection === 'about'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            About
          </button>
        </nav>

        {/* Live System Indicators */}
        <div className="flex items-center gap-2.5">
          {/* Active Detected Mood Pill if face detected */}
          {activeEmotion && currentConfig && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/10 text-white shadow-sm">
              <span className="text-sm">{currentConfig.emoji}</span>
              <span className="capitalize">{activeEmotion}</span>
            </div>
          )}

          {/* Model Status Indicator */}
          <div
            id="model-status-indicator"
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              modelsReady
                ? 'bg-white/5 text-slate-300 border-white/10'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{modelsReady ? 'Neural Net Online' : 'Loading Neural Net...'}</span>
          </div>

          {/* Camera Status Indicator */}
          <div
            id="camera-status-indicator"
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${
              isStreaming
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStreaming ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-slate-500'
              }`}
            />
            <Video className="w-3.5 h-3.5" />
            <span>{isStreaming ? 'LIVE' : 'OFF'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
