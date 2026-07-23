import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Move,
  SplitSquareVertical,
  Check,
  Eye,
  Eraser,
  Undo2,
  Trash2,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ImageAdjustments, BackgroundSettings, ShadowSettings, WatermarkSettings } from '../types';

interface BeforeAfterSliderProps {
  originalUrl: string;
  currentUrl: string;
  isComparing: boolean;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  shadow: ShadowSettings;
  watermark?: WatermarkSettings;
  isProcessing: boolean;
  activePrompt?: string;
  onSmartEraserApply?: (newImageUrl: string, label: string) => void;
  onOpenImageInfo?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  currentUrl,
  isComparing,
  adjustments,
  background,
  shadow,
  watermark,
  isProcessing,
  activePrompt,
  onSmartEraserApply,
  onOpenImageInfo,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smart Eraser Tool State
  const [isEraserActive, setIsEraserActive] = useState<boolean>(false);
  const [eraserSize, setEraserSize] = useState<number>(30); // px
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [hasErased, setHasErased] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize or re-draw canvas when Eraser Mode toggles or currentUrl changes
  useEffect(() => {
    if (!isEraserActive || !currentUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentUrl;
    img.onload = () => {
      loadedImageRef.current = img;
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = img.naturalWidth || 1200;
        canvas.height = img.naturalHeight || 1200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setStrokeHistory([initialData]);
          setHasErased(false);
        }
      }
    };
  }, [isEraserActive, currentUrl]);

  // Canvas drawing coordinate calculations
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0, rectX: 0, rectY: 0, scaleFactor: 1 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rectX = clientX - rect.left;
    const rectY = clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: rectX * scaleX,
      y: rectY * scaleY,
      rectX,
      rectY,
      scaleFactor: scaleX,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Push current state to undo history
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev, currentData]);

    const { x, y, scaleFactor } = getCanvasCoords(e);
    setIsDrawing(true);
    setHasErased(true);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, (eraserSize / 2) * scaleFactor, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const { x, y, rectX, rectY, scaleFactor } = getCanvasCoords(e);
    setCursorPos({ x: rectX, y: rectY, visible: true });

    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = eraserSize * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.restore();
      ctx.beginPath();
    }
  };

  const handleUndoEraser = () => {
    if (strokeHistory.length <= 1 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 2];
    ctx.putImageData(previousState, 0, 0);
    const updatedHistory = strokeHistory.slice(0, -1);
    setStrokeHistory(updatedHistory);
    if (updatedHistory.length <= 1) {
      setHasErased(false);
    }
  };

  const handleResetEraser = () => {
    if (!canvasRef.current || !loadedImageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImageRef.current, 0, 0, canvas.width, canvas.height);
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory([initialData]);
    setHasErased(false);
  };

  const handleApplyEraser = () => {
    if (!canvasRef.current || !onSmartEraserApply) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSmartEraserApply(dataUrl, 'Smart Eraser Touch-Up');
    setIsEraserActive(false);
  };

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
        {/* Live Watermark Overlay */}
        {watermark?.enabled && watermark.text?.trim() && !isEraserActive && (
          <div
            className={`absolute pointer-events-none z-20 font-bold uppercase tracking-widest whitespace-nowrap select-none transition-all duration-150 ${
              watermark.position === 'top-left'
                ? 'top-8 left-8'
                : watermark.position === 'top-right'
                ? 'top-8 right-8'
                : watermark.position === 'bottom-left'
                ? 'bottom-8 left-8'
                : watermark.position === 'bottom-right'
                ? 'bottom-8 right-8'
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
            style={{
              opacity: (watermark.opacity || 60) / 100,
              fontSize: `${Math.round(14 * ((watermark.scale || 100) / 100))}px`,
              color: watermark.color || '#FFFFFF',
              textShadow:
                watermark.color?.toLowerCase() === '#ffffff'
                  ? '0 1px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)'
                  : '0 1px 4px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.9)',
            }}
          >
            {watermark.text}
          </div>
        )}

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

        {/* View mode 1: Standard Current Image View or Smart Eraser Active View */}
        {isEraserActive ? (
          <div
            className="relative flex items-center justify-center w-full h-full p-4 sm:p-8"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="relative flex items-center justify-center max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={() => setCursorPos((prev) => ({ ...prev, visible: false }))}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
                className="max-w-full max-h-full object-contain cursor-none shadow-2xl rounded-lg border border-slate-700/50"
                style={{
                  filter: `${filterStyle} ${shadowFilter}`,
                  touchAction: 'none',
                }}
              />

              {/* Custom Brush Cursor Ring */}
              {cursorPos.visible && (
                <div
                  className="pointer-events-none absolute z-50 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.9)] bg-rose-500/20 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${cursorPos.x}px`,
                    top: `${cursorPos.y}px`,
                    width: `${eraserSize}px`,
                    height: `${eraserSize}px`,
                  }}
                />
              )}
            </div>
          </div>
        ) : !isComparing ? (
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
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-slate-300 shadow-xl">
        
        {/* Zoom In / Out with Range Slider */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom((z) => Math.max(parseFloat((z - 0.25).toFixed(2)), 0.5))}
            className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Interactive Zoom Slider */}
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 sm:w-28 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            title="Inspect small product blemishes with zoom"
          />

          <button
            onClick={() => setZoom((z) => Math.min(parseFloat((z + 0.25).toFixed(2)), 3))}
            className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-indigo-300 w-11 text-center font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            {Math.round(zoom * 100)}%
          </span>

          {zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white flex items-center space-x-1 text-[10px] font-medium"
              title="Reset Zoom to 100%"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Smart Eraser Tool Toggle */}
        <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

        <button
          onClick={() => setIsEraserActive(!isEraserActive)}
          className={`p-1.5 rounded-lg transition flex items-center space-x-1.5 ${
            isEraserActive ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Smart Eraser: Manually brush over unwanted artifacts to erase them"
        >
          <Eraser className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold hidden sm:inline">Smart Eraser</span>
        </button>

        {/* Alignment Grid Overlay Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg transition flex items-center space-x-1.5 ${
            showGrid ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Center Alignment Grid"
        >
          <Grid className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">Grid</span>
        </button>

        {/* Asset Metadata & EXIF Info Modal Toggle */}
        {onOpenImageInfo && (
          <button
            onClick={onOpenImageInfo}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center space-x-1.5"
            title="View image dimensions, file size, EXIF & e-commerce platform specs"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium hidden sm:inline">Image Info</span>
          </button>
        )}

      </div>

      {/* Floating Smart Eraser Control Bar */}
      {isEraserActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-500/40 text-slate-200 shadow-2xl">
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <Eraser className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Smart Eraser</span>
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center space-x-2 border-r border-slate-800 pr-3">
            <span className="text-[11px] text-slate-400 font-medium">Brush Size:</span>
            <input
              type="range"
              min="5"
              max="100"
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
              className="w-20 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[11px] font-mono text-rose-300 w-8 font-bold">{eraserSize}px</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleUndoEraser}
              disabled={strokeHistory.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
              title="Undo Brush Stroke"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetEraser}
              disabled={!hasErased}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
              title="Clear All Eraser Strokes"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {onSmartEraserApply && (
              <button
                onClick={handleApplyEraser}
                disabled={!hasErased}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1 disabled:opacity-40"
                title="Apply erased changes as a new photo step"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Touch-Up</span>
              </button>
            )}

            <button
              onClick={() => setIsEraserActive(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close Eraser"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Compare Hint Badge */}
      {isComparing && !isEraserActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-2 shadow-lg">
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>Drag split line to compare original vs cleaned photo</span>
        </div>
      )}

    </div>
  );
};
