import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Sparkles, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react';
import { detectEmotionFromImage } from '../utils/detector';
import { DetectionResult } from '../types';
import { EMOTION_CONFIGS } from '../constants/emotions';

interface SampleTesterProps {
  modelsReady: boolean;
  onSampleDetection: (result: DetectionResult, imageUrl: string) => void;
  disabled?: boolean;
}

const PRESET_SAMPLES = [
  {
    id: 'happy',
    label: 'Smiling Customer',
    emotionHint: 'happy',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'neutral',
    label: 'Neutral Inquirer',
    emotionHint: 'neutral',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'surprised',
    label: 'Surprised User',
    emotionHint: 'surprised',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'distressed',
    label: 'Distressed Customer',
    emotionHint: 'sad',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  }
];

export function SampleTester({ modelsReady, onSampleDetection, disabled }: SampleTesterProps) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const analyzeImageElement = async (img: HTMLImageElement, id: string) => {
    setAnalyzingId(id);
    setErrorMsg(null);
    try {
      const result = await detectEmotionFromImage(img, { inputSize: 320, scoreThreshold: 0.3 });
      onSampleDetection(result, img.src);
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setErrorMsg('Could not detect face in sample image.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SAMPLES[0]) => {
    if (!modelsReady || disabled) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = preset.url;
    setAnalyzingId(preset.id);
    img.onload = () => {
      analyzeImageElement(img, preset.id);
    };
    img.onerror = () => {
      setAnalyzingId(null);
      setErrorMsg('Failed to load sample image.');
    };
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modelsReady || disabled) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      setAnalyzingId('custom-upload');
      img.onload = () => {
        analyzeImageElement(img, 'custom-upload');
      };
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="glass-panel-glow rounded-3xl border border-white/10 shadow-2xl p-5 backdrop-blur-xl transition-all">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Preset Facial Test Portraits
            </h4>
            <p className="text-[11px] text-slate-400">
              Test neural emotion perception instantly on reference expressions
            </p>
          </div>
        </div>

        {/* Custom Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={!modelsReady || disabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!modelsReady || disabled}
            className="btn-interactive inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PRESET_SAMPLES.map((sample) => {
          const cfg = EMOTION_CONFIGS[sample.emotionHint as any];
          const isAnalyzing = analyzingId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectPreset(sample)}
              disabled={!modelsReady || disabled || analyzingId !== null}
              className="btn-interactive flex items-center gap-2.5 p-2 rounded-2xl border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/10 bg-white/[0.02] transition-all text-left group disabled:opacity-60 cursor-pointer relative shadow-sm"
            >
              <img
                src={sample.url}
                alt={sample.label}
                className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                crossOrigin="anonymous"
              />
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-white block truncate">
                  {sample.label}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {cfg?.emoji} Expected {sample.emotionHint}
                </span>
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-400 mt-2 font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
