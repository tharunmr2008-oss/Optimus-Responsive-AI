export type EmotionName = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'fearful' 
  | 'surprised' 
  | 'disgusted' 
  | 'neutral';

export interface EmotionScore {
  emotion: EmotionName;
  score: number; // 0 to 1
  percentage: number; // 0 to 100
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionResult {
  hasFace: boolean;
  box: FaceBoundingBox | null;
  dominantEmotion: EmotionName | null;
  confidence: number; // 0 to 100
  allExpressions: Record<EmotionName, number>;
  timestamp: number;
}

export interface EmotionHistoryItem {
  id: string;
  emotion: EmotionName;
  confidence: number;
  timestamp: Date;
  serviceResponse: string;
}

export interface EmotionServiceConfig {
  name: EmotionName;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  response: string;
  agentTone: string;
  recommendedAction: string;
  suggestedFollowUp: string[];
}

export interface StabilizedMood {
  hasFace: boolean;
  dominantEmotion: EmotionName | null;
  confidence: number; // 0 to 100
  stabilityScore: number; // 0 to 100
  stabilityLabel: 'High' | 'Moderate' | 'Transitioning' | 'No Face';
  allExpressions: Record<EmotionName, number>;
  sampleCount: number;
  lastUpdated: number;
  rawTopEmotion?: EmotionName | null;
  rawTopProbability?: number; // 0 to 100
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  moodAtTime?: EmotionName | null;
  confidenceAtTime?: number;
  stabilityAtTime?: string;
  toneHint?: string;
  isError?: boolean;
}
