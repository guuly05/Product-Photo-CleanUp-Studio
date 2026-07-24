import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Zap,
  Clock,
  Images,
  FolderArchive,
  Trophy,
  Sparkles,
  RotateCcw,
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  Lock,
  Flame,
  Layers,
  Sliders,
  PlusCircle
} from 'lucide-react';
import {
  WorkspaceStats,
  getWorkspaceStats,
  saveWorkspaceStats,
  recordImageEditStats,
  formatTimeSaved,
  calculateUserLevelAndXp,
  DEFAULT_WORKSPACE_STATS
} from '../utils/workspaceStats';

interface WorkspaceStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatsUpdated?: (stats: WorkspaceStats) => void;
}

export const WorkspaceStatsModal: React.FC<WorkspaceStatsModalProps> = ({
  isOpen,
  onClose,
  onStatsUpdated,
}) => {
  const [stats, setStats] = useState<WorkspaceStats>(getWorkspaceStats());

  useEffect(() => {
    if (isOpen) {
      const current = getWorkspaceStats();
      setStats(current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const timeSaved = formatTimeSaved(stats.timeSavedMinutes);
  const gamification = calculateUserLevelAndXp(stats);

  const handleSimulateEdit = () => {
    const updated = recordImageEditStats(1, true);
    setStats(updated);
    if (onStatsUpdated) onStatsUpdated(updated);
  };

  const handleResetStats = () => {
    if (confirm('Are you sure you want to reset all workspace productivity statistics?')) {
      saveWorkspaceStats(DEFAULT_WORKSPACE_STATS);
      setStats(DEFAULT_WORKSPACE_STATS);
      if (onStatsUpdated) onStatsUpdated(DEFAULT_WORKSPACE_STATS);
    }
  };

  // Badges definition based on live stats
  const BADGES = [
    {
      id: 'batch_wizard',
      title: 'Batch Wizard',
      desc: 'Processed 10+ photos in ZIP batch',
      icon: FolderArchive,
      unlocked: stats.batchImagesProcessed >= 10,
      progress: `${Math.min(stats.batchImagesProcessed, 10)}/10`,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'time_saver',
      title: 'AI Speedster',
      desc: 'Saved >1 hour of manual editing time',
      icon: Clock,
      unlocked: stats.timeSavedMinutes >= 60,
      progress: `${Math.min(Math.round(stats.timeSavedMinutes), 60)}/60 min`,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'retouch_pro',
      title: 'Studio Master',
      desc: 'Completed 10+ AI photo edits',
      icon: Sparkles,
      unlocked: stats.totalImagesEdited >= 10,
      progress: `${Math.min(stats.totalImagesEdited, 10)}/10`,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'prompt_architect',
      title: 'Prompt Architect',
      desc: 'Executed 20+ AI prompt instructions',
      icon: Zap,
      unlocked: stats.aiPromptsRun >= 20,
      progress: `${Math.min(stats.aiPromptsRun, 20)}/20`,
      color: 'from-cyan-500 to-blue-600',
    },
  ];

  // Weekly mockup throughput
  const WEEKLY_DATA = [
    { day: 'Mon', count: 3, label: '3 photos' },
    { day: 'Tue', count: 5, label: '5 photos' },
    { day: 'Wed', count: 2, label: '2 photos' },
    { day: 'Thu', count: 8, label: '8 photos' },
    { day: 'Fri', count: Math.max(1, stats.totalImagesEdited - 12), label: `${Math.max(1, stats.totalImagesEdited - 12)} photos` },
    { day: 'Sat', count: 4, label: '4 photos' },
    { day: 'Sun', count: 6, label: '6 photos' },
  ];
  const maxWeeklyCount = Math.max(...WEEKLY_DATA.map((d) => d.count), 1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-lg text-white">Workspace Stats Dashboard</h2>
                <span className="text-[10px] font-mono uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Gamified
                </span>
              </div>
              <p className="text-xs text-slate-400">Track your productivity, AI time savings, and editor level</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Rank & Level Progress Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-amber-300 text-lg">
                    L{gamification.level}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base text-white">{gamification.rankTitle}</span>
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      <span>{stats.streakDays} Day Streak</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Total XP: <span className="text-indigo-300 font-bold">{gamification.xp.toLocaleString()} XP</span>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono text-purple-300 font-semibold">
                  {gamification.currentLevelXp} / {gamification.nextLevelXp} XP to Level {gamification.level + 1}
                </span>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${gamification.progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3 Core Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Images Edited */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Images Edited</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Images className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{stats.totalImagesEdited}</span>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{stats.aiPromptsRun} AI edits
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Retouched & exported images</p>
            </div>

            {/* Card 2: Time Saved */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Saved</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-400">{timeSaved.formatted}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (~4.5 min/img)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">vs. manual Photoshop editing</p>
            </div>

            {/* Card 3: Batch Processing */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Runs</span>
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <FolderArchive className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-amber-300">{stats.batchJobsCompleted}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({stats.batchImagesProcessed} items)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Automated ZIP catalog jobs</p>
            </div>
          </div>

          {/* Badges & Achievements Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Achievements & Badges</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Unlocked {BADGES.filter((b) => b.unlocked).length} / {BADGES.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const IconComponent = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`border rounded-2xl p-3.5 flex items-center space-x-3 transition ${
                      badge.unlocked
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        badge.unlocked
                          ? `bg-gradient-to-br ${badge.color} text-white shadow-md`
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {badge.unlocked ? (
                        <IconComponent className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>
                          {badge.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {badge.progress}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Throughput Activity Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Weekly Retouch Output</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">7-Day Activity</span>
            </div>

            <div className="h-24 flex items-end justify-between gap-2 pt-4 px-2">
              {WEEKLY_DATA.map((d) => {
                const barHeightPct = Math.min(100, Math.max(15, Math.round((d.count / maxWeeklyCount) * 100)));
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition text-[10px] font-mono bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {d.label}
                    </div>
                    <div className="w-full bg-slate-900 rounded-t-lg h-16 flex items-end overflow-hidden p-0.5">
                      <div
                        className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t transition-all duration-300"
                        style={{ height: `${barHeightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateEdit}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
              title="Add 1 edit to test XP gain"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Simulate Edit</span>
            </button>

            <button
              onClick={handleResetStats}
              className="px-3 py-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-900/40 text-xs font-semibold transition flex items-center space-x-1.5"
              title="Reset statistics to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
