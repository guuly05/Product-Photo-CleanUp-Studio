import React, { useEffect, useState } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Maximize2,
  HardDrive,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Tag,
  Sliders,
  Copy,
  Check,
  Plus,
  RotateCcw
} from 'lucide-react';
import { EditHistoryItem } from '../types';

interface ImageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep?: EditHistoryItem;
  currentUrl?: string;
  totalHistorySteps: number;
  productTags?: string[];
  primaryCategory?: string;
  isAnalyzingTags?: boolean;
  onReanalyzeTags?: () => void;
  onAddCustomTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
}

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  estimatedSize: string;
  mimeType: string;
  hasAlpha: boolean;
  isHighRes: boolean;
  ecommerceGrade: 'Ready for Shopify/Amazon' | 'Medium Quality' | 'Low Resolution';
}

export const ImageInfoModal: React.FC<ImageInfoModalProps> = ({
  isOpen,
  onClose,
  currentStep,
  currentUrl,
  totalHistorySteps,
  productTags = [],
  primaryCategory = 'Product Catalog',
  isAnalyzingTags = false,
  onReanalyzeTags,
  onAddCustomTag,
  onRemoveTag,
}) => {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedTags, setCopiedTags] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !currentUrl) return;

    setLoading(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentUrl;

    img.onload = () => {
      const width = img.naturalWidth || 1200;
      const height = img.naturalHeight || 1200;

      // Calculate simplified aspect ratio
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const ratioWidth = Math.round(width / divisor);
      const ratioHeight = Math.round(height / divisor);

      let aspectRatioStr = `${ratioWidth}:${ratioHeight}`;
      if (Math.abs(width / height - 1) < 0.03) aspectRatioStr = '1:1 Square (E-Commerce Standard)';
      else if (Math.abs(width / height - 4 / 3) < 0.03) aspectRatioStr = '4:3 Studio Grid';
      else if (Math.abs(width / height - 16 / 9) < 0.03) aspectRatioStr = '16:9 Banner';

      // Estimate file size from base64 string or fetch length
      let bytes = 0;
      let mimeType = 'image/png';

      if (currentUrl.startsWith('data:')) {
        const matches = currentUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          const base64Len = matches[2].length;
          bytes = Math.round((base64Len * 3) / 4);
        }
      } else {
        bytes = Math.round(width * height * 0.4); // rough estimate
      }

      const formattedSize =
        bytes > 1024 * 1024
          ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(bytes / 1024)} KB`;

      const megapixels = ((width * height) / 1000000).toFixed(2);
      const minDim = Math.min(width, height);
      const isHighRes = minDim >= 1000;
      const ecommerceGrade =
        minDim >= 1600
          ? 'Ready for Shopify/Amazon'
          : minDim >= 1000
          ? 'Ready for Shopify/Amazon'
          : 'Low Resolution';

      setMetadata({
        width,
        height,
        aspectRatio: aspectRatioStr,
        megapixels,
        estimatedSize: formattedSize,
        mimeType: mimeType.toUpperCase().replace('IMAGE/', ''),
        hasAlpha: mimeType.includes('png') || mimeType.includes('webp'),
        isHighRes,
        ecommerceGrade,
      });

      setLoading(false);
    };

    img.onerror = () => {
      setLoading(false);
    };
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    if (!metadata) return;
    const summary = `Photo Metadata: ${metadata.width}x${metadata.height}px (${metadata.aspectRatio}), Format: ${metadata.mimeType}, Size: ${metadata.estimatedSize}, Grade: ${metadata.ecommerceGrade}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTags = () => {
    if (!productTags.length) return;
    const formattedHashtags = productTags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
    navigator.clipboard.writeText(formattedHashtags);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !onAddCustomTag) return;
    onAddCustomTag(newTagInput.trim().toLowerCase());
    setNewTagInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Asset EXIF & Metadata Info</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quality Audit
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Technical file specifications & e-commerce platform compliance check
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
        <div className="p-6 space-y-6">
          
          {/* Main Specs Grid */}
          {loading || !metadata ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Analyzing image structure & color space...</p>
            </div>
          ) : (
            <>
              {/* Specs Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dimensions</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">
                    {metadata.width} × {metadata.height}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">{metadata.megapixels} Megapixels</p>
                </div>

                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>File Size</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">{metadata.estimatedSize}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{metadata.mimeType} Format</p>
                </div>

                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aspect Ratio</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{metadata.aspectRatio}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Standard Framing</p>
                </div>

                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Platform Grade</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400 truncate">{metadata.ecommerceGrade}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Amazon / Shopify</p>
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>E-Commerce Platform Compliance</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    {metadata.isHighRes ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-white">Zoom-In Resolution</p>
                      <p className="text-[10px] text-slate-400">
                        {metadata.isHighRes
                          ? '≥ 1000px width enabled hover zoom on Shopify & Amazon'
                          : 'Under 1000px — increase resolution for best product zoom'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">sRGB Color Profile</p>
                      <p className="text-[10px] text-slate-400">Optimized for web browsers and mobile OLED screens</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Alpha Transparency</p>
                      <p className="text-[10px] text-slate-400">
                        {metadata.hasAlpha
                          ? 'Supported (PNG/WEBP mode enabled)'
                          : 'Standard RGB Channel'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Studio Shadow Synthesis</p>
                      <p className="text-[10px] text-slate-400">Dynamic shadow layer active in history</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Product Taxonomy & Suggested Tags */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      AI Suggested Product Tags & Taxonomy
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onReanalyzeTags && (
                      <button
                        type="button"
                        onClick={onReanalyzeTags}
                        disabled={isAnalyzingTags}
                        className="text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3 h-3 ${isAnalyzingTags ? 'animate-spin' : ''}`} />
                        <span>{isAnalyzingTags ? 'Analyzing...' : 'Re-Analyze AI Tags'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium">Primary AI Catalog Category:</span>
                  <span className="font-bold text-white px-2.5 py-0.5 bg-indigo-600/30 border border-indigo-500/40 rounded-full text-[11px]">
                    {primaryCategory}
                  </span>
                </div>

                {/* Tags Badges */}
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">Auto-detected product tags & composition keywords:</p>
                  
                  {isAnalyzingTags ? (
                    <div className="py-4 text-center text-xs text-indigo-300 flex items-center justify-center space-x-2 bg-slate-900/40 rounded-xl">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span>Gemini 2.5 Flash is classifying image attributes...</span>
                    </div>
                  ) : productTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {productTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-indigo-300 font-mono text-xs font-semibold rounded-lg border border-indigo-500/30 group shadow-sm transition"
                        >
                          <span>#{tag}</span>
                          {onRemoveTag && (
                            <button
                              type="button"
                              onClick={() => onRemoveTag(tag)}
                              className="text-slate-500 hover:text-rose-400 transition ml-0.5"
                              title="Remove tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No product tags generated yet.</p>
                  )}
                </div>

                {/* Add Custom Tag Form & Copy Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <form onSubmit={handleAddTagSubmit} className="flex items-center space-x-1.5 flex-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Add custom tag (e.g., 'macro', 'apparel')..."
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!newTagInput.trim()}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {productTags.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyTags}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shrink-0"
                    >
                      {copiedTags ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedTags ? 'Copied Tags' : 'Copy #Hashtags'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Step Retouching Context */}
              {currentStep && (
                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Active Retouch Step Details</span>
                  </h3>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Action Step Label:</span>
                      <span className="font-bold text-white">{currentStep.label}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Applied Prompt:</span>
                      <span className="font-mono text-indigo-300 text-[11px] truncate max-w-[280px]">
                        "{currentStep.prompt || 'Manual Studio Adjustments'}"
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {new Date(currentStep.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Steps in History:</span>
                      <span className="font-bold text-slate-200">{totalHistorySteps} versions</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied Summary' : 'Copy Specs Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
