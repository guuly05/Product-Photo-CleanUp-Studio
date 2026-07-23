import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { InstructionConsole } from './components/InstructionConsole';
import { AdjustmentsPanel } from './components/AdjustmentsPanel';
import { HistoryTimeline } from './components/HistoryTimeline';
import { SamplePickerModal } from './components/SamplePickerModal';
import { BatchProcessorModal } from './components/BatchProcessorModal';
import { ImageInfoModal } from './components/ImageInfoModal';
import { GuidedTour } from './components/GuidedTour';
import { SAMPLE_PRODUCTS } from './data/samples';
import {
  EditHistoryItem,
  ImageAdjustments,
  BackgroundSettings,
  ShadowSettings,
  SampleProduct,
  LightingAnalysisResult
} from './types';
import { exportEditedPhoto, exportAllHistoryAsZip } from './utils/canvasExport';
import { Sparkles, Sliders, Upload, ShieldCheck } from 'lucide-react';

const INITIAL_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  sharpness: 0,
};

const INITIAL_BG: BackgroundSettings = {
  mode: 'original',
  color: '#FFFFFF',
};

const INITIAL_SHADOW: ShadowSettings = {
  enabled: false,
  opacity: 35,
  blur: 15,
  offsetY: 12,
  color: '#000000',
};

