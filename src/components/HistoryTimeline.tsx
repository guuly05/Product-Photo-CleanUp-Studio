import React, { useState } from 'react';
import { History, Sparkles, Check, Download, Layers, Edit3, Tag, X, FileText, FolderArchive } from 'lucide-react';
import { EditHistoryItem } from '../types';
import { generateFilenameFromTemplate } from '../utils/canvasExport';

interface HistoryTimelineProps {
  history: EditHistoryItem[];
  currentIndex: number;
  onSelectHistoryItem: (index: number) => void;
  onExportAllZip?: (filenameTemplate?: string) => void;
  isExportingZip?: boolean;
}

const TEMPLATE_PRESETS = [
  'Product_{timestamp}',
  'Product_{index}',
  'Catalog_{index}_{label}',
  '{index}_{label}',
];

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  history,
  currentIndex,
  onSelectHistoryItem,
  onExportAllZip,
  isExportingZip,
}) => {
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [template, setTemplate] = useState<string>('Product_{timestamp}');

  if (history.length <= 1) return null;

  const handleInsertVariable = (variable: string) => {
    setTemplate((prev) => `${prev}${variable}`);
  };

  const handleExportWithTemplate = () => {
    if (onExportAllZip) {
      onExportAllZip(template);
    }
    setShowRenameModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 relative">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
        <div className="flex items-center space-x-1.5">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Edit History Stack ({history.length} versions)</span>
        </div>

        <div className="flex items-center space-x-2">
          {onExportAllZip && (
            <>
              {/* Bulk Rename Button */}
              <button
                onClick={() => setShowRenameModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition flex items-center space-x-1.5 shadow-sm"
                title="Bulk rename export filenames using custom templates"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Rename Export</span>
              </button>

              {/* Standard Export ZIP Button */}
              <button
                onClick={() => onExportAllZip(template)}
                disabled={isExportingZip}
                className="px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                title="Download all history items as a ZIP file"
              >
                {isExportingZip ? (
                  <div className="w-3 h-3 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>{isExportingZip ? 'Zipping...' : 'Export All (ZIP)'}</span>
              </button>
            </>
          )}

          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Click step to restore
          </span>
        </div>
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

      {/* Bulk Rename Template Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <FolderArchive className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Bulk Rename ZIP Export Files</h3>
                  <p className="text-xs text-slate-400">Define a custom filename template before downloading archive</p>
                </div>
              </div>
              <button
                onClick={() => setShowRenameModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Template Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Filename Template</span>
                  <span className="text-[10px] text-indigo-400 font-mono">.png extension auto-added</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="e.g. Product_{timestamp}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                  {template && (
                    <button
                      onClick={() => setTemplate('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Variable Helper Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Insert Variable Tokens:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { token: '{index}', desc: 'Step Index (1, 2...)' },
                    { token: '{timestamp}', desc: 'Unix Timestamp' },
                    { token: '{label}', desc: 'Step Name' },
                    { token: '{date}', desc: 'YYYY-MM-DD' },
                  ].map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => handleInsertVariable(v.token)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-xs font-mono text-indigo-300 transition"
                      title={v.desc}
                    >
                      + {v.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Template Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTemplate(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                        template === p
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Preview Table */}
              <div className="space-y-1.5 bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Export Filenames Preview ({history.length} Files)</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {history.map((item, idx) => {
                    const generated = generateFilenameFromTemplate(
                      template,
                      idx,
                      item.label || `step-${idx + 1}`
                    );
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/70 border border-slate-850"
                      >
                        <span className="text-slate-400 font-medium truncate max-w-[140px]">
                          Step {idx + 1}: {item.label}
                        </span>
                        <span className="font-mono text-indigo-300 font-semibold text-[11px] truncate max-w-[200px]">
                          {generated}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2.5 p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportWithTemplate}
                disabled={isExportingZip}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingZip ? 'Zipping Files...' : 'Download ZIP Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

