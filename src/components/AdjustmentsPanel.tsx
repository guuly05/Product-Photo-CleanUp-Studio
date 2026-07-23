import React from 'react';
import {
  Sliders,
  Sun,
  Contrast,
  Palette,
  Droplet,
  Layers,
  RotateCcw,
  Sparkles,
  Maximize,
  Box
} from 'lucide-react';
import { ImageAdjustments, BackgroundSettings, ShadowSettings } from '../types';

interface AdjustmentsPanelProps {
  adjustments: ImageAdjustments;
  onChangeAdjustments: (adjustments: ImageAdjustments) => void;
  background: BackgroundSettings;
  onChangeBackground: (bg: BackgroundSettings) => void;
  shadow: ShadowSettings;
  onChangeShadow: (shadow: ShadowSettings) => void;
  onResetTools: () => void;
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  adjustments,
  onChangeAdjustments,
  background,
  onChangeBackground,
  shadow,
  onChangeShadow,
  onResetTools,
}) => {

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

  return (
    <div id="tour-adjustments-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6 text-slate-200">
      
      {/* Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Studio Post-Processing
          </h3>
        </div>
        <button
          onClick={onResetTools}
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition"
          title="Reset tools to default"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
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
        <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
          <Sun className="w-3.5 h-3.5 text-indigo-400" />
          <span>Color & Exposure Controls</span>
        </span>

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

    </div>
  );
};
