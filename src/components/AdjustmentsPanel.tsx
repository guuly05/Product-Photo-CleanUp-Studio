import React, { useState } from 'react';
import {
  Sliders,
  Sun,
  Contrast,
  Palette,
  Droplet,
  Layers,
  RotateCcw,
  Undo2,
  Redo2,
  Sparkles,
  Maximize,
  Box,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Stamp,
  Type,
  Grid,
  Maximize2,
  Crop,
  Target,
  ShoppingBag,
  Share2,
  Monitor,
  Check
} from 'lucide-react';
import { ImageAdjustments, BackgroundSettings, ShadowSettings, WatermarkSettings, WatermarkPosition, LightingAnalysisResult } from '../types';
import { CROP_ASPECT_PRESETS, CropAspectPreset, generateSmartCrop } from '../utils/smartCrop';

interface AdjustmentsPanelProps {
  adjustments: ImageAdjustments;
  onChangeAdjustments: (adjustments: ImageAdjustments) => void;
  background: BackgroundSettings;
  onChangeBackground: (bg: BackgroundSettings) => void;
  shadow: ShadowSettings;
  onChangeShadow: (shadow: ShadowSettings) => void;
  watermark: WatermarkSettings;
  onChangeWatermark: (watermark: WatermarkSettings) => void;
  onResetTools: () => void;
  onAnalyzeLighting: () => void;
  isAnalyzingLighting: boolean;
  lastLightingAnalysis: LightingAnalysisResult | null;
  onApplyRecommendedPrompt: (prompt: string) => void;
  currentImageUrl?: string;
  onApplyCrop?: (croppedUrl: string, label: string) => void;
  canUndoTool?: boolean;
  canRedoTool?: boolean;
  onUndoTool?: () => void;
  onRedoTool?: () => void;
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  adjustments,
  onChangeAdjustments,
  background,
  onChangeBackground,
  shadow,
  onChangeShadow,
  watermark,
  onChangeWatermark,
  onResetTools,
  onAnalyzeLighting,
  isAnalyzingLighting,
  lastLightingAnalysis,
  onApplyRecommendedPrompt,
  currentImageUrl,
  onApplyCrop,
  canUndoTool = false,
  canRedoTool = false,
  onUndoTool,
  onRedoTool,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<CropAspectPreset>(CROP_ASPECT_PRESETS[0]);
  const [autoCenterProduct, setAutoCenterProduct] = useState<boolean>(true);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropSuccessMessage, setCropSuccessMessage] = useState<string | null>(null);

  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: value,
    });
  };

  const handleShadowChange = (key: keyof ShadowSettings, value: any) => {
    onChangeShadow({
      ...shadow,
      [key]: value,
    });
  };

  const handleWatermarkChange = (key: keyof WatermarkSettings, value: any) => {
    onChangeWatermark({
      ...watermark,
      [key]: value,
    });
  };

  const handleExecuteCrop = async () => {
    if (!currentImageUrl || !onApplyCrop) return;
    setIsCropping(true);
    try {
      const croppedUrl = await generateSmartCrop(
        currentImageUrl,
        selectedPreset.ratio,
        autoCenterProduct
      );
      onApplyCrop(croppedUrl, `Smart Crop ${selectedPreset.aspectStr}`);
      setCropSuccessMessage(`Cropped to ${selectedPreset.name}!`);
      setTimeout(() => setCropSuccessMessage(null), 2500);
    } catch (err) {
      console.error('Smart Crop failed:', err);
    } finally {
      setIsCropping(false);
    }
  };

  const watermarkPresets = ['CLEANSNAP AI', 'OFFICIAL BRAND', 'CONFIDENTIAL', 'SAMPLE ONLY'];
  const watermarkPositions: { id: WatermarkPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div id="tour-adjustments-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 text-slate-200">
      
      {/* Title & Undo/Redo/Reset Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Studio Post-Processing
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tool Undo / Redo buttons */}
          <div className="flex items-center space-x-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={onUndoTool}
              disabled={!canUndoTool}
              className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
              title="Undo adjustment (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedoTool}
              disabled={!canRedoTool}
              className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
              title="Redo adjustment (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onResetTools}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition px-2 py-1 rounded bg-slate-950 border border-slate-800"
            title="Reset tools to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* AI Studio Lighting Analyzer Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI Studio Lighting Analyzer</span>
          </div>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono">
            Gemini AI
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Analyze photo exposure, shadow direction, and contrast to apply optimal studio settings automatically.
        </p>

        <button
          onClick={onAnalyzeLighting}
          disabled={isAnalyzingLighting}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
        >
          {isAnalyzingLighting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>Analyzing Photo Lighting...</span>
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Analyze & Auto-Set Optimal Lighting</span>
            </>
          )}
        </button>

        {lastLightingAnalysis && (
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 mt-2">
            <div className="text-[11px] text-slate-300 font-medium flex items-start space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">AI Assessment: </span>
                <span>{lastLightingAnalysis.lightingAssessment}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex flex-wrap gap-1.5 pt-1">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                Brightness: {lastLightingAnalysis.brightness > 0 ? `+${lastLightingAnalysis.brightness}` : lastLightingAnalysis.brightness}
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                Contrast: {lastLightingAnalysis.contrast > 0 ? `+${lastLightingAnalysis.contrast}` : lastLightingAnalysis.contrast}
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                Shadow: {lastLightingAnalysis.shadow.opacity}% opacity
              </span>
            </div>

            {lastLightingAnalysis.recommendedPrompt && (
              <button
                onClick={() => onApplyRecommendedPrompt(lastLightingAnalysis.recommendedPrompt)}
                className="w-full mt-1 py-1.5 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold rounded-lg border border-indigo-500/30 transition flex items-center justify-between group"
              >
                <span className="truncate mr-1">Prompt: "{lastLightingAnalysis.recommendedPrompt}"</span>
                <ArrowRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Background Fill & Swatches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>Background Fill</span>
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-mono">
            {background.mode}
          </span>
        </div>

        {/* Swatches */}
        <div className="grid grid-cols-6 gap-2">
          
          {/* Original/Transparent */}
          <button
            onClick={() => onChangeBackground({ mode: 'original', color: '' })}
            className={`h-8 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold ${
              background.mode === 'original' ? 'border-indigo-500 bg-slate-800' : 'border-slate-800 bg-slate-950'
            }`}
            title="Keep Original / AI Backdrop"
          >
            Auto
          </button>

          {/* Transparent Grid */}
          <button
            onClick={() => onChangeBackground({ mode: 'transparent', color: '' })}
            className={`h-8 rounded-lg border-2 relative overflow-hidden ${
              background.mode === 'transparent' ? 'border-indigo-500' : 'border-slate-800'
            }`}
            style={{
              backgroundImage:
                'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
              backgroundSize: '10px 10px',
              backgroundColor: '#f1f5f9',
            }}
            title="Transparent Cutout"
          />

          {/* Pure White #FFFFFF */}
          <button
            onClick={() => onChangeBackground({ mode: 'color', color: '#FFFFFF' })}
            className={`h-8 rounded-lg border-2 bg-white ${
              background.mode === 'color' && background.color === '#FFFFFF' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700'
            }`}
            title="Amazon Studio White (#FFFFFF)"
          />

          {/* Light Gray #F1F5F9 */}
          <button
            onClick={() => onChangeBackground({ mode: 'color', color: '#F1F5F9' })}
            className={`h-8 rounded-lg border-2 bg-slate-200 ${
              background.mode === 'color' && background.color === '#F1F5F9' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700'
            }`}
            title="Shopify Light Gray (#F1F5F9)"
          />

          {/* Warm Sand #F5F2EB */}
          <button
            onClick={() => onChangeBackground({ mode: 'color', color: '#F5F2EB' })}
            className={`h-8 rounded-lg border-2 ${
              background.mode === 'color' && background.color === '#F5F2EB' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700'
            }`}
            style={{ backgroundColor: '#F5F2EB' }}
            title="Warm Sand Beige (#F5F2EB)"
          />

          {/* Dark Charcoal #1E293B */}
          <button
            onClick={() => onChangeBackground({ mode: 'color', color: '#0F172A' })}
            className={`h-8 rounded-lg border-2 bg-slate-900 ${
              background.mode === 'color' && background.color === '#0F172A' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700'
            }`}
            title="Dark Luxury (#0F172A)"
          />
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="color"
            value={background.color || '#ffffff'}
            onChange={(e) => onChangeBackground({ mode: 'color', color: e.target.value })}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer"
          />
          <span className="text-xs text-slate-400 font-mono">
            Custom Hex Fill: {background.color || 'None'}
          </span>
        </div>
      </div>

      {/* Ground Contact Shadow Generator */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shadow.enabled}
              onChange={(e) => handleShadowChange('enabled', e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span>Contact Ground Shadow</span>
          </label>
        </div>

        {shadow.enabled && (
          <div className="space-y-3 pl-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Shadow Opacity</span>
                <span className="font-mono">{shadow.opacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={shadow.opacity}
                onChange={(e) => handleShadowChange('opacity', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Shadow Softness / Blur</span>
                <span className="font-mono">{shadow.blur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={shadow.blur}
                onChange={(e) => handleShadowChange('blur', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Vertical Distance</span>
                <span className="font-mono">{shadow.offsetY}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={shadow.offsetY}
                onChange={(e) => handleShadowChange('offsetY', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Adjustments Sliders */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Sun className="w-3.5 h-3.5 text-indigo-400" />
            <span>Color & Exposure Controls</span>
          </span>

          {/* One-Click AI Enhance Toggle Button */}
          <button
            type="button"
            onClick={onAnalyzeLighting}
            disabled={isAnalyzingLighting}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 border ${
              lastLightingAnalysis
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
            }`}
            title="One-Click AI Auto-Enhance contrast, brightness & saturation"
          >
            {isAnalyzingLighting ? (
              <div className="w-3 h-3 rounded-full border-2 border-indigo-400/20 border-t-indigo-400 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isAnalyzingLighting ? 'Enhancing...' : lastLightingAnalysis ? 'AI Enhanced' : 'One-Click Enhance'}</span>
          </button>
        </div>

        {/* Brightness */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Brightness</span>
            <span className="font-mono">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={adjustments.brightness}
            onChange={(e) => handleAdjustmentChange('brightness', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Contrast</span>
            <span className="font-mono">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={adjustments.contrast}
            onChange={(e) => handleAdjustmentChange('contrast', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Saturation</span>
            <span className="font-mono">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={adjustments.saturation}
            onChange={(e) => handleAdjustmentChange('saturation', Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

      </div>

      {/* Smart Crop & Aspect Ratios Section */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crop className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Smart Aspect Ratio Crop
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Auto-Framing
          </span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
          
          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {CROP_ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset)}
                className={`py-2 px-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                  selectedPreset.id === preset.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                    : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-indigo-300">{preset.aspectStr}</span>
                  {selectedPreset.id === preset.id && (
                    <Check className="w-3 h-3 text-indigo-400" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-300 mt-1 truncate">{preset.name}</span>
                <span className="text-[9px] text-slate-500 truncate">{preset.category}</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
            {selectedPreset.description}
          </p>

          {/* Center of Mass Framing Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={autoCenterProduct}
                onChange={(e) => setAutoCenterProduct(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Center of Mass Auto-Focus</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {autoCenterProduct ? 'Subject Centered' : 'Geometric Center'}
            </span>
          </div>

          {/* Execute Crop Action Button */}
          <button
            type="button"
            onClick={handleExecuteCrop}
            disabled={isCropping || !currentImageUrl}
            className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-2"
          >
            {isCropping ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Computing Product Center & Crop...</span>
              </>
            ) : (
              <>
                <Crop className="w-3.5 h-3.5" />
                <span>Apply {selectedPreset.aspectStr} Smart Crop</span>
              </>
            )}
          </button>

          {cropSuccessMessage && (
            <p className="text-[11px] font-semibold text-emerald-400 text-center animate-in fade-in duration-200">
              ✓ {cropSuccessMessage}
            </p>
          )}

        </div>
      </div>

      {/* Watermark Branding Section */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={watermark.enabled}
              onChange={(e) => handleWatermarkChange('enabled', e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <Stamp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Watermark & Branding Overlay</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {watermark.enabled ? 'Active' : 'Off'}
          </span>
        </div>

        {watermark.enabled && (
          <div className="space-y-3 pl-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            
            {/* Custom Text Input */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center space-x-1">
                  <Type className="w-3 h-3 text-indigo-400" />
                  <span>Watermark Text / Brand</span>
                </span>
              </div>
              <input
                type="text"
                value={watermark.text}
                onChange={(e) => handleWatermarkChange('text', e.target.value)}
                placeholder="Enter brand name..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {/* Quick Text Presets */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {watermarkPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleWatermarkChange('text', preset)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Picker Grid */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="flex items-center space-x-1">
                  <Grid className="w-3 h-3 text-indigo-400" />
                  <span>Position</span>
                </span>
                <span className="font-mono text-[10px] text-indigo-300 capitalize">
                  {watermark.position.replace('-', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleWatermarkChange('position', 'top-left')}
                  className={`py-1 px-2 text-[10px] font-medium rounded transition text-center ${
                    watermark.position === 'top-left' ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Top Left
                </button>
                <div className="flex items-center justify-center text-[10px] text-slate-600">--</div>
                <button
                  type="button"
                  onClick={() => handleWatermarkChange('position', 'top-right')}
                  className={`py-1 px-2 text-[10px] font-medium rounded transition text-center ${
                    watermark.position === 'top-right' ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Top Right
                </button>

                <div className="col-span-3 flex justify-center my-0.5">
                  <button
                    type="button"
                    onClick={() => handleWatermarkChange('position', 'center')}
                    className={`py-1 px-4 text-[10px] font-medium rounded transition text-center ${
                      watermark.position === 'center' ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Center
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleWatermarkChange('position', 'bottom-left')}
                  className={`py-1 px-2 text-[10px] font-medium rounded transition text-center ${
                    watermark.position === 'bottom-left' ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Bottom Left
                </button>
                <div className="flex items-center justify-center text-[10px] text-slate-600">--</div>
                <button
                  type="button"
                  onClick={() => handleWatermarkChange('position', 'bottom-right')}
                  className={`py-1 px-2 text-[10px] font-medium rounded transition text-center ${
                    watermark.position === 'bottom-right' ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Bottom Right
                </button>
              </div>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{watermark.opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={watermark.opacity}
                onChange={(e) => handleWatermarkChange('opacity', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center space-x-1">
                  <Maximize2 className="w-3 h-3 text-indigo-400" />
                  <span>Size Scale</span>
                </span>
                <span className="font-mono">{watermark.scale}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                value={watermark.scale}
                onChange={(e) => handleWatermarkChange('scale', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Watermark Text Color Swatches */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Color</span>
                <span className="font-mono uppercase">{watermark.color}</span>
              </div>
              <div className="flex items-center space-x-2">
                {[
                  { color: '#FFFFFF', name: 'White' },
                  { color: '#000000', name: 'Black' },
                  { color: '#F59E0B', name: 'Gold' },
                  { color: '#6366F1', name: 'Indigo' },
                  { color: '#94A3B8', name: 'Slate' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => handleWatermarkChange('color', c.color)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      watermark.color?.toLowerCase() === c.color.toLowerCase() ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-110' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
