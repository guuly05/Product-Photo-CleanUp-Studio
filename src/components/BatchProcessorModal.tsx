import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FolderArchive,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  X,
  Tag,
  ArrowRight,
  Layers,
  FileImage,
  Play
} from 'lucide-react';

interface BatchItem {
  id: string;
  name: string;
  originalUrl: string;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  resultUrl?: string;
  errorMsg?: string;
  progressPercent?: number;
}

interface BatchProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onLoadImageToStudio: (imageUrl: string, label: string) => void;
  onBatchCompleted?: (completedCount: number) => void;
}

export const BatchProcessorModal: React.FC<BatchProcessorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onLoadImageToStudio,
  onBatchCompleted,
}) => {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [batchPrompt, setBatchPrompt] = useState<string>('Isolate product on pure white background (#FFFFFF), fix studio lighting and add subtle soft shadow');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle uploading and parsing ZIP file
  const handleZipUpload = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setErrorMessage('Please upload a valid .zip archive file containing product images.');
      return;
    }

    setErrorMessage(null);
    setIsExtracting(true);
    setZipFile(file);

    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      const items: BatchItem[] = [];

      let index = 0;
      for (const filename of Object.keys(zipContents.files)) {
        const fileEntry = zipContents.files[filename];
        if (!fileEntry.dir && /\.(png|jpe?g|webp|gif|bmp)$/i.test(filename)) {
          // Remove folder paths if any
          const cleanName = filename.split('/').pop() || filename;
          const base64 = await fileEntry.async('base64');
          const ext = cleanName.split('.').pop()?.toLowerCase();
          const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          const originalUrl = `data:${mimeType};base64,${base64}`;

          items.push({
            id: `batch-${index++}-${Date.now()}`,
            name: cleanName,
            originalUrl,
            mimeType,
            status: 'pending',
            progressPercent: 0,
          });
        }
      }

      if (items.length === 0) {
        setErrorMessage('No supported image files (.png, .jpg, .webp) found inside the uploaded ZIP archive.');
        setBatchItems([]);
      } else {
        setBatchItems(items);
      }
    } catch (err: any) {
      console.error('Failed to parse ZIP archive:', err);
      setErrorMessage('Failed to read ZIP file: ' + (err.message || 'Corrupted archive'));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleZipUpload(e.dataTransfer.files[0]);
    }
  };

  // Run Batch Processing on extracted images
  const handleStartBatchProcessing = async () => {
    if (batchItems.length === 0 || !batchPrompt.trim() || isBatchRunning) return;

    setIsBatchRunning(true);
    setErrorMessage(null);

    // Reset status of all items
    setBatchItems((prev) =>
      prev.map((item) => ({ ...item, status: 'pending', errorMsg: undefined, resultUrl: undefined, progressPercent: 0 }))
    );

    // Process items in parallel with a concurrency pool of 2 to optimize rate and speed
    const processItem = async (item: BatchItem) => {
      setBatchItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', progressPercent: 30 } : i))
      );

      try {
        const response = await fetch('/api/edit-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: item.originalUrl,
            prompt: batchPrompt,
            mimeType: item.mimeType,
            model: selectedModel,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.imageUrl) {
          throw new Error(data.error || 'Model failed to return retouched image');
        }

        setBatchItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'completed', resultUrl: data.imageUrl, progressPercent: 100 }
              : i
          )
        );
      } catch (err: any) {
        console.error(`Batch processing failed for ${item.name}:`, err);
        setBatchItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', errorMsg: err.message || 'Processing failed', progressPercent: 100 }
              : i
          )
        );
      }
    };

    // Execute batch items
    const concurrency = 2;
    const pool: Promise<void>[] = [];
    
    for (const item of batchItems) {
      const p = processItem(item);
      pool.push(p);
      if (pool.length >= concurrency) {
        await Promise.race(pool);
        // Clean finished promises
        for (let i = pool.length - 1; i >= 0; i--) {
          // Check if resolved by wrapping or waiting
        }
      }
    }

    await Promise.all(pool);
    setIsBatchRunning(false);

    if (onBatchCompleted) {
      setBatchItems((currentItems) => {
        const completedCount = currentItems.filter((i) => i.status === 'completed').length;
        if (completedCount > 0) {
          onBatchCompleted(completedCount);
        }
        return currentItems;
      });
    }
  };

  // Download all completed retouched items as a new ZIP file
  const handleDownloadBatchZip = async () => {
    const completedItems = batchItems.filter((item) => item.status === 'completed' && item.resultUrl);
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    completedItems.forEach((item) => {
      if (item.resultUrl) {
        const parts = item.resultUrl.split(';base64,');
        if (parts.length === 2) {
          zip.file(`retouched_${item.name}`, parts[1], { base64: true });
        }
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `batch_retouched_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global Progress metrics
  const totalCount = batchItems.length;
  const completedCount = batchItems.filter((i) => i.status === 'completed').length;
  const errorCount = batchItems.filter((i) => i.status === 'error').length;
  const processedCount = completedCount + errorCount;
  const globalProgressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  const BATCH_PRESETS = [
    { label: 'White Background + Soft Shadow', prompt: 'Isolate product on pure white background (#FFFFFF) with a soft contact shadow' },
    { label: 'Studio Blemish & Dust CleanUp', prompt: 'Remove all surface dust, scratches, and glare reflections while preserving original product details' },
    { label: 'Marble Pedestal Background', prompt: 'Place product on a luxurious polished marble pedestal with soft studio light' },
    { label: 'Warm E-Commerce Warmth', prompt: 'Fix exposure, warm up white balance, boost contrast and enhance color vibrancy' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FolderArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Batch Image Processor</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ZIP Automation
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload a ZIP archive of product photos & apply AI retouch instructions to all images simultaneously
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Step 1: ZIP Upload Area */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>1. Upload ZIP File of Product Images</span>
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative ${
                zipFile
                  ? 'border-indigo-500/60 bg-indigo-950/20'
                  : 'border-slate-700/80 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-950'
              }`}
            >
              <input
                type="file"
                accept=".zip"
                onChange={(e) => e.target.files?.[0] && handleZipUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {isExtracting ? (
                <div className="flex flex-col items-center space-y-2 py-2">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs font-medium text-slate-300">Unzipping and extracting product photos...</span>
                </div>
              ) : zipFile ? (
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl max-w-md mx-auto">
                  <div className="flex items-center space-x-3 text-left">
                    <FolderArchive className="w-6 h-6 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[220px]">{zipFile.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(zipFile.size / (1024 * 1024)).toFixed(2)} MB • {batchItems.length} photos extracted
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    Loaded
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                    <FolderArchive className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    Click to browse or drag & drop a <span className="text-indigo-400 font-mono font-bold">.ZIP</span> file here
                  </p>
                  <p className="text-[11px] text-slate-400">Supports ZIP archives containing PNG, JPG, or WEBP images</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Shared Retouch Instruction Prompt */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>2. AI Retouch Instruction (Applied to All Photos)</span>
              </span>
            </label>

            <textarea
              rows={2}
              value={batchPrompt}
              onChange={(e) => setBatchPrompt(e.target.value)}
              placeholder="e.g. Isolate product on white background, fix lighting, and add soft reflection"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
            />

            {/* Quick Presets for Batch Prompt */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {BATCH_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBatchPrompt(preset.prompt)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 text-[11px] font-medium rounded-lg border border-slate-800 hover:border-indigo-500/40 transition flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-center space-x-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 3: Batch Execution Progress & Image Items Grid */}
          {batchItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>3. Extraction Queue ({batchItems.length} Images)</span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleStartBatchProcessing}
                    disabled={isBatchRunning || !batchPrompt.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
                  >
                    {isBatchRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>{isBatchRunning ? 'Processing Batch...' : 'Process All Photos'}</span>
                  </button>
                </div>
              </div>

              {/* Global Progress Bar */}
              {(isBatchRunning || processedCount > 0) && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <span>Batch Progress:</span>
                      <span className="text-indigo-400 font-mono font-bold">
                        {completedCount} / {totalCount} Completed
                      </span>
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">{globalProgressPercent}%</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${globalProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Batch Images List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between space-x-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                        <img
                          src={item.resultUrl || item.originalUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="overflow-hidden text-left">
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          {item.status === 'pending' && (
                            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <FileImage className="w-3 h-3 text-slate-500" />
                              <span>Ready</span>
                            </span>
                          )}

                          {item.status === 'processing' && (
                            <span className="text-[10px] text-amber-300 flex items-center space-x-1 font-medium">
                              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                              <span>AI Retouching...</span>
                            </span>
                          )}

                          {item.status === 'completed' && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Done</span>
                            </span>
                          )}

                          {item.status === 'error' && (
                            <span className="text-[10px] text-rose-400 font-semibold flex items-center space-x-1 truncate">
                              <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate">{item.errorMsg || 'Failed'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons per item */}
                    <div className="shrink-0 flex items-center space-x-1">
                      {item.status === 'completed' && item.resultUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            onLoadImageToStudio(item.resultUrl!, `Batch item: ${item.name}`);
                            onClose();
                          }}
                          className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                          title="Open in Main Studio Canvas"
                        >
                          <span>Load</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {completedCount > 0 ? `${completedCount} photos retouched and ready for export` : 'Upload ZIP archive to begin'}
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleDownloadBatchZip}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download All Retouched (.ZIP)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
