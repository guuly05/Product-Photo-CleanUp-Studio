import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Images,
  Sliders,
  SplitSquareVertical,
  Check,
  ChevronDown,
  Layers,
  Zap,
  Info
} from 'lucide-react';

interface HeaderProps {
  onOpenSamples: () => void;
  onReset: () => void;
  onDownload: (format: 'png' | 'jpeg', transparent: boolean) => void;
  isComparing: boolean;
  onToggleCompare: () => void;
  showAdjustments: boolean;
  onToggleAdjustments: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  hasEditedImage: boolean;
  historyCount: number;
  onStartTour: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSamples,
  onReset,
  onDownload,
  isComparing,
  onToggleCompare,
  showAdjustments,
  onToggleAdjustments,
  selectedModel,
  onSelectModel,
  hasEditedImage,
  historyCount,
  onStartTour,
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Product Photo Studio
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI CleanUp
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Remove backgrounds, clean blemishes & set backdrop with text prompts
            </p>
          </div>
        </div>

        {/* Middle Model Switcher & Controls */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onSelectModel('gemini-3.1-flash-image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              selectedModel === 'gemini-3.1-flash-image'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="High-Quality 1K Studio Retouching"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio HQ (Flash Image)</span>
          </button>

          <button
            onClick={() => onSelectModel('gemini-3.1-flash-lite-image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              selectedModel === 'gemini-3.1-flash-lite-image'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title="Fast Iteration"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fast Lite</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-2">
          
          {/* Guided Tour Start Button */}
          <button
            onClick={onStartTour}
            id="tour-start-button"
            className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition flex items-center space-x-1.5"
            title="Quick guided tour of feature tools"
          >
            <Info className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Sample Product Photos */}
          <button
            onClick={onOpenSamples}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
            title="Try with sample product photos"
          >
            <Images className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Samples</span>
          </button>

          {/* Toggle Before / After Split Slider */}
          {hasEditedImage && (
            <button
              onClick={onToggleCompare}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center space-x-1.5 ${
                isComparing
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Compare Before vs After"
            >
              <SplitSquareVertical className="w-4 h-4" />
              <span className="hidden sm:inline">{isComparing ? 'Comparing' : 'Compare'}</span>
            </button>
          )}

          {/* Adjustments Sidebar Toggle */}
          <button
            onClick={onToggleAdjustments}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center space-x-1.5 ${
              showAdjustments
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Adjust brightness, shadows, backdrop fill"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden lg:inline">Tools</span>
          </button>

          {/* Reset Canvas */}
          {historyCount > 1 && (
            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Reset to Original Image"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Download Dropdown */}
          <div className="relative" id="tour-export-button">
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {downloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Download Formats
                </div>
                <button
                  onClick={() => {
                    onDownload('png', false);
                    setDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span className="font-medium">PNG High-Quality</span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">.png</span>
                </button>
                <button
                  onClick={() => {
                    onDownload('png', true);
                    setDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span className="font-medium">PNG (Transparent Bg)</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Cutout</span>
                </button>
                <button
                  onClick={() => {
                    onDownload('jpeg', false);
                    setDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between border-t border-slate-700/60"
                >
                  <span className="font-medium">JPG E-Commerce</span>
                  <span className="text-[10px] text-slate-400">.jpg</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
