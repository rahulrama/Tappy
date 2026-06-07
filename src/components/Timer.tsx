import type { Phase } from '../types';
import { PHASE_META } from '../constants';

interface TimerProps {
  phase: Phase;
  secondsLeft: number;
  progress: number; // 0..1
  currentWorkSession: number;
  totalCycles: number;
  status: string;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Timer({
  phase,
  secondsLeft,
  progress,
  currentWorkSession,
  totalCycles,
  status,
}: TimerProps) {
  const meta = PHASE_META[phase];
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const time = formatTime(secondsLeft);

  return (
    <div className="timer" data-phase={phase}>
      <svg className="timer__ring" viewBox="0 0 300 300" aria-hidden="true">
        <circle className="timer__track" cx="150" cy="150" r={RADIUS} />
        <circle
          className="timer__progress"
          cx="150"
          cy="150"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="timer__content">
        <span className="timer__emoji" aria-hidden="true">
          {meta.emoji}
        </span>
        <span className="timer__phase">{meta.label}</span>
        <time
          className="timer__time"
          aria-live="polite"
          aria-label={`${time.replace(':', ' minutes ')} seconds remaining`}
        >
          {time}
        </time>
        <span className="timer__cycle">
          {status === 'idle'
            ? `${totalCycles} focus sessions ready 🚀`
            : `Session ${Math.min(currentWorkSession, totalCycles)} of ${totalCycles}`}
        </span>
      </div>
    </div>
  );
}
