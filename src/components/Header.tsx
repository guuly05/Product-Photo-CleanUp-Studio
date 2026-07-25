import React, { useState, useRef, useEffect } from 'react';
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
  Info,
  FolderArchive,
  User as UserIcon,
  Settings,
  SlidersHorizontal,
  LogOut,
  ShieldCheck,
  CloudCheck,
  Save,
  FileJson,
  FileUp,
  BarChart3,
  Flame,
  Clock,
  Trophy
} from 'lucide-react';
import { WorkspaceStats, formatTimeSaved, calculateUserLevelAndXp } from '../utils/workspaceStats';
import type { User as FirebaseUser } from '../lib/firebase';

interface HeaderProps {
  onOpenSamples: () => void;
  onOpenBatchProcessor: () => void;
  onOpenWorkspaceStats?: () => void;
  workspaceStats?: WorkspaceStats;
  onReset: () => void;
  onDownload: (format: 'png' | 'jpeg', transparent: boolean) => void;
  onExportAllZip: () => void;
  onDownloadSettings: () => void;
  onImportSettings?: (settings: any) => void;
  isComparing: boolean;
  onToggleCompare: () => void;
  showAdjustments: boolean;
  onToggleAdjustments: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  hasEditedImage: boolean;
  historyCount: number;
  onStartTour: () => void;
  lastAutoSavedAt?: number | null;
  user?: FirebaseUser | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSamples,
  onOpenBatchProcessor,
  onOpenWorkspaceStats,
  workspaceStats,
  onReset,
  onDownload,
  onExportAllZip,
  onDownloadSettings,
  onImportSettings,
  isComparing,
  onToggleCompare,
  showAdjustments,
  onToggleAdjustments,
  selectedModel,
  onSelectModel,
  hasEditedImage,
  historyCount,
  onStartTour,
  lastAutoSavedAt,
  user = null,
  onSignInWithGoogle,
  onSignOut,
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSettingsJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (onImportSettings) {
          onImportSettings(parsed);
        }
      } catch (err) {
        alert('Could not parse JSON settings file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Brand Identity & User Profile Dropdown */}
        <div className="flex items-center space-x-3 sm:space-x-4">
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
                {lastAutoSavedAt && (
                  <span
                    className="hidden lg:inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-in fade-in"
                    title={`Auto-saved session to localStorage at ${new Date(lastAutoSavedAt).toLocaleTimeString()}`}
                  >
                    <CloudCheck className="w-3 h-3 text-emerald-400" />
                    <span>Auto-Saved {new Date(lastAutoSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Remove backgrounds, clean blemishes & set backdrop with text prompts
              </p>
            </div>
          </div>


          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-800 hidden lg:block" />

          {/* User Profile / Auth State */}
          <div className="relative" ref={profileMenuRef}>
            {user ? (
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1.5 transition text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                title="User Account & Workspace Settings"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover border border-indigo-500/40 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-slate-200 leading-none truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0] || 'Studio User'}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono leading-tight mt-0.5 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Firebase Auth</span>
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={onSignInWithGoogle}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-500/25 transition transform hover:scale-105 active:scale-95"
                title="Sign in with Google to sync stats & photo edits across devices"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887c-.58 2.319-2.755 4.004-5.647 4.004-3.417 0-6.19-2.772-6.19-6.19 0-3.417 2.773-6.19 6.19-6.19 1.54 0 2.946.565 4.032 1.498l2.457-2.457C18.47 2.705 15.545 1.75 12.24 1.75 6.58 1.75 2 6.33 2 11.99s4.58 10.24 10.24 10.24c5.918 0 9.84-4.16 9.84-10.015 0-.67-.07-1.32-.19-1.935H12.24z" />
                </svg>
                <span>Sign In with Google</span>
              </button>
            )}

            {/* Profile Dropdown Popup */}
            {user && profileMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/40 rounded-t-2xl">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{user.displayName || 'Studio Creator'}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Workspace Stats Quick Summary Box */}
                {workspaceStats && (
                  <div className="mx-2.5 my-2 p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center space-x-1 text-purple-300">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>Level {calculateUserLevelAndXp(workspaceStats).level} Studio</span>
                      </span>
                      <span className="text-emerald-400 font-mono">
                        {formatTimeSaved(workspaceStats.timeSavedMinutes).formatted} Saved
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center pt-1 border-t border-slate-800/60">
                      <div className="bg-slate-900/60 p-1 rounded">
                        <p className="text-[10px] text-slate-500 font-mono">Edited</p>
                        <p className="text-xs font-bold text-indigo-300">{workspaceStats.totalImagesEdited}</p>
                      </div>
                      <div className="bg-slate-900/60 p-1 rounded">
                        <p className="text-[10px] text-slate-500 font-mono">Time Saved</p>
                        <p className="text-xs font-bold text-emerald-400">{formatTimeSaved(workspaceStats.timeSavedMinutes).formatted}</p>
                      </div>
                      <div className="bg-slate-900/60 p-1 rounded">
                        <p className="text-[10px] text-slate-500 font-mono">Batches</p>
                        <p className="text-xs font-bold text-amber-300">{workspaceStats.batchJobsCompleted}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (onOpenWorkspaceStats) onOpenWorkspaceStats();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center justify-between transition text-left border-y border-indigo-500/20"
                  >
                    <span className="flex items-center space-x-2.5">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-purple-200">Workspace Stats</span>
                    </span>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded font-mono">
                      Firestore
                    </span>
                  </button>

                  <button
                    onClick={() => setProfileMenuOpen(false)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2.5 transition text-left mt-1"
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => setProfileMenuOpen(false)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2.5 transition text-left"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                    <span>Workspace Preferences</span>
                  </button>
                </div>

                <div className="border-t border-slate-800/80 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (onSignOut) onSignOut();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center space-x-2.5 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
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

          {/* Batch Processor ZIP */}
          <button
            onClick={onOpenBatchProcessor}
            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition flex items-center space-x-1.5"
            title="Batch process ZIP file of product photos"
          >
            <FolderArchive className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Batch ZIP</span>
          </button>

          {/* Download Settings Preset JSON Button */}
          <button
            onClick={onDownloadSettings}
            className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30 transition flex items-center space-x-1.5"
            title="Export current adjustments, shadow, and watermark settings as a reusable JSON file"
          >
            <FileJson className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline">Download Settings</span>
          </button>

          {/* Load Settings Preset JSON Button */}
          {onImportSettings && (
            <label
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
              title="Import saved JSON edit preset settings"
            >
              <FileUp className="w-4 h-4 text-indigo-400" />
              <span className="hidden 2xl:inline">Load Preset</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleSettingsJsonImport}
              />
            </label>
          )}

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

                <button
                  onClick={() => {
                    onDownloadSettings();
                    setDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between border-t border-slate-700/60 transition"
                >
                  <span className="flex items-center space-x-1.5">
                    <FileJson className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-medium">Download Settings JSON</span>
                  </span>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono">
                    .json
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    onExportAllZip();
                    setDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 font-semibold flex items-center justify-between border-t border-indigo-500/30 transition"
                >
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export All Steps</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                    .zip
                  </span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
