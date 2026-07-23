import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { InstructionConsole } from './components/InstructionConsole';
import { AdjustmentsPanel } from './components/AdjustmentsPanel';
import { HistoryTimeline } from './components/HistoryTimeline';
import { SamplePickerModal } from './components/SamplePickerModal';
import { SAMPLE_PRODUCTS } from './data/samples';
import {
  EditHistoryItem,
  ImageAdjustments,
  BackgroundSettings,
  ShadowSettings,
  SampleProduct
} from './types';
import { exportEditedPhoto } from './utils/canvasExport';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client tools state
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(INITIAL_ADJUSTMENTS);
  const [background, setBackground] = useState<BackgroundSettings>(INITIAL_BG);
  const [shadow, setShadow] = useState<ShadowSettings>(INITIAL_SHADOW);

  const currentStep = history[historyIndex] || history[0];
  const originalStep = history[0];

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
        onReset={handleReset}
        onDownload={handleDownload}
        isComparing={isComparing}
        onToggleCompare={() => setIsComparing(!isComparing)}
        showAdjustments={showAdjustments}
        onToggleAdjustments={() => setShowAdjustments(!showAdjustments)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        hasEditedImage={history.length > 1}
        historyCount={history.length}
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
            />

            {/* History Steps Bar under Canvas */}
            <HistoryTimeline
              history={history}
              currentIndex={historyIndex}
              onSelectHistoryItem={setHistoryIndex}
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

    </div>
  );
}