export default function App() {
  // Sample Sneaker default
  const defaultSample = SAMPLE_PRODUCTS[0];

  const [history, setHistory] = useState<EditHistoryItem[]>([
    {
      id: 'original-1',
      timestamp: Date.now(),
      imageUrl: defaultSample.url,
      prompt: 'Original product photo',
      label: 'Original Upload',
      type: 'original',
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-image');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('1:1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activePromptText, setActivePromptText] = useState<string>('');
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [showAdjustments, setShowAdjustments] = useState<boolean>(true);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isImageInfoModalOpen, setIsImageInfoModalOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-trigger tour on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenPhotoStudioTour');
    if (!hasSeenTour) {
      // Delay slightly so layout renders cleanly
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('hasSeenPhotoStudioTour', 'true');
  };

  // Client tools state
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(INITIAL_ADJUSTMENTS);
  const [background, setBackground] = useState<BackgroundSettings>(INITIAL_BG);
  const [shadow, setShadow] = useState<ShadowSettings>(INITIAL_SHADOW);

  // Tool Undo / Redo Stack State
  interface ToolSnapshot {
    adjustments: ImageAdjustments;
    background: BackgroundSettings;
    shadow: ShadowSettings;
  }

  const [toolHistory, setToolHistory] = useState<ToolSnapshot[]>([
    { adjustments: INITIAL_ADJUSTMENTS, background: INITIAL_BG, shadow: INITIAL_SHADOW }
  ]);
  const [toolPointer, setToolPointer] = useState<number>(0);
  const isUndoRedoRef = useRef<boolean>(false);
  const lastChangeTimeRef = useRef<number>(Date.now());

  // Record tool adjustment changes into Undo/Redo stack
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const currentSnapshot = toolHistory[toolPointer];
    if (
      currentSnapshot &&
      JSON.stringify(currentSnapshot.adjustments) === JSON.stringify(adjustments) &&
      JSON.stringify(currentSnapshot.background) === JSON.stringify(background) &&
      JSON.stringify(currentSnapshot.shadow) === JSON.stringify(shadow)
    ) {
      return;
    }

    const newSnapshot: ToolSnapshot = {
      adjustments,
      background,
      shadow,
    };

    const now = Date.now();
    const timeDiff = now - lastChangeTimeRef.current;
    lastChangeTimeRef.current = now;

    if (timeDiff < 400 && toolHistory.length > 0) {
      // Update active pointer in place during fast continuous slider drag
      setToolHistory(prev => {
        const updated = [...prev];
        if (updated[toolPointer]) {
          updated[toolPointer] = newSnapshot;
        }
        return updated;
      });
    } else {
      // Truncate redo stack and push new snapshot
      setToolHistory(prev => {
        const truncated = prev.slice(0, toolPointer + 1);
        return [...truncated, newSnapshot];
      });
      setToolPointer(prev => prev + 1);
    }
  }, [adjustments, background, shadow]);

  // Undo / Redo Tool Actions
  const canUndoTool = toolPointer > 0;
  const canRedoTool = toolPointer < toolHistory.length - 1;

  const handleToolUndo = () => {
    if (toolPointer <= 0) return;
    const targetIndex = toolPointer - 1;
    const targetSnapshot = toolHistory[targetIndex];
    if (targetSnapshot) {
      isUndoRedoRef.current = true;
      setToolPointer(targetIndex);
      setAdjustments(targetSnapshot.adjustments);
      setBackground(targetSnapshot.background);
      setShadow(targetSnapshot.shadow);
    }
  };

  const handleToolRedo = () => {
    if (toolPointer >= toolHistory.length - 1) return;
    const targetIndex = toolPointer + 1;
    const targetSnapshot = toolHistory[targetIndex];
    if (targetSnapshot) {
      isUndoRedoRef.current = true;
      setToolPointer(targetIndex);
      setAdjustments(targetSnapshot.adjustments);
      setBackground(targetSnapshot.background);
      setShadow(targetSnapshot.shadow);
    }
  };

  // Keyboard shortcut listener for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleToolUndo();
      } else if (
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (isCmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleToolRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toolPointer, toolHistory]);

  // AI Lighting Analysis state
  const [isAnalyzingLighting, setIsAnalyzingLighting] = useState<boolean>(false);
  const [lastLightingAnalysis, setLastLightingAnalysis] = useState<LightingAnalysisResult | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  const currentStep = history[historyIndex] || history[0];
  const originalStep = history[0];

  // Preserve individual edited settings on the active history item
  useEffect(() => {
    setHistory(prev => {
      if (!prev[historyIndex]) return prev;
      const currentItem = prev[historyIndex];
      // Only update if changed
      if (
        currentItem.adjustments === adjustments &&
        currentItem.background === background &&
        currentItem.shadow === shadow
      ) {
        return prev;
      }
      const updated = [...prev];
      updated[historyIndex] = {
        ...currentItem,
        adjustments,
        background,
        shadow,
      };
      return updated;
    });
  }, [adjustments, background, shadow, historyIndex]);

  // Handle switching active history step and restoring its saved settings
  const handleSelectHistoryItem = (index: number) => {
    setHistoryIndex(index);
    const item = history[index];
    if (item) {
      const adj = item.adjustments || INITIAL_ADJUSTMENTS;
      const bg = item.background || INITIAL_BG;
      const shd = item.shadow || INITIAL_SHADOW;
      isUndoRedoRef.current = true;
      setAdjustments(adj);
      setBackground(bg);
      setShadow(shd);
      setToolHistory([{ adjustments: adj, background: bg, shadow: shd }]);
      setToolPointer(0);
    }
  };

  // Smart Eraser Apply Handler
  const handleSmartEraserApply = (newImageUrl: string, label: string) => {
    const newStep: EditHistoryItem = {
      id: `eraser-${Date.now()}`,
      timestamp: Date.now(),
      imageUrl: newImageUrl,
      prompt: 'Smart Eraser artifact removal touch-up',
      label: label || 'Smart Eraser Touch-Up',
      type: 'ai_edit',
      adjustments: { ...adjustments },
      background: { ...background },
      shadow: { ...shadow },
    };

    const newHistory = [...history.slice(0, historyIndex + 1), newStep];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Export all history items as ZIP
  const handleExportAllZip = async () => {
    setIsExportingZip(true);
    setErrorMessage(null);
    try {
      await exportAllHistoryAsZip(history, adjustments, background, shadow);
    } catch (err: any) {
      console.error('Export ZIP failed:', err);
      setErrorMessage(err.message || 'Failed to generate history ZIP package.');
    } finally {
      setIsExportingZip(false);
    }
  };

  // AI Lighting Analysis Handler
  const handleAnalyzeLighting = async () => {
    if (!currentStep?.imageUrl) return;
    setIsAnalyzingLighting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-lighting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: currentStep.imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze lighting with AI model');
      }

      const analysis: LightingAnalysisResult = data.analysis;
      setLastLightingAnalysis(analysis);

      // Auto apply suggested adjustments
      if (typeof analysis.brightness === 'number') {
        setAdjustments(prev => ({
          ...prev,
          brightness: analysis.brightness,
          contrast: analysis.contrast,
          saturation: analysis.saturation,
        }));
      }

      if (analysis.shadow) {
        setShadow({
          enabled: Boolean(analysis.shadow.enabled),
          opacity: Math.min(100, Math.max(0, analysis.shadow.opacity ?? 35)),
          blur: Math.min(50, Math.max(0, analysis.shadow.blur ?? 15)),
          offsetY: Math.min(40, Math.max(0, analysis.shadow.offsetY ?? 12)),
          color: '#000000',
        });
      }

      if (analysis.suggestedBackdropColor && analysis.suggestedBackdropColor.startsWith('#')) {
        setBackground({
          mode: 'color',
          color: analysis.suggestedBackdropColor,
        });
      }
    } catch (err: any) {
      console.error('Analyze lighting error:', err);
      setErrorMessage(err.message || 'Failed to analyze photo lighting.');
    } finally {
      setIsAnalyzingLighting(false);
    }
  };

  // Submit AI Prompt to Server Route
  const handleSubmitPrompt = async (promptText: string, aspectRatio?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setActivePromptText(promptText);

    try {
      const response = await fetch('/api/edit-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: currentStep.imageUrl,
          prompt: promptText,
          aspectRatio: aspectRatio || selectedAspectRatio,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to edit photo with Gemini API');
      }

      const newStep: EditHistoryItem = {
        id: `edit-${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: data.imageUrl,
        prompt: promptText,
        label: promptText.length > 30 ? promptText.slice(0, 30) + '...' : promptText,
        type: 'ai_edit',
      };

      const newHistory = [...history.slice(0, historyIndex + 1), newStep];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setIsComparing(true); // Automatically show split view after edit so user can appreciate the cleanup!
    } catch (err: any) {
      console.error('Submit prompt error:', err);
      setErrorMessage(err.message || 'An error occurred while processing image instructions.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload user file
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const url = e.target.result as string;
        const newStep: EditHistoryItem = {
          id: `upload-${Date.now()}`,
          timestamp: Date.now(),
          imageUrl: url,
          prompt: 'Uploaded custom product photo',
          label: file.name,
          type: 'original',
        };
        setHistory([newStep]);
        setHistoryIndex(0);
        setIsComparing(false);
        setErrorMessage(null);
        // Reset client tools
        setAdjustments(INITIAL_ADJUSTMENTS);
        setBackground(INITIAL_BG);
        setShadow(INITIAL_SHADOW);
      }
    };
    reader.readAsDataURL(file);
  };

  // Select sample photo
  const handleSelectSample = (sample: SampleProduct) => {
    const newStep: EditHistoryItem = {
      id: `sample-${Date.now()}`,
      timestamp: Date.now(),
      imageUrl: sample.url,
      prompt: `Sample: ${sample.name}`,
      label: sample.name,
      type: 'original',
    };
    setHistory([newStep]);
    setHistoryIndex(0);
    setIsComparing(false);
    setErrorMessage(null);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setBackground(INITIAL_BG);
    setShadow(INITIAL_SHADOW);
  };

  // Reset to original upload
  const handleReset = () => {
    setHistoryIndex(0);
    setIsComparing(false);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setBackground(INITIAL_BG);
    setShadow(INITIAL_SHADOW);
    setErrorMessage(null);
  };

  // Reset client tools
  const handleResetTools = () => {
    setAdjustments(INITIAL_ADJUSTMENTS);
    setBackground(INITIAL_BG);
    setShadow(INITIAL_SHADOW);
  };

  // Download HQ Image
  const handleDownload = async (format: 'png' | 'jpeg', transparent: boolean) => {
    try {
      await exportEditedPhoto(
        currentStep.imageUrl,
        adjustments,
        background,
        shadow,
        format,
        transparent
      );
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Top Application Navigation */}
      <Header
        onOpenSamples={() => setIsSampleModalOpen(true)}
        onOpenBatchProcessor={() => setIsBatchModalOpen(true)}
        onReset={handleReset}
        onDownload={handleDownload}
        onExportAllZip={handleExportAllZip}
        isComparing={isComparing}
        onToggleCompare={() => setIsComparing(!isComparing)}
        showAdjustments={showAdjustments}
        onToggleAdjustments={() => setShowAdjustments(!showAdjustments)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        hasEditedImage={history.length > 1}
        historyCount={history.length}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Upper Workspace: Before/After Canvas Viewport + Optional Post-Processing Tools Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Photo Viewport Canvas */}
          <div className={showAdjustments ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
            <BeforeAfterSlider
              originalUrl={originalStep.imageUrl}
              currentUrl={currentStep.imageUrl}
              isComparing={isComparing}
              adjustments={adjustments}
              background={background}
              shadow={shadow}
              isProcessing={isProcessing}
              activePrompt={activePromptText}
              onSmartEraserApply={handleSmartEraserApply}
              onOpenImageInfo={() => setIsImageInfoModalOpen(true)}
            />

            {/* History Steps Bar under Canvas */}
            <HistoryTimeline
              history={history}
              currentIndex={historyIndex}
              onSelectHistoryItem={handleSelectHistoryItem}
              onExportAllZip={handleExportAllZip}
              isExportingZip={isExportingZip}
            />
          </div>

          {/* Right Tools Sidebar (Post-Processing, Shadows, Background Fill) */}
          {showAdjustments && (
            <div className="lg:col-span-4 space-y-4">
              <AdjustmentsPanel
                adjustments={adjustments}
                onChangeAdjustments={setAdjustments}
                background={background}
                onChangeBackground={setBackground}
                shadow={shadow}
                onChangeShadow={setShadow}
                onResetTools={handleResetTools}
                onAnalyzeLighting={handleAnalyzeLighting}
                isAnalyzingLighting={isAnalyzingLighting}
                lastLightingAnalysis={lastLightingAnalysis}
                onApplyRecommendedPrompt={handleSubmitPrompt}
                canUndoTool={canUndoTool}
                canRedoTool={canRedoTool}
                onUndoTool={handleToolUndo}
                onRedoTool={handleToolRedo}
              />
            </div>
          )}

        </div>

        {/* Lower Console: Prompt Input + Categorized Quick Presets */}
        <div className="w-full">
          <InstructionConsole
            onSubmitPrompt={handleSubmitPrompt}
            onUploadImage={handleUploadImage}
            isProcessing={isProcessing}
            selectedAspectRatio={selectedAspectRatio}
            onSelectAspectRatio={setSelectedAspectRatio}
            error={errorMessage}
          />
        </div>

      </main>

      {/* Footer info bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Commercial E-Commerce Retouching Powered by Gemini AI</span>
          </div>
          <div className="text-slate-600">
            Model: <span className="font-mono text-slate-400">{selectedModel}</span>
          </div>
        </div>
      </footer>

      {/* Sample Picker Modal */}
      <SamplePickerModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      {/* Batch Processor ZIP Modal */}
      <BatchProcessorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        selectedModel={selectedModel}
        onLoadImageToStudio={(imageUrl, label) => {
          const newStep: EditHistoryItem = {
            id: `batch-item-${Date.now()}`,
            timestamp: Date.now(),
            imageUrl,
            prompt: 'Batch processed product photo',
            label,
            type: 'ai_edit',
            adjustments: { ...INITIAL_ADJUSTMENTS },
            background: { ...INITIAL_BG },
            shadow: { ...INITIAL_SHADOW },
          };
          setHistory([newStep]);
          setHistoryIndex(0);
        }}
      />

      {/* Asset EXIF Metadata & Platform Specs Info Modal */}
      <ImageInfoModal
        isOpen={isImageInfoModalOpen}
        onClose={() => setIsImageInfoModalOpen(false)}
        currentStep={currentStep}
        currentUrl={currentStep.imageUrl}
        totalHistorySteps={history.length}
      />

      {/* Guided Tour Overlay */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
      />

    </div>
  );
}
