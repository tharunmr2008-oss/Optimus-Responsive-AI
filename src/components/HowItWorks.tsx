import { Video, ScanFace, BrainCircuit, Activity, MessageSquare, Sparkles, ArrowRight, ArrowDown } from 'lucide-react';

export function HowItWorks() {
  const pipeline = [
    {
      id: 'step-1',
      title: 'WEBCAM',
      subtitle: 'Zero-Latency Stream',
      description: 'Captures local video frames securely in the browser via HTML5 getUserMedia. Video never leaves device.',
      icon: Video,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'step-2',
      title: 'FACE DETECTION',
      subtitle: 'TinyFaceDetector',
      description: 'High-speed neural network scans viewport frames to extract facial landmark boundaries in real time.',
      icon: ScanFace,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      id: 'step-3',
      title: 'EMOTION RECOGNITION',
      subtitle: 'FaceExpressionNet',
      description: 'Calculates raw probability distributions across 7 core affective states (Happy, Sad, Angry, etc.).',
      icon: BrainCircuit,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'step-4',
      title: 'CURRENT MOOD',
      subtitle: 'Stabilization Engine',
      description: 'Responsive 1.2s rolling window with neutral de-biasing latches stable emotion without frame flickering.',
      icon: Activity,
      color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30'
    },
    {
      id: 'step-5',
      title: 'AI CONVERSATION',
      subtitle: 'Gemini Intelligence',
      description: 'Your messages are paired with your stabilized facial sentiment metadata in real-time context prompts.',
      icon: MessageSquare,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'step-6',
      title: 'MOOD-AWARE RESPONSE',
      subtitle: 'Adaptive Empathy',
      description: 'Optimus Prime dynamically tailors its tone (calming, gentle, reassuring, friendly) to your exact state.',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    }
  ];

  return (
    <section id="how-it-works" className="glass-panel-glow rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>End-To-End Cognitive Architecture</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          How Optimus Prime Works
        </h3>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          From live camera photons to instantaneous affective AI conversation in milliseconds.
        </p>
      </div>

      {/* 6-Stage Visual Connected Flow (Requirement 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 relative">
        {pipeline.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="btn-interactive p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between relative group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${step.color} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                    0{idx + 1}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white tracking-wide mb-0.5">
                  {step.title}
                </h4>
                <p className="text-[10px] font-semibold text-indigo-300/90 mb-2 uppercase tracking-wider">
                  {step.subtitle}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              {/* Connecting arrow indicator for horizontal layouts */}
              {idx < pipeline.length - 1 && (
                <div className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#07080f] border border-white/15 items-center justify-center text-slate-400 shadow-md">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}

              {/* Connecting arrow indicator for vertical/stacked layouts */}
              {idx < pipeline.length - 1 && (
                <div className="flex xl:hidden justify-center mt-3 text-slate-600">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
