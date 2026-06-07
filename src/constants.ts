import type { Phase, PhaseMeta, PomodoroSettings } from './types';

export const STORAGE_KEY = 'pomodoro-pwa:settings';

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  totalCycles: 4,
  autoStartNext: true,
  soundEnabled: true,
  notificationsEnabled: true,
};

export const PHASE_META: Record<Phase, PhaseMeta> = {
  work: { label: 'Focus', emoji: '🍅' },
  short: { label: 'Short Break', emoji: '☕' },
  long: { label: 'Long Break', emoji: '🌴' },
};

// Validation bounds (in minutes / counts)
export const LIMITS = {
  minMinutes: 1,
  maxMinutes: 90,
  minCount: 1,
  maxCount: 12,
} as const;
