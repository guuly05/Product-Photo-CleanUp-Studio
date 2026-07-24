export interface WorkspaceStats {
  totalImagesEdited: number;
  timeSavedMinutes: number;
  batchJobsCompleted: number;
  batchImagesProcessed: number;
  aiPromptsRun: number;
  streakDays: number;
  lastActiveDate: string;
}

export const STORAGE_KEY = 'studio_workspace_stats';

export const DEFAULT_WORKSPACE_STATS: WorkspaceStats = {
  totalImagesEdited: 14,
  timeSavedMinutes: 105, // 1 hour 45 minutes saved
  batchJobsCompleted: 3,
  batchImagesProcessed: 18,
  aiPromptsRun: 22,
  streakDays: 5,
  lastActiveDate: new Date().toISOString().slice(0, 10),
};

export function getWorkspaceStats(): WorkspaceStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWorkspaceStats(DEFAULT_WORKSPACE_STATS);
      return DEFAULT_WORKSPACE_STATS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_WORKSPACE_STATS,
      ...parsed,
    };
  } catch (err) {
    console.error('Failed reading workspace stats from localStorage:', err);
    return DEFAULT_WORKSPACE_STATS;
  }
}

export function saveWorkspaceStats(stats: WorkspaceStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed saving workspace stats:', err);
  }
}

export function recordImageEditStats(count: number = 1, isAiEdit: boolean = true): WorkspaceStats {
  const current = getWorkspaceStats();
  const timeSavedPerEdit = isAiEdit ? 4.5 : 1.5; // ~4.5 mins saved per AI retouch vs Photoshop
  const updated: WorkspaceStats = {
    ...current,
    totalImagesEdited: current.totalImagesEdited + count,
    timeSavedMinutes: Math.round((current.timeSavedMinutes + count * timeSavedPerEdit) * 10) / 10,
    aiPromptsRun: current.aiPromptsRun + (isAiEdit ? count : 0),
    lastActiveDate: new Date().toISOString().slice(0, 10),
  };
  saveWorkspaceStats(updated);
  return updated;
}

export function recordBatchJobStats(batchCount: number): WorkspaceStats {
  const current = getWorkspaceStats();
  const timeSavedPerBatchImage = 5.0; // 5 mins saved per image in automated batch job
  const updated: WorkspaceStats = {
    ...current,
    batchJobsCompleted: current.batchJobsCompleted + 1,
    batchImagesProcessed: current.batchImagesProcessed + batchCount,
    totalImagesEdited: current.totalImagesEdited + batchCount,
    timeSavedMinutes: Math.round((current.timeSavedMinutes + batchCount * timeSavedPerBatchImage) * 10) / 10,
    lastActiveDate: new Date().toISOString().slice(0, 10),
  };
  saveWorkspaceStats(updated);
  return updated;
}

export function formatTimeSaved(minutes: number): { hours: number; mins: number; formatted: string } {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) {
    return { hours, mins, formatted: `${mins}m` };
  }
  return { hours, mins, formatted: `${hours}h ${mins}m` };
}

export function calculateUserLevelAndXp(stats: WorkspaceStats) {
  // Gamification logic: 100 XP per image edit, 150 XP per batch item, 50 XP per AI prompt
  const xp = (stats.totalImagesEdited * 100) + (stats.batchImagesProcessed * 150) + (stats.aiPromptsRun * 50);
  const level = Math.max(1, Math.floor(xp / 750) + 1);
  const currentLevelXp = xp % 750;
  const nextLevelXp = 750;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  let rankTitle = 'Studio Apprentice';
  if (level >= 10) rankTitle = 'Legendary Studio Master';
  else if (level >= 7) rankTitle = 'Senior Retouch Specialist';
  else if (level >= 5) rankTitle = 'AI Catalog Pro';
  else if (level >= 3) rankTitle = 'Product Photo Artist';

  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    rankTitle,
  };
}
