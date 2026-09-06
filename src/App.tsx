import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SmoothCursor } from '@/components/ui/smooth-cursor';
import { WebcamPanel } from './components/WebcamPanel';
import { CurrentEmotionCard } from './components/CurrentEmotionCard';
import { ChatAssistant } from './components/ChatAssistant';
import { EmotionHistory } from './components/EmotionHistory';
import { HowItWorks } from './components/HowItWorks';
import { SampleTester } from './components/SampleTester';
import { Antigravity } from './components/Antigravity';
import { loadFaceApiModels } from './utils/faceApiLoader';
import { DetectionResult, EmotionHistoryItem, EmotionName } from './types';
import { EmotionStabilizer, StabilizedMood } from './utils/emotionStabilizer';
import { EMOTION_CONFIGS } from './constants/emotions';
import { Shield, AlertCircle } from 'lucide-react';

export default function App() {
  const [modelsReady, setModelsReady] = useState(false);
  const [modelStatusMsg, setModelStatusMsg] = useState('Initializing neural networks...');
  const [modelError, setModelError] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [currentDetection, setCurrentDetection] = useState<DetectionResult | null>(null);
  const [stabilizedMood, setStabilizedMood] = useState<StabilizedMood | null>(null);
  const [history, setHistory] = useState<EmotionHistoryItem[]>([]);

  // Responsive Emotion Stabilizer (~1.2s rolling window, 12 samples max, 1s hold, 350ms persistence)
  const stabilizerRef = useRef(new EmotionStabilizer(1200, 12, 1000, 350));

  // Debouncing refs for history logging
  const lastLoggedEmotionRef = useRef<EmotionName | null>(null);
  const lastLoggedTimeRef = useRef<number>(0);

  // Initialize face-api neural network models on load
  useEffect(() => {
    let isMounted = true;

    async function initModels() {
      try {
        await loadFaceApiModels((status) => {
          if (isMounted) setModelStatusMsg(status);
        });
        if (isMounted) {
          setModelsReady(true);
          setModelStatusMsg('Neural models ready');
        }
      } catch (err: any) {
        console.error('Model initialization failed:', err);
        if (isMounted) {
          setModelError(err?.message || 'Failed to initialize models');
          setModelStatusMsg('Model loading failed');
        }
      }
    }

    initModels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Start Camera Stream
  const handleStartCamera = useCallback(async () => {
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam access is not supported by your browser or environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      setMediaStream(stream);
      setIsStreaming(true);
      setCameraError(null);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No video camera was found on your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is already in use by another application.';
      } else if (err.message) {
        message = err.message;
      }
      setCameraError(message);
      setIsStreaming(false);
      setMediaStream(null);
    }
  }, []);

  // Stop Camera Stream
  const handleStopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    setMediaStream(null);
    setIsStreaming(false);
    setCurrentDetection(null);
    stabilizerRef.current.reset();
    setStabilizedMood(null);
    lastLoggedEmotionRef.current = null;
  }, [mediaStream]);

  // Handle Continuous Detection Updates from live webcam feed
  const handleDetectionUpdate = useCallback((result: DetectionResult) => {
    setCurrentDetection(result);

    // Feed sample into emotion stabilizer
    const stable = stabilizerRef.current.addSample(result);
    setStabilizedMood(stable);

    if (!stable.hasFace || !stable.dominantEmotion) {
      return;
    }

    const now = Date.now();
    const emotion = stable.dominantEmotion;
    const confidence = stable.confidence;

    // Log to history when a confident stabilized emotion is sustained
    if (confidence >= 45 && stable.stabilityScore >= 50) {
      const isNewEmotion = emotion !== lastLoggedEmotionRef.current;
      const timeSinceLastLog = now - lastLoggedTimeRef.current;

      // Log if emotion changed (with 2s debounce) or if same emotion persisted for > 10s
      if ((isNewEmotion && timeSinceLastLog > 2000) || timeSinceLastLog > 10000) {
        lastLoggedEmotionRef.current = emotion;
        lastLoggedTimeRef.current = now;

        const config = EMOTION_CONFIGS[emotion];
        const newItem: EmotionHistoryItem = {
          id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
          emotion,
          confidence,
          timestamp: new Date(),
          serviceResponse: config.response
        };

        setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
      }
    }
  }, []);

  // Handle Sample Detection from Preset Customer Images
  const handleSampleDetection = useCallback((result: DetectionResult) => {
    setCurrentDetection(result);

    if (result.hasFace && result.dominantEmotion) {
      // Set high-stability stabilized mood for sample
      const stableResult: StabilizedMood = {
        hasFace: true,
        dominantEmotion: result.dominantEmotion,
        confidence: result.confidence,
        stabilityScore: 95,
        stabilityLabel: 'High',
        allExpressions: result.allExpressions,
        sampleCount: 1,
        lastUpdated: Date.now(),
        rawTopEmotion: result.dominantEmotion,
        rawTopProbability: result.confidence
      };
      setStabilizedMood(stableResult);

      const emotion = result.dominantEmotion;
      const config = EMOTION_CONFIGS[emotion];
      const newItem: EmotionHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        emotion,
        confidence: result.confidence,
        timestamp: new Date(),
        serviceResponse: config.response
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
    } else {
      setStabilizedMood(null);
    }
  }, []);

  // Clear History
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    lastLoggedEmotionRef.current = null;
  }, []);

  // Smooth scroll into main AI workspace
  const handleEnterExperience = useCallback(() => {
    const workspace = document.getElementById('ai-workspace');
    if (workspace) {
      workspace.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Dynamic ambient mood atmosphere color calculation (Requirement 6)
  const activeEmotion = stabilizedMood?.dominantEmotion || null;
  let ambientMoodGlow = 'rgba(99, 102, 241, 0.08)'; // Default balanced indigo
  if (activeEmotion === 'happy') {
    ambientMoodGlow = 'rgba(16, 185, 129, 0.12)'; // Warm positive emerald/amber
  } else if (activeEmotion === 'sad') {
    ambientMoodGlow = 'rgba(59, 130, 246, 0.12)'; // Soft calm blue
  } else if (activeEmotion === 'angry') {
    ambientMoodGlow = 'rgba(239, 68, 68, 0.13)'; // Subtle red/purple intensity
  } else if (activeEmotion === 'surprised') {
    ambientMoodGlow = 'rgba(245, 158, 11, 0.12)'; // Bright energetic amber
  } else if (activeEmotion === 'fearful') {
    ambientMoodGlow = 'rgba(139, 92, 246, 0.12)'; // Cool dramatic violet
  } else if (activeEmotion === 'disgusted') {
    ambientMoodGlow = 'rgba(249, 115, 22, 0.12)'; // Muted orange highlight
  }

  // Dynamic color for Antigravity particles (defaults to #552aff, subtly adapts to mood)
  let antigravityColor = '#552aff';
  if (activeEmotion === 'happy') {
    antigravityColor = '#10b981';
  } else if (activeEmotion === 'sad') {
    antigravityColor = '#3b82f6';
  } else if (activeEmotion === 'angry') {
    antigravityColor = '#ef4444';
  } else if (activeEmotion === 'surprised') {
    antigravityColor = '#f59e0b';
  } else if (activeEmotion === 'fearful') {
    antigravityColor = '#8b5cf6';
  } else if (activeEmotion === 'disgusted') {
    antigravityColor = '#f97316';
  }

  return (
    <div className="min-h-screen bg-[#050609] text-slate-200 flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Smooth Spring Physics Cursor */}
      <SmoothCursor />

      {/* Dynamic Ambient Atmosphere Glow (Softly shifts with detected emotion) */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          background: `radial-gradient(circle at 50% 25%, ${ambientMoodGlow} 0%, transparent 65%)`
        }}
      />

      {/* Full-App Antigravity 3D Particle Field (React Bits Component) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <Antigravity
          count={500}
          magnetRadius={11}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={5}
          particleSize={1.5}
          lerpSpeed={0.11}
          color={antigravityColor}
          autoAnimate={true}
          particleVariance={1}
          depthFactor={2.4}
          pulseSpeed={7.2}
          fieldStrength={20}
        />
      </div>

      {/* Futuristic Header Navigation */}
      <Header
        isStreaming={isStreaming}
        modelsReady={modelsReady}
        activeEmotion={activeEmotion}
      />

      {/* Hero Landing Experience (Requirement 1) */}
      <HeroSection
        onEnterExperience={handleEnterExperience}
        isStreaming={isStreaming}
        modelsReady={modelsReady}
        activeEmotion={activeEmotion}
        onStartCamera={handleStartCamera}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">
        {/* Model Initialization Error Notification */}
        {modelError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-sm backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-200">Neural Model Initialization Error</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{modelError}</p>
            </div>
          </div>
        )}

        {/* Main AI Workspace Section (Requirement 5) */}
        <section id="ai-workspace" className="space-y-6 scroll-mt-20">
          {/* Workspace Title & Live Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>OPTIMUS PRIME AI WORKSPACE</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                  Live Perception
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time optical emotion recognition paired with adaptive Gemini conversation
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <Shield className="w-3.5 h-3.5" />
                100% In-Browser Vision
              </span>
            </div>
          </div>

          {/* Two-Column Workspace Layout (Left: Live Emotion Camera, Right: Optimus Prime AI Chat) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Emotion Camera + Mood Cards + Test Presets */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-6">
              {/* Live Emotion Camera */}
              <WebcamPanel
                isStreaming={isStreaming}
                stream={mediaStream}
                modelsReady={modelsReady}
                onStartCamera={handleStartCamera}
                onStopCamera={handleStopCamera}
                onDetectionUpdate={handleDetectionUpdate}
                cameraError={cameraError}
                onRetryPermission={handleStartCamera}
                stabilizedMood={stabilizedMood}
              />

              {/* Stabilized Mood Breakdown Card */}
              <CurrentEmotionCard
                stabilizedMood={stabilizedMood}
                isStreaming={isStreaming}
              />

              {/* Preset Facial Test Portraits */}
              <SampleTester
                modelsReady={modelsReady}
                onSampleDetection={handleSampleDetection}
                disabled={isStreaming}
              />
            </div>

            {/* Right Column: Optimus Prime AI Conversational Companion */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6">
              <ChatAssistant
                stabilizedMood={stabilizedMood}
                isStreaming={isStreaming}
                modelsReady={modelsReady}
              />
            </div>
          </div>
        </section>

        {/* About: End-To-End Cognitive Architecture Flow (Requirement 11) */}
        <HowItWorks />

        {/* Emotion & Interaction History (Requirement 12) */}
        <EmotionHistory
          history={history}
          onClearHistory={handleClearHistory}
        />
      </main>

      {/* Futuristic Footer */}
      <footer className="border-t border-white/10 bg-[#050609]/95 py-6 mt-16 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">OPTIMUS PRIME</span>
            <span className="text-white/20">•</span>
            <span className="text-slate-400">Emotion-Aware AI Companion</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Edge Neural Model (Face-API)</span>
            <span className="text-white/20">•</span>
            <span>Gemini 2.5 Intelligence</span>
            <span className="text-white/20">•</span>
            <span className="text-emerald-400 font-medium">100% Private Vision</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
