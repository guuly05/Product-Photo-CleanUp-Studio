import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Upload,
  RotateCcw,
  Maximize2,
  Crop,
  Layers,
  Box,
  Eye,
  ShoppingBag,
  Store,
  Instagram,
  Feather,
  Zap,
  Tag,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  History,
  Clock,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { PRESET_INSTRUCTIONS } from '../data/presets';
import { PresetInstruction } from '../types';

interface InstructionConsoleProps {
  onSubmitPrompt: (prompt: string, aspectRatio?: string) => void;
  onUploadImage: (file: File) => void;
  isProcessing: boolean;
  selectedAspectRatio: string;
  onSelectAspectRatio: (ratio: string) => void;
  error?: string | null;
  recentPrompts?: string[];
}

export const InstructionConsole: React.FC<InstructionConsoleProps> = ({
  onSubmitPrompt,
  onUploadImage,
  isProcessing,
  selectedAspectRatio,
  onSelectAspectRatio,
  error,
  recentPrompts: externalRecentPrompts,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'background' | 'cleanup' | 'ecommerce' | 'aesthetic'>('all');
  const [showPromptLibrary, setShowPromptLibrary] = useState<boolean>(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [recentPrompts, setRecentPrompts] = useState<string[]>(() => {
    if (externalRecentPrompts && externalRecentPrompts.length > 0) return externalRecentPrompts;
    try {
      const saved = localStorage.getItem('studio_recent_prompts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep external recent prompts in sync if provided
  useEffect(() => {
    if (externalRecentPrompts && externalRecentPrompts.length > 0) {
      setRecentPrompts(externalRecentPrompts);
    }
  }, [externalRecentPrompts]);

  // Click outside listener for recent prompts dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addRecentPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setRecentPrompts((prev) => {
      const updated = [trimmed, ...prev.filter((p) => p.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem('studio_recent_prompts', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent prompts:', e);
      }
      return updated;
    });
  };

  const handleSelectRecent = (promptText: string) => {
    setPromptInput(promptText);
    setShowRecentDropdown(false);
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentPrompts([]);
    try {
      localStorage.removeItem('studio_recent_prompts');
    } catch (e) {}
  };

  // Common retouching phrases library
  const PROMPT_LIBRARY_ITEMS = [
    { label: 'Remove Dust & Lint', phrase: 'remove dust, lint, and surface specks' },
    { label: 'Fix Glare & Hotspots', phrase: 'fix harsh glare and tone down hot spots' },
    { label: 'Smooth Scratches', phrase: 'smooth out surface scratches and blemishes' },
    { label: 'Pure White Backdrop', phrase: 'isolate product on pure white background (#FFFFFF)' },
    { label: 'Studio Soft Shadow', phrase: 'add soft natural contact drop shadow' },
    { label: 'Subtle Reflection', phrase: 'add subtle ground mirror reflection under product' },
    { label: 'Boost Lighting & Contrast', phrase: 'enhance studio lighting and boost contrast' },
    { label: 'White Balance Exposure', phrase: 'correct color warmth and auto-white-balance' },
    { label: 'Marble Pedestal', phrase: 'place product on polished marble pedestal' },
  ];

  const handleAppendPhrase = (phrase: string) => {
    setPromptInput((prev) => {
      if (!prev.trim()) return phrase;
      if (prev.toLowerCase().includes(phrase.toLowerCase())) return prev;
      return `${prev.trim()}, ${phrase}`;
    });
  };

  const filteredPresets = selectedCategory === 'all'
    ? PRESET_INSTRUCTIONS
    : PRESET_INSTRUCTIONS.filter((p) => p.category === selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isProcessing) return;
    addRecentPrompt(promptInput);
    onSubmitPrompt(promptInput, selectedAspectRatio);
  };

  const handleSelectPreset = (preset: PresetInstruction) => {
    setPromptInput(preset.prompt);
    addRecentPrompt(preset.prompt);
    onSubmitPrompt(preset.prompt, selectedAspectRatio);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <div id="tour-instruction-console" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      
      {/* Top Header & Instruction Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Type CleanUp or Background Instruction</span>
          </label>
          
          <div className="flex items-center space-x-3">
            {/* Recent Prompts Dropdown Trigger */}
            {recentPrompts.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 ${
                    showRecentDropdown
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="View last 5 successful prompts"
                >
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium hidden sm:inline">Recent Prompts</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {recentPrompts.length}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showRecentDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showRecentDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-950 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-2 text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 mb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>Recent Prompts (Last 5)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearRecent}
                        className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center space-x-1 transition"
                        title="Clear recent prompts history"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                      {recentPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectRecent(p)}
                          className="w-full text-left p-2 rounded-lg hover:bg-indigo-950/50 text-xs text-slate-300 hover:text-indigo-200 transition group flex items-start space-x-2 border border-transparent hover:border-indigo-500/30"
                        >
                          <span className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 pt-0.5 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="line-clamp-2 leading-tight flex-1 font-sans">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File Upload Trigger */}
            <label className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer flex items-center space-x-1.5 transition">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload New Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. Remove background and place product on a pure white studio backdrop with soft drop shadow, clean up dust..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none pr-28"
          />

          <button
            type="submit"
            disabled={!promptInput.trim() || isProcessing}
            className="absolute right-2.5 bottom-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Editing...' : 'Apply'}</span>
          </button>
        </form>

        {/* Prompt Library Suggestions Bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              <span>Prompt Library (Quick Retouching Phrases)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowPromptLibrary(!showPromptLibrary)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {showPromptLibrary ? 'Hide Library' : 'View All Phrases'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(showPromptLibrary ? PROMPT_LIBRARY_ITEMS : PROMPT_LIBRARY_ITEMS.slice(0, 5)).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAppendPhrase(item.phrase)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 text-xs font-medium rounded-lg border border-slate-800 hover:border-indigo-500/40 transition flex items-center space-x-1 group"
                title={`Click to add "${item.phrase}"`}
              >
                <span className="text-indigo-400 group-hover:scale-110 transition">+</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-xl p-2.5 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Aspect Ratio Selector & Format Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Aspect Ratio:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { ratio: '1:1', label: '1:1 Square' },
              { ratio: '4:3', label: '4:3 Standard' },
              { ratio: '3:4', label: '3:4 Portrait' },
              { ratio: '16:9', label: '16:9 Banner' },
              { ratio: '9:16', label: '9:16 Story' },
            ].map((item) => (
              <button
                key={item.ratio}
                type="button"
                onClick={() => onSelectAspectRatio(item.ratio)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  selectedAspectRatio === item.ratio
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {item.ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Presets section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Quick Studio Presets
          </span>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All' },
              { id: 'background', label: 'Background' },
              { id: 'cleanup', label: 'CleanUp' },
              { id: 'ecommerce', label: 'E-Commerce' },
              { id: 'aesthetic', label: 'Aesthetic' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-indigo-300 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              disabled={isProcessing}
              className="text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
                    {preset.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
