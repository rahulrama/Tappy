import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Phase, PomodoroSettings } from '../types';

export type Status = 'idle' | 'running' | 'paused' | 'done';

export interface PomodoroState {
  status: Status;
  phase: Phase;
  secondsLeft: number;
  /** Number of focus sessions fully completed. */
  workSessionsCompleted: number;
  /** 1-based index of the focus session currently in progress / up next. */
  currentWorkSession: number;
}

interface AdvanceResult {
  phase: Phase;
  workSessionsCompleted: number;
  currentWorkSession: number;
  done: boolean;
}

interface UsePomodoroOptions {
  /** Fired when a phase finishes naturally (not via skip). */
  onPhaseComplete?: (finished: Phase, next: Phase | null) => void;
}

const minutesForPhase = (phase: Phase, s: PomodoroSettings): number => {
  switch (phase) {
    case 'work':
      return s.workMinutes;
    case 'short':
      return s.shortBreakMinutes;
    case 'long':
      return s.longBreakMinutes;
  }
};

const secondsForPhase = (phase: Phase, s: PomodoroSettings) =>
  Math.max(1, Math.round(minutesForPhase(phase, s) * 60));

export function usePomodoro(settings: PomodoroSettings, options: UsePomodoroOptions = {}) {
  const { onPhaseComplete } = options;
  const onPhaseCompleteRef = useRef(onPhaseComplete);
  onPhaseCompleteRef.current = onPhaseComplete;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [state, setState] = useState<PomodoroState>(() => ({
    status: 'idle',
    phase: 'work',
    secondsLeft: secondsForPhase('work', settings),
    workSessionsCompleted: 0,
    currentWorkSession: 1,
  }));

  const deadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  /** Given the phase that just ended, compute what comes next. */
  const computeAdvance = useCallback(
    (prev: PomodoroState): AdvanceResult => {
      const s = settingsRef.current;
      if (prev.phase === 'work') {
        const completed = prev.workSessionsCompleted + 1;
        if (completed >= s.totalCycles) {
          return { phase: 'work', workSessionsCompleted: completed, currentWorkSession: completed, done: true };
        }
        const isLong = completed % s.sessionsBeforeLongBreak === 0;
        return {
          phase: isLong ? 'long' : 'short',
          workSessionsCompleted: completed,
          currentWorkSession: completed + 1,
          done: false,
        };
      }
      // a break just ended -> back to focus
      return {
        phase: 'work',
        workSessionsCompleted: prev.workSessionsCompleted,
        currentWorkSession: prev.currentWorkSession,
        done: false,
      };
    },
    [],
  );

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Advance to the next phase. `viaSkip` suppresses the completion alert.
  const advance = useCallback(
    (viaSkip: boolean) => {
      setState((prev) => {
        const result = computeAdvance(prev);
        const s = settingsRef.current;

        if (!viaSkip) {
          onPhaseCompleteRef.current?.(prev.phase, result.done ? null : result.phase);
        }

        if (result.done) {
          deadlineRef.current = null;
          return {
            status: 'done',
            phase: 'work',
            secondsLeft: secondsForPhase('work', s),
            workSessionsCompleted: result.workSessionsCompleted,
            currentWorkSession: 1,
          };
        }

        const nextSeconds = secondsForPhase(result.phase, s);
        // Auto-start the next phase only when it ended naturally and the setting is on.
        const keepRunning = prev.status === 'running' && (viaSkip || s.autoStartNext);
        deadlineRef.current = keepRunning ? Date.now() + nextSeconds * 1000 : null;

        return {
          status: keepRunning ? 'running' : 'paused',
          phase: result.phase,
          secondsLeft: nextSeconds,
          workSessionsCompleted: result.workSessionsCompleted,
          currentWorkSession: result.currentWorkSession,
        };
      });
    },
    [computeAdvance],
  );

  // Ticking loop driven by an absolute deadline so it stays accurate when the
  // tab is throttled/backgrounded.
  useEffect(() => {
    if (state.status !== 'running') {
      clearTick();
      return;
    }
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + state.secondsLeft * 1000;
    }
    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const remaining = Math.round((deadline - Date.now()) / 1000);
      if (remaining <= 0) {
        advance(false);
      } else {
        setState((prev) => (prev.secondsLeft === remaining ? prev : { ...prev, secondsLeft: remaining }));
      }
    };
    intervalRef.current = window.setInterval(tick, 250);
    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, advance, clearTick]);

  const start = useCallback(() => {
    setState((prev) => {
      const s = settingsRef.current;
      if (prev.status === 'running') return prev;
      if (prev.status === 'idle' || prev.status === 'done') {
        const seconds = secondsForPhase('work', s);
        deadlineRef.current = Date.now() + seconds * 1000;
        return {
          status: 'running',
          phase: 'work',
          secondsLeft: seconds,
          workSessionsCompleted: 0,
          currentWorkSession: 1,
        };
      }
      // resume from pause
      deadlineRef.current = Date.now() + prev.secondsLeft * 1000;
      return { ...prev, status: 'running' };
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'running') return prev;
      const deadline = deadlineRef.current;
      const remaining = deadline ? Math.max(0, Math.round((deadline - Date.now()) / 1000)) : prev.secondsLeft;
      deadlineRef.current = null;
      return { ...prev, status: 'paused', secondsLeft: remaining };
    });
  }, []);

  const stop = useCallback(() => {
    deadlineRef.current = null;
    clearTick();
    setState({
      status: 'idle',
      phase: 'work',
      secondsLeft: secondsForPhase('work', settingsRef.current),
      workSessionsCompleted: 0,
      currentWorkSession: 1,
    });
  }, [clearTick]);

  const skip = useCallback(() => {
    setState((prev) => (prev.status === 'idle' || prev.status === 'done' ? prev : prev));
    advance(true);
  }, [advance]);

  // When idle/done and settings change, reflect the new focus duration immediately.
  useEffect(() => {
    setState((prev) => {
      if (prev.status === 'idle' || prev.status === 'done') {
        const seconds = secondsForPhase('work', settings);
        return prev.secondsLeft === seconds ? prev : { ...prev, secondsLeft: seconds };
      }
      return prev;
    });
  }, [settings]);

  const totalSeconds = useMemo(
    () => secondsForPhase(state.phase, settings),
    [state.phase, settings],
  );

  const progress = totalSeconds > 0 ? 1 - state.secondsLeft / totalSeconds : 0;

  return {
    ...state,
    totalSeconds,
    progress: Math.min(1, Math.max(0, progress)),
    start,
    pause,
    stop,
    skip,
  };
}
