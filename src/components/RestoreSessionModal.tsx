import React from 'react';
import { RotateCcw, Trash2, Clock, Layers, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { SavedSessionData } from '../types';

interface RestoreSessionModalProps {
  sessionData: SavedSessionData;
  onRestore: () => void;
  onDiscard: () => void;
}

export const RestoreSessionModal: React.FC<RestoreSessionModalProps> = ({
  sessionData,
  onRestore,
  onDiscard,
}) => {
  const savedTimeFormatted = new Date(sessionData.savedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lastStepLabel =
    sessionData.history?.[sessionData.historyIndex]?.label ||
    sessionData.history?.[sessionData.history.length - 1]?.label ||
    'Studio Retouch';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <RotateCcw className="w-5 h-5 text-indigo-400 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Unsaved Session Detected</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Auto-Saved
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Found a previous product photo studio session
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Would you like to restore your previous work or discard it and start with a fresh project?
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Last Auto-Save Time:</span>
              </span>
              <span className="font-mono font-semibold text-white">{savedTimeFormatted}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>History Steps Saved:</span>
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {sessionData.history.length} steps
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Step:</span>
              </span>
              <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                "{lastStepLabel}"
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-2 bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Restoring will load your full edit history, custom lighting, backdrop settings, watermark branding, and crop configurations.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard & Start Fresh</span>
          </button>

          <button
            onClick={onRestore}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore Session</span>
          </button>
        </div>

      </div>
    </div>
  );
};
