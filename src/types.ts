export type Phase = 'work' | 'short' | 'long';

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  totalCycles: number;
  autoStartNext: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface PhaseMeta {
  label: string;
  emoji: string;
}
