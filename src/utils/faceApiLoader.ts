import * as faceapi from '@vladmandic/face-api';

let modelsLoadedPromise: Promise<boolean> | null = null;
let modelsLoaded = false;
let modelLoadError: string | null = null;

export async function loadFaceApiModels(
  onProgress?: (status: string) => void
): Promise<boolean> {
  if (modelsLoaded) return true;
  if (modelsLoadedPromise) return modelsLoadedPromise;

  modelsLoadedPromise = (async () => {
    try {
      onProgress?.('Loading neural network models...');

      // Primary local path from /public/models
      const localModelPath = '/models';
      const cdnModelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

      let success = false;

      // Attempt local load first
      try {
        onProgress?.('Loading detector weights...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(localModelPath),
          faceapi.nets.faceExpressionNet.loadFromUri(localModelPath)
        ]);
        success = true;
      } catch (err) {
        console.warn('Local model loading failed, trying CDN fallback...', err);
        onProgress?.('Retrying model load from CDN...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(cdnModelPath),
          faceapi.nets.faceExpressionNet.loadFromUri(cdnModelPath)
        ]);
        success = true;
      }

      if (success) {
        modelsLoaded = true;
        onProgress?.('Models ready');
        return true;
      }
      throw new Error('Failed to load emotion recognition models');
    } catch (err: any) {
      console.error('FaceAPI model loading error:', err);
      modelLoadError = err?.message || 'Error loading face models';
      modelsLoadedPromise = null;
      throw err;
    }
  })();

  return modelsLoadedPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

export function getModelLoadError(): string | null {
  return modelLoadError;
}

export { faceapi };
