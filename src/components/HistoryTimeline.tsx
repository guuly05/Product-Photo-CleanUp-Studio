import React from 'react';
import { History, Sparkles, Check, RotateCcw } from 'lucide-react';
import { EditHistoryItem } from '../types';

interface HistoryTimelineProps {
  history: EditHistoryItem[];
  currentIndex: number;
  onSelectHistoryItem: (index: number) => void;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  history,
  currentIndex,
  onSelectHistoryItem,
}) => {
  if (history.length <= 1) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
        <div className="flex items-center space-x-1.5">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Edit History Stack ({history.length} versions)</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Click step to restore
        </span>
      </div>

      <div className="flex items-center space-x-3 overflow-x-auto pb-1 custom-scrollbar">
        {history.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={item.id}
              onClick={() => onSelectHistoryItem(index)}
              className={`shrink-0 flex items-center space-x-2.5 p-2 rounded-xl border transition text-left max-w-xs ${
                isActive
                  ? 'bg-indigo-950/80 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Thumbnail preview */}
              <div className="relative w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-[1px] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white font-bold" />
                  </div>
                )}
              </div>

              <div className="min-w-0 pr-1">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Step {index + 1}
                  </span>
                  {index === 0 && (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded">
                      Original
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {item.label}
                </div>
                {item.prompt && (
                  <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    "{item.prompt}"
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
