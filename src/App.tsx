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
import { RestoreSessionModal } from './components/RestoreSessionModal';
import { WorkspaceStatsModal } from './components/WorkspaceStatsModal';
import { SAMPLE_PRODUCTS } from './data/samples';
import {
  EditHistoryItem,
  ImageAdjustments,
  BackgroundSettings,
  ShadowSettings,
  WatermarkSettings,
  SampleProduct,
  LightingAnalysisResult,
  SavedSessionData
} from './types';
import { exportEditedPhoto, exportAllHistoryAsZip } from './utils/canvasExport';
import { analyzeProductImageTags } from './utils/tagAnalysis';
import {
  WorkspaceStats,
  getWorkspaceStats,
  recordImageEditStats,
  recordBatchJobStats
} from './utils/workspaceStats';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  syncUserProfile,
  saveUserWorkspaceStats,
  subscribeToWorkspaceStats,
  User
} from './lib/firebase';
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

const INITIAL_WATERMARK: WatermarkSettings = {
  enabled: false,
  text: 'BRAND LOGO',
  position: 'bottom-right',
  opacity: 60,
  scale: 100,
  color: '#FFFFFF',
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
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats>(getWorkspaceStats());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Firebase Auth & Firestore State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user workspace stats in Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToWorkspaceStats(currentUser.uid, (remoteStats) => {
      if (remoteStats) {
        setWorkspaceStats((prev) => ({
          ...prev,
          ...remoteStats,
        }));
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Persist workspace stats updates to Firestore
  useEffect(() => {
    if (currentUser?.uid && workspaceStats) {
      saveUserWorkspaceStats(currentUser.uid, workspaceStats);
    }
  }, [workspaceStats, currentUser]);

  const handleSignInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await syncUserProfile(res.user);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  // AI Product Tags & Taxonomy State
  const [productTags, setProductTags] = useState<string[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<string>('Product Catalog');
  const [isAnalyzingTags, setIsAnalyzingTags] = useState<boolean>(false);

  // Trigger AI Tag Analysis for current active photo
  const triggerTagAnalysis = async (imageUrl: string, filename: string = '') => {
    if (!imageUrl) return;
    setIsAnalyzingTags(true);
    try {
      const res = await analyzeProductImageTags(imageUrl, filename);
      setProductTags(res.tags);
      setPrimaryCategory(res.primaryCategory);
    } catch (err) {
      console.error('Failed AI tag analysis:', err);
    } finally {
      setIsAnalyzingTags(false);
    }
  };

  // Initial tag analysis for default active photo on mount
  useEffect(() => {
    if (SAMPLE_PRODUCTS.length > 0) {
      triggerTagAnalysis(SAMPLE_PRODUCTS[0].url, SAMPLE_PRODUCTS[0].name);
    }
  }, []);

  // Tag Management Handlers
  const handleAddCustomTag = (tag: string) => {
    const clean = tag.toLowerCase().trim();
    if (clean && !productTags.includes(clean)) {
      setProductTags(prev => [...prev, clean]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setProductTags(prev => prev.filter(t => t !== tag));
  };

  // Auto-Save & Restore Session State
  const [pendingSession, setPendingSession] = useState<SavedSessionData | null>(null);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);

  // Check for previous un-exported session on initial load
  useEffect(() => {
    try {
      const rawSession = localStorage.getItem('product_studio_active_session');
      if (rawSession) {
        const parsed: SavedSessionData = JSON.parse(rawSession);
        if (parsed && Array.isArray(parsed.history) && parsed.history.length > 0) {
          setPendingSession(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved studio session from localStorage:', err);
    }
  }, []);

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
  const [watermark, setWatermark] = useState<WatermarkSettings>(INITIAL_WATERMARK);

  // 30-Second Auto-Save Interval to localStorage
  useEffect(() => {
    const saveSession = () => {
      if (!history || history.length === 0) return;

      const sessionData: SavedSessionData = {
        savedAt: Date.now(),
        history,
        historyIndex,
        adjustments,
        background,
        shadow,
        watermark,
      };

      try {
        localStorage.setItem('product_studio_active_session', JSON.stringify(sessionData));
        setLastAutoSavedAt(Date.now());
      } catch (err) {
        console.warn('Auto-save session to localStorage failed:', err);
      }
    };

    // Run initial auto-save after 3 seconds, then every 30 seconds
    const initialTimeout = setTimeout(saveSession, 3000);
    const interval = setInterval(saveSession, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [history, historyIndex, adjustments, background, shadow, watermark]);

  // Session Restore / Discard Action Handlers
  const handleRestoreSession = () => {
    if (!pendingSession) return;
    setHistory(pendingSession.history);
    setHistoryIndex(pendingSession.historyIndex || 0);
    setAdjustments(pendingSession.adjustments || INITIAL_ADJUSTMENTS);
    setBackground(pendingSession.background || INITIAL_BG);
    setShadow(pendingSession.shadow || INITIAL_SHADOW);
    setWatermark(pendingSession.watermark || INITIAL_WATERMARK);
    setToolHistory([
      {
        adjustments: pendingSession.adjustments || INITIAL_ADJUSTMENTS,
        background: pendingSession.background || INITIAL_BG,
        shadow: pendingSession.shadow || INITIAL_SHADOW,
        watermark: pendingSession.watermark || INITIAL_WATERMARK,
      },
    ]);
    setToolPointer(0);
    setLastAutoSavedAt(pendingSession.savedAt);
    setPendingSession(null);
  };

  const handleDiscardSession = () => {
    localStorage.removeItem('product_studio_active_session');
    setPendingSession(null);
  };

  // Tool Undo / Redo Stack State
  interface ToolSnapshot {
    adjustments: ImageAdjustments;
    background: BackgroundSettings;
    shadow: ShadowSettings;
    watermark: WatermarkSettings;
  }

  const [toolHistory, setToolHistory] = useState<ToolSnapshot[]>([
    { adjustments: INITIAL_ADJUSTMENTS, background: INITIAL_BG, shadow: INITIAL_SHADOW, watermark: INITIAL_WATERMARK }
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
      JSON.stringify(currentSnapshot.shadow) === JSON.stringify(shadow) &&
      JSON.stringify(currentSnapshot.watermark) === JSON.stringify(watermark)
    ) {
      return;
    }

    const newSnapshot: ToolSnapshot = {
      adjustments,
      background,
      shadow,
      watermark,
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
  }, [adjustments, background, shadow, watermark]);

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
      setWatermark(targetSnapshot.watermark || INITIAL_WATERMARK);
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
      setWatermark(targetSnapshot.watermark || INITIAL_WATERMARK);
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
  const [isHeatmapVisible, setIsHeatmapVisible] = useState<boolean>(false);
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
        currentItem.shadow === shadow &&
        currentItem.watermark === watermark
      ) {
        return prev;
      }
      const updated = [...prev];
      updated[historyIndex] = {
        ...currentItem,
        adjustments,
        background,
        shadow,
        watermark,
      };
      return updated;
    });
  }, [adjustments, background, shadow, watermark, historyIndex]);

  // Handle switching active history step and restoring its saved settings
  const handleSelectHistoryItem = (index: number) => {
    setHistoryIndex(index);
    const item = history[index];
    if (item) {
      const adj = item.adjustments || INITIAL_ADJUSTMENTS;
      const bg = item.background || INITIAL_BG;
      const shd = item.shadow || INITIAL_SHADOW;
      const wtm = item.watermark || INITIAL_WATERMARK;
      isUndoRedoRef.current = true;
      setAdjustments(adj);
      setBackground(bg);
      setShadow(shd);
      setWatermark(wtm);
      setToolHistory([{ adjustments: adj, background: bg, shadow: shd, watermark: wtm }]);
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
      watermark: { ...watermark },
    };

    const newHistory = [...history.slice(0, historyIndex + 1), newStep];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Smart Crop Apply Handler
  const handleSmartCropApply = (croppedImageUrl: string, label: string) => {
    const newStep: EditHistoryItem = {
      id: `crop-${Date.now()}`,
      timestamp: Date.now(),
      imageUrl: croppedImageUrl,
      prompt: 'Smart Aspect Ratio Crop auto-framing',
      label: label || 'Smart Crop',
      type: 'adjustment',
      adjustments: { ...adjustments },
      background: { ...background },
      shadow: { ...shadow },
      watermark: { ...watermark },
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
      await exportAllHistoryAsZip(history, adjustments, background, shadow, watermark);
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
      setIsHeatmapVisible(true);

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
      
      // Record workspace stats for AI edit
      const updatedStats = recordImageEditStats(1, true);
      setWorkspaceStats(updatedStats);
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
        setWatermark(INITIAL_WATERMARK);
        // Trigger AI Tag Suggestions
        triggerTagAnalysis(url, file.name);
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
    setWatermark(INITIAL_WATERMARK);
    // Trigger AI Tag Suggestions
    triggerTagAnalysis(sample.url, sample.name);
  };

  // Reset to original upload
  const handleReset = () => {
    setHistoryIndex(0);
    setIsComparing(false);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setBackground(INITIAL_BG);
    setShadow(INITIAL_SHADOW);
    setWatermark(INITIAL_WATERMARK);
    setErrorMessage(null);
  };

  // Reset client tools
  const handleResetTools = () => {
    setAdjustments(INITIAL_ADJUSTMENTS);
    setBackground(INITIAL_BG);
    setShadow(INITIAL_SHADOW);
    setWatermark(INITIAL_WATERMARK);
  };

  // Download HQ Image
  const handleDownload = async (format: 'png' | 'jpeg', transparent: boolean) => {
    try {
      await exportEditedPhoto(
        currentStep.imageUrl,
        adjustments,
        background,
        shadow,
        watermark,
        format,
        transparent
      );
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image. Please try again.');
    }
  };

  // Download Current Tool Configuration Settings JSON
  const handleDownloadSettings = () => {
    const settingsExport = {
      app: "Product Photo Studio AI",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      configuration: {
        adjustments,
        shadow,
        watermark,
        background,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settingsExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `studio-preset-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Tool Configuration Settings JSON
  const handleImportSettings = (parsedData: any) => {
    const config = parsedData?.configuration || parsedData;
    if (!config) return;

    if (config.adjustments) setAdjustments(config.adjustments);
    if (config.shadow) setShadow(config.shadow);
    if (config.watermark) setWatermark(config.watermark);
    if (config.background) setBackground(config.background);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Top Application Navigation */}
      <Header
        onOpenSamples={() => setIsSampleModalOpen(true)}
        onOpenBatchProcessor={() => setIsBatchModalOpen(true)}
        onOpenWorkspaceStats={() => setIsStatsModalOpen(true)}
        workspaceStats={workspaceStats}
        onReset={handleReset}
        onDownload={handleDownload}
        onExportAllZip={handleExportAllZip}
        onDownloadSettings={handleDownloadSettings}
        onImportSettings={handleImportSettings}
        isComparing={isComparing}
        onToggleCompare={() => setIsComparing(!isComparing)}
        showAdjustments={showAdjustments}
        onToggleAdjustments={() => setShowAdjustments(!showAdjustments)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        hasEditedImage={history.length > 1}
        historyCount={history.length}
        onStartTour={() => setIsTourOpen(true)}
        lastAutoSavedAt={lastAutoSavedAt}
        user={currentUser}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
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
              watermark={watermark}
              isProcessing={isProcessing}
              activePrompt={activePromptText}
              onSmartEraserApply={handleSmartEraserApply}
              onOpenImageInfo={() => setIsImageInfoModalOpen(true)}
              lightingAnalysis={lastLightingAnalysis}
              isHeatmapVisible={isHeatmapVisible}
              onToggleHeatmap={() => setIsHeatmapVisible(prev => !prev)}
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
                watermark={watermark}
                onChangeWatermark={setWatermark}
                onResetTools={handleResetTools}
                onAnalyzeLighting={handleAnalyzeLighting}
                isAnalyzingLighting={isAnalyzingLighting}
                lastLightingAnalysis={lastLightingAnalysis}
                onApplyRecommendedPrompt={handleSubmitPrompt}
                currentImageUrl={currentStep.imageUrl}
                onApplyCrop={handleSmartCropApply}
                canUndoTool={canUndoTool}
                canRedoTool={canRedoTool}
                onUndoTool={handleToolUndo}
                onRedoTool={handleToolRedo}
                isHeatmapVisible={isHeatmapVisible}
                onToggleHeatmap={() => setIsHeatmapVisible(prev => !prev)}
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
        onBatchCompleted={(count) => {
          const updated = recordBatchJobStats(count);
          setWorkspaceStats(updated);
        }}
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

      {/* Workspace Stats Dashboard Modal */}
      <WorkspaceStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onStatsUpdated={setWorkspaceStats}
      />

      {/* Asset EXIF Metadata & Platform Specs Info Modal */}
      <ImageInfoModal
        isOpen={isImageInfoModalOpen}
        onClose={() => setIsImageInfoModalOpen(false)}
        currentStep={currentStep}
        currentUrl={currentStep.imageUrl}
        totalHistorySteps={history.length}
        productTags={productTags}
        primaryCategory={primaryCategory}
        isAnalyzingTags={isAnalyzingTags}
        onReanalyzeTags={() => currentStep?.imageUrl && triggerTagAnalysis(currentStep.imageUrl, currentStep.label)}
        onAddCustomTag={handleAddCustomTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* Guided Tour Overlay */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
      />

      {/* Restore Unsaved Session Prompt Modal */}
      {pendingSession && (
        <RestoreSessionModal
          sessionData={pendingSession}
          onRestore={handleRestoreSession}
          onDiscard={handleDiscardSession}
        />
      )}

    </div>
  );
}
