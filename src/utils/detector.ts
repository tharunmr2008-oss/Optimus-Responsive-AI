import { faceapi, loadFaceApiModels } from './faceApiLoader';
import { DetectionResult, EmotionName } from '../types';

export interface DetectorOptions {
  inputSize?: number; // default 224 or 320
  scoreThreshold?: number; // default 0.4
}

let detectorOptions: faceapi.TinyFaceDetectorOptions | null = null;

export function getDetectorOptions(size = 224, threshold = 0.4): faceapi.TinyFaceDetectorOptions {
  if (!detectorOptions || detectorOptions.inputSize !== size || detectorOptions.scoreThreshold !== threshold) {
    detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: size,
      scoreThreshold: threshold
    });
  }
  return detectorOptions;
}

export async function detectEmotionFromVideo(
  video: HTMLVideoElement,
  options: DetectorOptions = {}
): Promise<DetectionResult> {
  const emptyResult: DetectionResult = {
    hasFace: false,
    box: null,
    dominantEmotion: null,
    confidence: 0,
    allExpressions: {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      surprised: 0,
      disgusted: 0,
      neutral: 0
    },
    timestamp: Date.now()
  };

  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return emptyResult;
  }

  const opt = getDetectorOptions(options.inputSize || 224, options.scoreThreshold || 0.4);

  try {
    const detection = await faceapi
      .detectSingleFace(video, opt)
      .withFaceExpressions();

    if (!detection) {
      return emptyResult;
    }

    const expressions = detection.expressions;
    const sorted = expressions.asSortedArray();
    const dominant = sorted[0];

    const allExpressions: Record<EmotionName, number> = {
      happy: expressions.happy || 0,
      sad: expressions.sad || 0,
      angry: expressions.angry || 0,
      fearful: expressions.fearful || 0,
      surprised: expressions.surprised || 0,
      disgusted: expressions.disgusted || 0,
      neutral: expressions.neutral || 0
    };

    const box = detection.detection.box;

    return {
      hasFace: true,
      box: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      },
      dominantEmotion: (dominant?.expression as EmotionName) || 'neutral',
      confidence: dominant ? Math.round(dominant.probability * 100) : 0,
      allExpressions,
      timestamp: Date.now()
    };
  } catch (err) {
    console.error('Emotion detection frame error:', err);
    return emptyResult;
  }
}

export async function detectEmotionFromImage(
  image: HTMLImageElement | HTMLCanvasElement,
  options: DetectorOptions = {}
): Promise<DetectionResult> {
  const opt = getDetectorOptions(options.inputSize || 320, options.scoreThreshold || 0.3);
  try {
    const detection = await faceapi
      .detectSingleFace(image, opt)
      .withFaceExpressions();

    if (!detection) {
      return {
        hasFace: false,
        box: null,
        dominantEmotion: null,
        confidence: 0,
        allExpressions: {
          happy: 0,
          sad: 0,
          angry: 0,
          fearful: 0,
          surprised: 0,
          disgusted: 0,
          neutral: 0
        },
        timestamp: Date.now()
      };
    }

    const expressions = detection.expressions;
    const sorted = expressions.asSortedArray();
    const dominant = sorted[0];

    return {
      hasFace: true,
      box: {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height
      },
      dominantEmotion: (dominant?.expression as EmotionName) || 'neutral',
      confidence: dominant ? Math.round(dominant.probability * 100) : 0,
      allExpressions: {
        happy: expressions.happy || 0,
        sad: expressions.sad || 0,
        angry: expressions.angry || 0,
        fearful: expressions.fearful || 0,
        surprised: expressions.surprised || 0,
        disgusted: expressions.disgusted || 0,
        neutral: expressions.neutral || 0
      },
      timestamp: Date.now()
    };
  } catch (err) {
    console.error('Image emotion detection error:', err);
    throw err;
  }
}
