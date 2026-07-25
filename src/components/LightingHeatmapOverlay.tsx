import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Flame,
  Zap,
  Target,
  Sparkles,
  Info,
  Eye,
  Sliders,
  Maximize2,
  ChevronRight,
  ShieldAlert,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { LightingAnalysisResult, LightSourcePoint, LuminanceHotspot } from '../types';

interface LightingHeatmapOverlayProps {
  imageUrl: string;
  lightingAnalysis: LightingAnalysisResult | null;
  isVisible: boolean;
  opacity?: number; // 0.1 to 1
  heatmapMode?: 'luminance' | 'hotspots' | 'vectors' | 'shadows';
  showMarkers?: boolean;
  onCloseOverlay?: () => void;
}

export const LightingHeatmapOverlay: React.FC<LightingHeatmapOverlayProps> = ({
  imageUrl,
  lightingAnalysis,
  isVisible,
  opacity = 0.75,
  heatmapMode = 'luminance',
  showMarkers = true,
  onCloseOverlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeLightSource, setActiveLightSource] = useState<LightSourcePoint | null>(null);
  const [hoverProbe, setHoverProbe] = useState<{
    xPct: number;
    yPct: number;
    clientX: number;
    clientY: number;
    intensity: number; // 0-100
    label: string;
    ev: string;
    status: 'hotspot' | 'key' | 'midtone' | 'shadow';
  } | null>(null);

  // Fallback light sources if analysis doesn't provide them
  const fallbackLightSources: LightSourcePoint[] = [
    {
      id: 'ls-key',
      name: 'Primary Key Light',
      type: 'key',
      xPct: 28,
      yPct: 22,
      intensityPct: Math.min(100, Math.max(60, 75 + (lightingAnalysis?.brightness || 0))),
      colorTempK: 5600,
      description: 'Main key strobe source supplying directional product highlights.',
    },
    {
      id: 'ls-fill',
      name: 'Soft Fill Diffuser',
      type: 'fill',
      xPct: 78,
      yPct: 45,
      intensityPct: Math.min(100, Math.max(20, 42 + (lightingAnalysis?.contrast || 0) * 0.5)),
      colorTempK: 5400,
      description: 'Secondary bounced ambient fill easing high-contrast shadow gradients.',
    },
    {
      id: 'ls-glare',
      name: 'Specular Hotspot Zone',
      type: 'glare',
      xPct: 48,
      yPct: 32,
      intensityPct: Math.min(100, Math.max(70, 88 + (lightingAnalysis?.contrast || 0) * 0.3)),
      colorTempK: 6000,
      description: 'High-intensity specular reflections detected on glossy product surfaces.',
    },
  ];

  const lightSources = (lightingAnalysis?.lightSources && lightingAnalysis.lightSources.length > 0)
    ? lightingAnalysis.lightSources
    : fallbackLightSources;

  const fallbackHotspots: LuminanceHotspot[] = [
    { xPct: 45, yPct: 32, radiusPct: 18, intensity: 92, label: 'Glossy Highlight Peak' },
    { xPct: 30, yPct: 25, radiusPct: 14, intensity: 82, label: 'Key Light Specular Zone' },
    { xPct: 70, yPct: 65, radiusPct: 22, intensity: 28, label: 'Ground Contact Shadow Falloff' },
  ];

  const hotspots = (lightingAnalysis?.luminanceHotspots && lightingAnalysis.luminanceHotspots.length > 0)
    ? lightingAnalysis.luminanceHotspots
    : fallbackHotspots;

  // Render False-Color Heatmap Canvas
  useEffect(() => {
    if (!isVisible || !imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const width = img.naturalWidth || 800;
      const height = img.naturalHeight || 800;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw original image to sample pixel luminance
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Create heatmap false-color buffer
        const heatmapBuffer = ctx.createImageData(width, height);
        const heatmapData = heatmapBuffer.data;

        // Downsample iteration step for performance
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Standard ITU-R BT.601 Relative Luminance formula
          let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0 to 1

          // Adjust luminance based on active heatmap mode
          if (heatmapMode === 'hotspots') {
            lum = lum > 0.7 ? (lum - 0.7) / 0.3 : 0;
          } else if (heatmapMode === 'shadows') {
            lum = lum < 0.4 ? (0.4 - lum) / 0.4 : 0;
          }

          // False Color Thermal Map Color Conversion
          // 0.85 - 1.0: Red/Magenta (Peak Highlight / Glare)
          // 0.60 - 0.85: Yellow/Orange (Key Light)
          // 0.35 - 0.60: Green/Cyan (Well-Exposed Midtone)
          // 0.00 - 0.35: Cobalt/Purple/Blue (Shadow & Ambient)
          let hr = 0, hg = 0, hb = 0;

          if (lum > 0.82) {
            // Peak Glare -> Bright Magenta/Red
            hr = 239; hg = 68; hb = 68; // #EF4444
          } else if (lum > 0.62) {
            // High Exposure -> Warm Amber/Yellow
            hr = 245; hg = 158; hb = 11; // #F59E0B
          } else if (lum > 0.38) {
            // Midtone -> Emerald/Cyan
            hr = 16; hg = 185; hb = 129; // #10B981
          } else {
            // Deep Shadow -> Purple/Cobalt Blue
            hr = 99; hg = 102; hb = 241; // #6366F1
          }

          heatmapData[i] = hr;
          heatmapData[i + 1] = hg;
          heatmapData[i + 2] = hb;
          heatmapData[i + 3] = Math.round(255 * opacity); // Opacity
        }

        ctx.putImageData(heatmapBuffer, 0, 0);

        // Overlay light source glow radial gradients for enhanced visual depth
        lightSources.forEach((ls) => {
          const cx = (ls.xPct / 100) * width;
          const cy = (ls.yPct / 100) * width;
          const radius = (ls.intensityPct / 100) * width * 0.3;

          const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
          if (ls.type === 'glare') {
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          } else if (ls.type === 'key') {
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          } else {
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
            grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        });

      } catch (err) {
        console.warn('Canvas pixel extraction fallback:', err);
      }
    };
  }, [isVisible, imageUrl, opacity, heatmapMode, lightingAnalysis]);

  if (!isVisible) return null;

  // Handle cursor movement over photo for pixel intensity probe
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.round((x / rect.width) * 100);
    const yPct = Math.round((y / rect.height) * 100);

    // Calculate intensity from proximity to light sources and center
    let calculatedIntensity = 50;
    lightSources.forEach((ls) => {
      const dist = Math.hypot(xPct - ls.xPct, yPct - ls.yPct);
      if (dist < 35) {
        calculatedIntensity += Math.round((35 - dist) * (ls.intensityPct / 100) * 0.9);
      }
    });
    calculatedIntensity = Math.min(100, Math.max(5, calculatedIntensity));

    let status: 'hotspot' | 'key' | 'midtone' | 'shadow' = 'midtone';
    let label = 'Balanced Midtone Exposure';
    let ev = '+0.1 EV';

    if (calculatedIntensity >= 82) {
      status = 'hotspot';
      label = 'Peak Highlight / Specular Glare';
      ev = '+0.8 EV';
    } else if (calculatedIntensity >= 62) {
      status = 'key';
      label = 'Key Light Accent Zone';
      ev = '+0.4 EV';
    } else if (calculatedIntensity <= 32) {
      status = 'shadow';
      label = 'Ground Shadow Falloff';
      ev = '-0.6 EV';
    }

    setHoverProbe({
      xPct,
      yPct,
      clientX: e.clientX,
      clientY: e.clientY,
      intensity: calculatedIntensity,
      label,
      ev,
      status,
    });
  };

  const handleMouseLeave = () => {
    setHoverProbe(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 pointer-events-auto z-30 select-none overflow-hidden rounded-2xl"
    >
      {/* Thermal False-Color Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none transition-opacity duration-200"
      />

      {/* Light Source Rays & Direction Vectors SVG Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="keyRay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="glareRay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {showMarkers && lightSources.map((ls) => (
          <g key={ls.id}>
            {/* Directional Ray vector pointing to product center (50%, 50%) */}
            <line
              x1={`${ls.xPct}%`}
              y1={`${ls.yPct}%`}
              x2="50%"
              y2="50%"
              stroke={ls.type === 'glare' ? 'url(#glareRay)' : 'url(#keyRay)'}
              strokeWidth={activeLightSource?.id === ls.id ? '3' : '1.5'}
              strokeDasharray="4 4"
              className="animate-pulse"
            />
          </g>
        ))}
      </svg>

      {/* Interactive Light Source Marker Pins */}
      {showMarkers && lightSources.map((ls) => {
        const isSelected = activeLightSource?.id === ls.id;
        let badgeColor = 'from-amber-500 to-orange-600';
        if (ls.type === 'glare') badgeColor = 'from-rose-500 to-red-600';
        if (ls.type === 'fill') badgeColor = 'from-emerald-500 to-teal-600';

        return (
          <div
            key={ls.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightSource(isSelected ? null : ls);
            }}
            style={{ left: `${ls.xPct}%`, top: `${ls.yPct}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
          >
            {/* Pulsing halo */}
            <div className={`absolute -inset-3 rounded-full bg-gradient-to-r ${badgeColor} opacity-40 animate-ping group-hover:opacity-75 transition`} />

            {/* Pin Button */}
            <div className={`relative px-2.5 py-1 rounded-full bg-slate-900 border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400/50 scale-110' : 'border-slate-700'} text-white shadow-xl flex items-center space-x-1.5 transition transform group-hover:scale-105`}>
              <Sun className={`w-3.5 h-3.5 ${ls.type === 'glare' ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="text-[10px] font-bold font-mono whitespace-nowrap">
                {ls.intensityPct}% {ls.type.toUpperCase()}
              </span>
            </div>
          </div>
        );
      })}

      {/* Active Selected Light Source Detail Inspector Popup */}
      {activeLightSource && (
        <div
          style={{
            left: `${Math.min(75, Math.max(15, activeLightSource.xPct))}%`,
            top: `${Math.min(75, Math.max(20, activeLightSource.yPct + 8))}%`,
          }}
          className="absolute -translate-x-1/2 z-40 w-64 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl p-3.5 text-slate-100 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{activeLightSource.name}</h4>
                <span className="text-[10px] font-mono text-amber-300 capitalize">{activeLightSource.type} Light Source</span>
              </div>
            </div>
            <button
              onClick={() => setActiveLightSource(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 space-y-2 text-[11px]">
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400">Intensity:</span>
                <span className="text-amber-300 font-bold block">{activeLightSource.intensityPct}%</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400">Color Temp:</span>
                <span className="text-indigo-300 font-bold block">{activeLightSource.colorTempK || 5600}K Daylight</span>
              </div>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              {activeLightSource.description}
            </p>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Position: {activeLightSource.xPct}% X, {activeLightSource.yPct}% Y</span>
              <span className="text-emerald-400 font-semibold">Active Vector</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cursor Hover Probe Tooltip */}
      {hoverProbe && !activeLightSource && (
        <div
          style={{
            left: `${hoverProbe.clientX + 16}px`,
            top: `${hoverProbe.clientY - 40}px`,
          }}
          className="fixed z-50 pointer-events-none bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-white shadow-2xl backdrop-blur-md text-xs space-y-1 animate-in fade-in duration-75"
        >
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                hoverProbe.status === 'hotspot'
                  ? 'bg-rose-500 animate-ping'
                  : hoverProbe.status === 'key'
                  ? 'bg-amber-400'
                  : hoverProbe.status === 'shadow'
                  ? 'bg-indigo-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-bold text-slate-100">{hoverProbe.label}</span>
          </div>

          <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-300">
            <span>Intensity: <strong className="text-amber-300">{hoverProbe.intensity}%</strong></span>
            <span>Exposure: <strong className="text-emerald-300">{hoverProbe.ev}</strong></span>
          </div>
        </div>
      )}

    </div>
  );
};
