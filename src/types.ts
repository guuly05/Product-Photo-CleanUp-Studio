export interface EditHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  prompt: string;
  label: string;
  type: 'original' | 'ai_edit' | 'adjustment';
  adjustments?: ImageAdjustments;
  background?: BackgroundSettings;
  shadow?: ShadowSettings;
  watermark?: WatermarkSettings;
}

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  position: WatermarkPosition;
  opacity: number; // 10 to 100
  scale: number;   // 50 to 200
  color: string;   // hex string e.g. '#FFFFFF'
}

export interface ImageAdjustments {
  brightness: number; // -100 to 100 (default 0)
  contrast: number;   // -100 to 100 (default 0)
  saturation: number; // -100 to 100 (default 0)
  exposure: number;   // -100 to 100 (default 0)
  sharpness: number;  // 0 to 100 (default 0)
}

export interface BackgroundSettings {
  mode: 'original' | 'color' | 'gradient' | 'transparent';
  color: string;
  gradientStart?: string;
  gradientEnd?: string;
}

export interface ShadowSettings {
  enabled: boolean;
  opacity: number;  // 0 to 100
  blur: number;     // 0 to 50
  offsetY: number;  // 0 to 40
  color: string;
}

export interface SampleProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  suggestedPrompts: string[];
}

export interface PresetInstruction {
  id: string;
  title: string;
  icon: string;
  description: string;
  prompt: string;
  category: 'background' | 'cleanup' | 'ecommerce' | 'aesthetic';
}

export interface LightSourcePoint {
  id: string;
  name: string; // e.g. "Primary Key Light", "Soft Fill Diffuser", "Rim Light"
  type: 'key' | 'fill' | 'rim' | 'ambient' | 'glare';
  xPct: number; // 0 to 100
  yPct: number; // 0 to 100
  intensityPct: number; // 0 to 100
  colorTempK?: number; // e.g. 5600
  description: string;
}

export interface LuminanceHotspot {
  xPct: number;
  yPct: number;
  radiusPct: number;
  intensity: number;
  label: string;
}

export interface LightingAnalysisResult {
  brightness: number; // -50 to 50
  contrast: number;   // -50 to 50
  saturation: number; // -50 to 50
  shadow: {
    enabled: boolean;
    opacity: number;  // 0 to 100
    blur: number;     // 0 to 50
    offsetY: number;  // 0 to 40
  };
  suggestedBackdropColor: string;
  lightingAssessment: string;
  recommendedPrompt: string;
  lightSources?: LightSourcePoint[];
  luminanceHotspots?: LuminanceHotspot[];
  keyLightAngleDeg?: number;
  overallExposureEV?: string;
  uniformityScore?: number;
  glareRisk?: 'Low' | 'Medium' | 'High';
}

export interface SavedSessionData {
  savedAt: number;
  history: EditHistoryItem[];
  historyIndex: number;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  shadow: ShadowSettings;
  watermark: WatermarkSettings;
}

