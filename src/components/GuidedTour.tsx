import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Send,
  Sliders,
  SplitSquareVertical,
  Download,
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetId: string | null; // null for centered modal
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  tips?: string[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: null,
    title: 'Welcome to Product Photo CleanUp Studio',
    badge: 'Step 1 of 5',
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    description: 'Easily transform raw product photos into commercial-grade e-commerce assets using natural language text instructions.',
    tips: [
      'Remove background clutter in seconds',
      'Clean up dust, glare & surface blemishes',
      'Stage products on studio backdrops or marble pedestals'
    ],
    position: 'center',
  },
  {
    id: 'console',
    targetId: 'tour-instruction-console',
    title: 'Prompt Input & One-Click Presets',
    badge: 'Step 2 of 5',
    icon: <Send className="w-5 h-5 text-indigo-400" />,
    description: 'Describe any editing change or choose from Amazon, Shopify, and Instagram pre-configured studio styles.',
    tips: [
      'Type custom prompts or click Quick Presets below',
      'Select custom aspect ratios for story or square banners'
    ],
    position: 'top',
  },
  {
    id: 'adjustments',
    targetId: 'tour-adjustments-panel',
    title: 'Backdrops, Ground Shadows & Color',
    badge: 'Step 3 of 5',
    icon: <Sliders className="w-5 h-5 text-indigo-400" />,
    description: 'Post-process your clean product cutout with instant background fill swatches, contact drop shadows, and exposure adjustments.',
    tips: [
      'Switch between Amazon White, Warm Sand, or Transparent Cutout',
      'Enable Contact Ground Shadow so products sit realistically'
    ],
    position: 'left',
  },
  {
    id: 'canvas',
    targetId: 'tour-canvas-area',
    title: 'Interactive Split Compare & Zoom Canvas',
    badge: 'Step 4 of 5',
    icon: <SplitSquareVertical className="w-5 h-5 text-indigo-400" />,
    description: 'Inspect product retouching details with the side-by-side Before/After slider, precision zoom, and alignment guides.',
    tips: [
      'Click "Compare" in the top bar to toggle split slider',
      'Use center grid overlay for precise product framing'
    ],
    position: 'bottom',
  },
  {
    id: 'export',
    targetId: 'tour-export-button',
    title: 'High-Res Commercial Export',
    badge: 'Step 5 of 5',
    icon: <Download className="w-5 h-5 text-indigo-400" />,
    description: 'Download crisp, high-resolution product images in PNG, transparent PNG cutouts, or e-commerce JPG.',
    tips: [
      'Transparent PNGs are ready for web compositing',
      'E-commerce JPGs match Shopify and Amazon standards'
    ],
    position: 'bottom',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Update target rect when step changes or window resizes
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          // Scroll target element into view gently if needed
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();
    const timer = setTimeout(updateRect, 100); // slight delay for layout recalculation
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, currentStepIndex, currentStep.targetId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
      setCurrentStepIndex(0);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Compute position coordinates for tooltip box
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || currentStep.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return {
        bottom: '24px',
        left: '16px',
        right: '16px',
        maxHeight: '80vh',
      };
    }

    // Desktop positioning logic relative to target
    switch (currentStep.position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.max(16, targetRect.left + targetRect.width / 2 - 200)}px`,
          width: '420px',
        };
      case 'left':
        return {
          top: `${Math.max(16, targetRect.top)}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          width: '380px',
        };
      case 'right':
        return {
          top: `${Math.max(16, targetRect.top)}px`,
          left: `${targetRect.right + padding}px`,
          width: '380px',
        };
      case 'bottom':
      default:
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(16, targetRect.left + targetRect.width / 2 - 200)}px`,
          width: '420px',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      
      {/* Background Spotlight Mask Layer */}
      {targetRect ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(2, 6, 23, 0.75)"
            mask="url(#spotlight-mask)"
          />
          {/* Highlight glowing border around target */}
          <rect
            x={targetRect.left - 8}
            y={targetRect.top - 8}
            width={targetRect.width + 16}
            height={targetRect.height + 16}
            rx="16"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="animate-pulse"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" />
      )}

      {/* Tour Tooltip Card */}
      <div
        className="fixed z-50 bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col justify-between space-y-4 animate-in fade-in zoom-in-95 duration-200"
        style={getTooltipStyle()}
      >
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              {currentStep.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {currentStep.badge}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pro Tips:
              </span>
              <ul className="space-y-1">
                {currentStep.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          {/* Progress Dots */}
          <div className="flex items-center space-x-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStepIndex
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Get Started!' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
