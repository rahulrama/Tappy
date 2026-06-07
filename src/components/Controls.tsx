import { Pause, Play, Square, SkipForward } from 'lucide-react';
import type { Status } from '../hooks/usePomodoro';

interface ControlsProps {
  status: Status;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
}

export function Controls({ status, onStart, onPause, onStop, onSkip }: ControlsProps) {
  const isRunning = status === 'running';
  const isActive = status === 'running' || status === 'paused';

  return (
    <div className="controls" role="group" aria-label="Timer controls">
      {isRunning ? (
        <button type="button" className="btn btn--primary" onClick={onPause} aria-label="Pause timer">
          <Pause aria-hidden="true" />
          <span>Pause</span>
        </button>
      ) : (
        <button type="button" className="btn btn--primary" onClick={onStart} aria-label="Start timer">
          <Play aria-hidden="true" />
          <span>{status === 'paused' ? 'Resume' : 'Start'}</span>
        </button>
      )}

      <button
        type="button"
        className="btn btn--ghost"
        onClick={onSkip}
        disabled={!isActive}
        aria-label="Skip to next timer"
      >
        <SkipForward aria-hidden="true" />
        <span>Skip</span>
      </button>

      <button
        type="button"
        className="btn btn--danger"
        onClick={onStop}
        disabled={status === 'idle'}
        aria-label="Stop and exit pomodoro"
      >
        <Square aria-hidden="true" />
        <span>Stop</span>
      </button>
    </div>
  );
}
