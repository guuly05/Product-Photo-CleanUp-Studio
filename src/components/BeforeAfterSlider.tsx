import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Move,
  SplitSquareVertical,
  Check,
  Eye
} from 'lucide-react';
import { ImageAdjustments, BackgroundSettings, ShadowSettings } from '../types';

interface BeforeAfterSliderProps {
  originalUrl: string;
  currentUrl: string;
  isComparing: boolean;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  shadow: ShadowSettings;
  isProcessing: boolean;
  activePrompt?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  currentUrl,
  isComparing,
  adjustments,
  background,
  shadow,
  isProcessing,
  activePrompt,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slider drag
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let pos = (x / rect.width) * 100;
    if (pos < 0) pos = 0;
    if (pos > 100) pos = 100;
    setSliderPosition(pos);
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const onGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // Compute CSS filter string for client adjustments
  const filterStyle = `
    brightness(${100 + adjustments.brightness}%)
    contrast(${100 + adjustments.contrast}%)
    saturate(${100 + adjustments.saturation}%)
  `;

  // Compute background fill styling
  const getBgStyle = () => {
    if (background.mode === 'color') {
      return { backgroundColor: background.color };
    }
    if (background.mode === 'gradient') {
      return {
        backgroundImage: `radial-gradient(circle at center, ${background.gradientStart || '#ffffff'}, ${background.gradientEnd || '#e2e8f0'})`,
      };
    }
    if (background.mode === 'transparent') {
      return {
        backgroundImage:
          'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#f1f5f9',
      };
    }
    return {};
  };

  // Compute drop shadow styling
  const shadowFilter = shadow.enabled
    ? `drop-shadow(0px ${shadow.offsetY}px ${shadow.blur}px rgba(0, 0, 0, ${shadow.opacity / 100}))`
    : 'none';

  return (
    <div id="tour-canvas-area" className="relative w-full h-[450px] sm:h-[550px] lg:h-[620px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl flex items-center justify-center select-none group">
      
      {/* Grid Overlay Guide */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 border border-indigo-500/20">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-indigo-500/10 flex items-center justify-center">
              {i === 4 && <div className="w-2 h-2 rounded-full bg-indigo-500/40" />}
            </div>
          ))}
        </div>
      )}

      {/* Main Image Viewport Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-full overflow-hidden flex items-center justify-center cursor-crosshair"
        style={getBgStyle()}
      >
        
        {/* Loading Overlay when processing AI Prompt */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              AI Studio Retouching Photo...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              "{activePrompt || 'Processing image instructions'}"
            </p>
          </div>
        )}

        {/* View mode 1: Standard Current Image View */}
        {!isComparing ? (
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center w-full h-full p-4 sm:p-8"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={currentUrl}
              alt="Cleaned product"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              style={{
                filter: `${filterStyle} ${shadowFilter}`,
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          /* View mode 2: Interactive Before/After Split Comparison */
          <div
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* After (Current Edit) Image - Right Side */}
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
              <img
                src={currentUrl}
                alt="After cleanup"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  filter: `${filterStyle} ${shadowFilter}`,
                }}
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-6 right-6 px-2.5 py-1 rounded-md bg-indigo-600/90 backdrop-blur text-[11px] font-bold text-white uppercase tracking-wider z-10 shadow">
                After (Cleaned)
              </span>
            </div>

            {/* Before (Original) Image - Left Side clipped by slider position */}
            <div
              className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 overflow-hidden z-10"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalUrl}
                alt="Before cleanup"
                className="max-w-full max-h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-6 left-6 px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur text-[11px] font-bold text-slate-300 uppercase tracking-wider shadow border border-slate-700">
                Before (Original)
              </span>
            </div>

            {/* Split Slider Handle Bar */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(0,0,0,0.5)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-indigo-600 font-bold text-xs">
                ↔
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toolbar Controls on Canvas */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 shadow-lg">
        
        {/* Zoom In / Out */}
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom(1)}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
          title="Reset Zoom"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

        {/* Alignment Grid Overlay Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg transition ${
            showGrid ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Center Alignment Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

      </div>

      {/* Compare Hint Badge */}
      {isComparing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-2 shadow-lg">
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>Drag split line to compare original vs cleaned photo</span>
        </div>
      )}

    </div>
  );
};
