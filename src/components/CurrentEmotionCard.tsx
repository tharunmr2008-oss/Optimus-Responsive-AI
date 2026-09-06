import { EmotionName } from '../types';
import { StabilizedMood } from '../utils/emotionStabilizer';
import { EMOTION_CONFIGS, ALL_EMOTIONS } from '../constants/emotions';
import { Activity, UserX, HelpCircle, ShieldCheck, Gauge } from 'lucide-react';

interface CurrentEmotionCardProps {
  stabilizedMood: StabilizedMood | null;
  isStreaming: boolean;
}

export function CurrentEmotionCard({
  stabilizedMood,
  isStreaming
}: CurrentEmotionCardProps) {
  const hasFace = stabilizedMood?.hasFace ?? false;
  const emotionName: EmotionName = stabilizedMood?.dominantEmotion || 'neutral';
  const confidence = stabilizedMood?.confidence ?? 0;
  const stabilityScore = stabilizedMood?.stabilityScore ?? 0;
  const stabilityLabel = stabilizedMood?.stabilityLabel ?? 'No Face';
  const config = EMOTION_CONFIGS[emotionName];

  const allExpressions = stabilizedMood?.allExpressions || {
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    surprised: 0,
    disgusted: 0,
    neutral: 0
  };

  const rawTopEmotion = stabilizedMood?.rawTopEmotion || null;
  const rawTopProbability = stabilizedMood?.rawTopProbability || 0;

  // Stability color
  let stabilityBadgeColor = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  let stabilityBarColor = '#64748b';
  if (stabilityLabel === 'High') {
    stabilityBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    stabilityBarColor = '#10B981';
  } else if (stabilityLabel === 'Moderate') {
    stabilityBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    stabilityBarColor = '#6366F1';
  } else if (stabilityLabel === 'Transitioning') {
    stabilityBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    stabilityBarColor = '#F59E0B';
  }

  return (
    <div
      id="current-emotion-card"
      data-ai-element="true"
      className="glass-panel-glow rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.2)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Current Mood
            </h3>
            <p className="text-xs text-slate-400">Responsive rolling window (~1.2s)</p>
          </div>
        </div>

        {/* Status Badge */}
        {isStreaming && (
          <span
            id="face-detection-badge"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider ${
              hasFace
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasFace ? 'bg-emerald-500 shadow-[0_0_6px_#10B981]' : 'bg-amber-400'
              }`}
            />
            {hasFace ? 'Face Locked' : 'Searching'}
          </span>
        )}
      </div>

      {/* Main Emotion Display */}
      {isStreaming && hasFace ? (
        <div className="space-y-4">
          {/* Stabilized Emotion Box */}
          <div
            id="current-emotion-display"
            className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${config.bgColor}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="text-4xl select-none filter drop-shadow"
                  role="img"
                  aria-label={config.label}
                >
                  {config.emoji}
                </span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Stabilized Mood
                  </span>
                  <h4 className="text-2xl font-black text-white italic tracking-wide uppercase">
                    {config.name}
                  </h4>
                  <p className="text-xs text-slate-300 opacity-90">{config.label}</p>
                </div>
              </div>

              {/* Confidence Metric */}
              <div className="text-right border-l border-white/10 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Confidence
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-indigo-400 tracking-tight">
                  {confidence}%
                </span>
              </div>
            </div>

            {/* Quick Confidence Bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-3.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200 shadow-sm"
                style={{
                  width: `${Math.min(100, Math.max(5, confidence))}%`,
                  backgroundColor: config.color
                }}
              />
            </div>
          </div>

          {/* Emotion Stability Meter */}
          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Emotion Stability</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${stabilityBadgeColor}`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>
                  {stabilityLabel} • {stabilityScore}%
                </span>
              </span>
            </div>

            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(5, stabilityScore))}%`,
                  backgroundColor: stabilityBarColor
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Filters frame jitter &amp; micro-expressions for reliable conversational tone adaptation.
            </p>
          </div>

          {/* 7-Emotion Multi-Class Probability Distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Smoothed Emotion Distribution (7 Classes)
              </span>
              <span className="text-[10px] font-mono text-indigo-400">Rolling Window</span>
            </div>

            <div className="space-y-1.5">
              {ALL_EMOTIONS.map((emotionKey) => {
                const emotionCfg = EMOTION_CONFIGS[emotionKey];
                const rawScore = allExpressions[emotionKey] || 0;
                const pct = Math.round(rawScore * 100);
                const isDominant = emotionKey === emotionName;

                return (
                  <div key={emotionKey} className="group">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span
                        className={`flex items-center gap-1.5 font-medium ${
                          isDominant ? 'text-white font-semibold' : 'text-slate-400'
                        }`}
                      >
                        <span className="text-xs">{emotionCfg.emoji}</span>
                        <span className="capitalize text-[11px]">{emotionKey}</span>
                        {isDominant && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
                            Dominant
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          isDominant ? 'text-indigo-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    {/* Distribution Bar */}
                    <div className="w-full bg-white/5 border border-white/5 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          backgroundColor: isDominant ? emotionCfg.color : '#475569'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Diagnostics (Requirement 9) */}
          <div className="p-3 rounded-xl border border-white/10 bg-black/40 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Emotion Engine Diagnostics
              </span>
              <span className="text-[9px] text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                Live Window ~1.2s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Raw Top Emotion</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-white capitalize flex items-center gap-1 truncate">
                    <span>{rawTopEmotion ? EMOTION_CONFIGS[rawTopEmotion]?.emoji : '—'}</span>
                    <span className="truncate">{rawTopEmotion || 'None'}</span>
                  </span>
                  <span className="text-amber-400 font-bold text-xs ml-1">{rawTopProbability}%</span>
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5">Raw single-frame output</span>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Stable Mood</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-indigo-300 capitalize flex items-center gap-1 truncate">
                    <span>{emotionName ? EMOTION_CONFIGS[emotionName]?.emoji : '—'}</span>
                    <span className="truncate">{emotionName || 'None'}</span>
                  </span>
                  <span className="text-emerald-400 font-bold text-xs ml-1">{confidence}%</span>
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5">Rolling window + override</span>
              </div>
            </div>
          </div>
        </div>
      ) : isStreaming && !hasFace ? (
        <div className="py-8 px-4 text-center rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
            <UserX className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            No Face in Frame
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Position yourself clearly in front of the camera with adequate lighting to enable continuous mood adaptation.
          </p>
          <div className="mt-3 inline-block text-[11px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
            AI Assistant will use standard courteous tone
          </div>
        </div>
      ) : (
        <div className="py-8 px-4 text-center rounded-xl bg-white/[0.02] border border-white/10">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            Camera Standby
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Start the camera to activate real-time facial expression analysis and emotion stabilization.
          </p>
        </div>
      )}

      {/* Model Spec Note */}
      <div className="pt-3 mt-3 border-t border-white/10 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Inference: Browser-local Face-API</span>
        <span className="font-mono text-slate-400">Zero Cloud Frame Uploads</span>
      </div>
    </div>
  );
}
