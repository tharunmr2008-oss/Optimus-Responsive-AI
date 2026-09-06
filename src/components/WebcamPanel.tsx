import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  AlertTriangle,
  RefreshCw,
  Eye,
  UserCheck,
  Zap,
  Info,
  Sliders
} from 'lucide-react';
import { DetectionResult, EmotionName } from '../types';
import { StabilizedMood } from '../utils/emotionStabilizer';
import { detectEmotionFromVideo } from '../utils/detector';
import { EMOTION_CONFIGS } from '../constants/emotions';

interface WebcamPanelProps {
  isStreaming: boolean;
  stream: MediaStream | null;
  modelsReady: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onDetectionUpdate: (result: DetectionResult) => void;
  cameraError: string | null;
  onRetryPermission: () => void;
  onSelectSampleImage?: (url: string) => void;
  stabilizedMood?: StabilizedMood | null;
}

export function WebcamPanel({
  isStreaming,
  stream,
  modelsReady,
  onStartCamera,
  onStopCamera,
  onDetectionUpdate,
  cameraError,
  onRetryPermission,
  stabilizedMood
}: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stabilizedMoodRef = useRef<StabilizedMood | null>(stabilizedMood || null);
  useEffect(() => {
    stabilizedMoodRef.current = stabilizedMood || null;
  }, [stabilizedMood]);

  const [isMirrored, setIsMirrored] = useState(true);
  const [hasFace, setHasFace] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastDetectionResult, setLastDetectionResult] = useState<DetectionResult | null>(null);

  const requestRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(Date.now());
  const isDetectingRef = useRef<boolean>(false);

  // FPS counter
  const updateFps = useCallback(() => {
    frameCountRef.current++;
    const now = Date.now();
    if (now - fpsTimerRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      fpsTimerRef.current = now;
    }
  }, []);

  // Draw detection box & emotion badge on canvas
  const drawOverlay = useCallback(
    (result: DetectionResult, width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ensure canvas internal pixel size matches video frame size
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      if (!result.hasFace || !result.box || !result.dominantEmotion) {
        return;
      }

      const { box } = result;
      const dominantEmotion = (stabilizedMoodRef.current?.hasFace && stabilizedMoodRef.current.dominantEmotion)
        ? stabilizedMoodRef.current.dominantEmotion
        : result.dominantEmotion;
      const confidence = (stabilizedMoodRef.current?.hasFace && stabilizedMoodRef.current.dominantEmotion)
        ? stabilizedMoodRef.current.confidence
        : result.confidence;
      const config = EMOTION_CONFIGS[dominantEmotion];
      const strokeColor = config?.color || '#3B82F6';

      // Calculate mirrored x coordinate if mirror mode is enabled
      const drawX = isMirrored ? width - (box.x + box.width) : box.x;
      const drawY = box.y;
      const drawW = box.width;
      const drawH = box.height;

      // Draw bounding box with rounded tech corners
      const cornerLength = Math.min(drawW, drawH) * 0.22;
      const lineWidth = Math.max(3, Math.round(width / 220));

      ctx.save();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 14;

      // Semi-transparent fill inside face box
      ctx.fillStyle = `${strokeColor}16`;
      ctx.fillRect(drawX, drawY, drawW, drawH);

      // Outer border box (thin)
      ctx.strokeStyle = `${strokeColor}55`;
      ctx.strokeRect(drawX, drawY, drawW, drawH);

      // Highlighted Corner Brackets
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth + 1;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + cornerLength);
      ctx.lineTo(drawX, drawY);
      ctx.lineTo(drawX + cornerLength, drawY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(drawX + drawW - cornerLength, drawY);
      ctx.lineTo(drawX + drawW, drawY);
      ctx.lineTo(drawX + drawW, drawY + cornerLength);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + drawH - cornerLength);
      ctx.lineTo(drawX, drawY + drawH);
      ctx.lineTo(drawX + cornerLength, drawY + drawH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(drawX + drawW - cornerLength, drawY + drawH);
      ctx.lineTo(drawX + drawW, drawY + drawH);
      ctx.lineTo(drawX + drawW, drawY + drawH - cornerLength);
      ctx.stroke();

      // Floating Emotion Tag Badge
      const badgeText = `${config.emoji} ${config.name.toUpperCase()}  ${confidence}%`;
      const fontSize = Math.max(13, Math.min(18, Math.round(drawW * 0.085)));
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
      const textMetrics = ctx.measureText(badgeText);
      const textWidth = textMetrics.width;
      const badgeHeight = fontSize * 1.8;
      const badgePaddingX = 10;
      const badgeTotalWidth = textWidth + badgePaddingX * 2;

      let badgeY = drawY - badgeHeight - 6;
      if (badgeY < 10) {
        badgeY = drawY + 8; // place inside if close to top edge
      }
      let badgeX = drawX + (drawW - badgeTotalWidth) / 2;
      // Keep badge within frame
      if (badgeX < 6) badgeX = 6;
      if (badgeX + badgeTotalWidth > width - 6) badgeX = width - badgeTotalWidth - 6;

      // Badge background (deep immersive HUD pill)
      ctx.fillStyle = '#08090d';
      ctx.beginPath();
      const radius = 6;
      ctx.roundRect(badgeX, badgeY, badgeTotalWidth, badgeHeight, [radius]);
      ctx.fill();

      // Badge accent border with subtle glow
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Badge text
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgePaddingX, badgeY + badgeHeight / 2);

      ctx.restore();
    },
    [isMirrored]
  );

  // Clear canvas overlay
  const clearOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Continuous emotion detection loop
  useEffect(() => {
    if (!isStreaming || !modelsReady) {
      clearOverlay();
      setHasFace(false);
      return;
    }

    let isMounted = true;

    const detectLoop = async () => {
      if (!isMounted) return;

      const video = videoRef.current;
      if (
        video &&
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended &&
        !isDetectingRef.current
      ) {
        const now = Date.now();
        // Limit detection rate to every ~120ms (around 8 FPS) for optimal balance of responsiveness and low CPU load
        if (now - lastDetectionTimeRef.current >= 110) {
          isDetectingRef.current = true;
          lastDetectionTimeRef.current = now;

          try {
            const result = await detectEmotionFromVideo(video, {
              inputSize: 224,
              scoreThreshold: 0.35
            });

            if (isMounted) {
              setHasFace(result.hasFace);
              setLastDetectionResult(result);
              onDetectionUpdate(result);
              updateFps();

              if (result.hasFace && video.videoWidth > 0) {
                drawOverlay(result, video.videoWidth, video.videoHeight);
              } else {
                clearOverlay();
              }
            }
          } catch (err) {
            console.error('Detection frame error in loop:', err);
          } finally {
            isDetectingRef.current = false;
          }
        }
      }

      if (isMounted) {
        requestRef.current = requestAnimationFrame(detectLoop);
      }
    };

    requestRef.current = requestAnimationFrame(detectLoop);

    return () => {
      isMounted = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      clearOverlay();
    };
  }, [isStreaming, modelsReady, onDetectionUpdate, drawOverlay, clearOverlay, updateFps]);

  // Handle video element stream assignment
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && isStreaming) {
      video.srcObject = stream;
      video.play().catch((err) => {
        console.error('Error playing webcam video:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream, isStreaming]);

  const activeEmotionName = stabilizedMood?.dominantEmotion || null;
  const activeEmotionConfig = activeEmotionName ? EMOTION_CONFIGS[activeEmotionName] : null;
  const activeConfidence = stabilizedMood?.confidence || 0;
  const activeStability = stabilizedMood?.stabilityLabel || (hasFace ? 'Scanning' : 'No Face');

  return (
    <div
      id="emotion-camera"
      className="glass-panel-glow rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 relative"
      style={{
        boxShadow: isStreaming && activeEmotionConfig
          ? `0 0 40px -15px ${activeEmotionConfig.color}40, 0 20px 25px -5px rgba(0, 0, 0, 0.5)`
          : '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Panel Top Bar */}
      <div className="px-5 py-3.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">LIVE CAMERA</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isStreaming
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                {isStreaming ? 'STATUS: LIVE' : 'STATUS: STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Continuous optical emotion perception</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mirror Mode Toggle */}
          <button
            id="toggle-mirror-btn"
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            title={isMirrored ? 'Mirror View: Enabled' : 'Mirror View: Disabled'}
            className={`btn-interactive px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              isMirrored
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mirror</span>
          </button>

          {/* Start / Stop Camera Buttons */}
          {!isStreaming ? (
            <button
              id="start-camera-btn"
              type="button"
              onClick={onStartCamera}
              disabled={!modelsReady}
              className="btn-interactive inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/30 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              id="stop-camera-btn"
              type="button"
              onClick={onStopCamera}
              className="btn-interactive inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.25)] cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video & Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden select-none"
      >
        {/* Immersive Background Gradients & Scanline Reticle */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,33,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

        {/* HTML5 Live Video Element */}
        <video
          ref={videoRef}
          id="webcam-video"
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? '-scale-x-100' : 'scale-x-100'
          } ${isStreaming ? 'block' : 'hidden'}`}
        />

        {/* Bounding Box Canvas Overlay */}
        <canvas
          ref={canvasRef}
          id="detection-canvas"
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
            isStreaming ? 'block' : 'hidden'
          }`}
        />

        {/* Video Overlays & Information Badges */}
        {isStreaming && (
          <>
            {/* Top Left Live Stats */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md text-slate-200 px-3 py-1 rounded-lg text-xs font-mono border border-white/10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="font-bold tracking-wider text-emerald-400">LIVE</span>
              <span className="text-white/20">|</span>
              <span className="text-slate-300 font-mono">{fps} FPS</span>
            </div>

            {/* Face Status Pill */}
            <div className="absolute top-3.5 right-3.5 z-20">
              {hasFace ? (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg text-xs font-medium shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="tracking-wide">FACE LOCKED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-medium animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="tracking-wide">SCANNING...</span>
                </div>
              )}
            </div>

            {/* Bottom Live Emotion HUD (Requirement 5) */}
            <div className="absolute bottom-3.5 inset-x-3.5 z-20 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: activeEmotionConfig ? `${activeEmotionConfig.color}25` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeEmotionConfig ? activeEmotionConfig.color : 'rgba(255,255,255,0.1)'}`
                  }}
                >
                  <span>{activeEmotionConfig?.emoji || (hasFace ? '🔍' : '👤')}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Current Mood
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                      {activeStability}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white capitalize truncate transition-all duration-200">
                    {activeEmotionName || (hasFace ? 'Analyzing...' : 'Waiting for face')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Confidence
                  </span>
                  <span
                    className="text-sm font-extrabold font-mono transition-all duration-200"
                    style={{ color: activeEmotionConfig ? activeEmotionConfig.color : '#818cf8' }}
                  >
                    {activeConfidence}%
                  </span>
                </div>
                <div className="hidden sm:block h-7 w-px bg-white/10" />
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Mood Status
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {stabilizedMood?.stabilityScore && stabilizedMood.stabilityScore >= 50 ? 'Stable' : 'Tracking'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Camera Inactive State */}
        {!isStreaming && !cameraError && (
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 max-w-md z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4 shadow-[0_0_20px_rgba(79,70,229,0.15)]">
              <Camera className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5 tracking-tight">
              Customer Camera Feed Paused
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Click <strong className="text-white">Start Camera</strong> to capture live customer video, track facial expressions, and get instant empathetic service guidance.
            </p>
            <button
              id="empty-start-camera-btn"
              type="button"
              onClick={onStartCamera}
              disabled={!modelsReady}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-[0_0_25px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>{modelsReady ? 'Start Camera Stream' : 'Initializing Models...'}</span>
            </button>
            <span className="text-[11px] text-slate-500 mt-3.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              Processed 100% locally in your browser. Video is never uploaded.
            </span>
          </div>
        )}

        {/* Camera Permission / Device Error State */}
        {cameraError && !isStreaming && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md z-20 bg-[#0c0e17]/95 border border-rose-500/30 rounded-2xl m-4 backdrop-blur-md shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Camera Access Required
            </h3>
            <p className="text-xs text-rose-200 mb-4 leading-relaxed font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50">
              {cameraError}
            </p>
            <div className="text-xs text-slate-300 text-left space-y-1.5 mb-5 bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-semibold text-white flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" /> Troubleshooting Steps:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Check browser address bar for camera permission icon (🎥).</li>
                <li>Ensure no other app (Zoom, Teams) is using the webcam.</li>
                <li>If prompted by the browser, select <strong className="text-white">Allow</strong>.</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                id="retry-permission-btn"
                type="button"
                onClick={onRetryPermission}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel Bottom Footer Bar */}
      <div className="px-5 py-2.5 bg-[#0c0e17] border-t border-white/10 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1]" />
          <span>Model: <strong className="text-slate-200 font-medium">TinyFaceDetector + FaceExpressionNet</strong></span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>Resolution: <strong className="text-slate-200 font-medium">{isStreaming ? 'Webcam Native' : 'Standby'}</strong></span>
          <span>Privacy: <strong className="text-emerald-400 font-medium">100% Client-side</strong></span>
        </div>
      </div>
    </div>
  );
}

// Expose a ref method for the parent to assign MediaStream
export function attachVideoStream(videoEl: HTMLVideoElement | null, stream: MediaStream) {
  if (videoEl) {
    videoEl.srcObject = stream;
    videoEl.play().catch((err) => console.error('Error playing video stream:', err));
  }
}
