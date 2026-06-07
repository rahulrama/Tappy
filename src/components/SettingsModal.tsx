import { useEffect, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { PomodoroSettings } from '../types';
import { DEFAULT_SETTINGS, LIMITS } from '../constants';

interface SettingsModalProps {
  settings: PomodoroSettings;
  onSave: (next: PomodoroSettings) => void;
  onClose: () => void;
}

interface FieldConfig {
  key: keyof PomodoroSettings;
  label: string;
  emoji: string;
  min: number;
  max: number;
  suffix: string;
}

const NUMBER_FIELDS: FieldConfig[] = [
  { key: 'workMinutes', label: 'Focus length', emoji: '🍅', min: LIMITS.minMinutes, max: LIMITS.maxMinutes, suffix: 'min' },
  { key: 'shortBreakMinutes', label: 'Short break', emoji: '☕', min: LIMITS.minMinutes, max: LIMITS.maxMinutes, suffix: 'min' },
  { key: 'longBreakMinutes', label: 'Long break', emoji: '🌴', min: LIMITS.minMinutes, max: LIMITS.maxMinutes, suffix: 'min' },
  { key: 'sessionsBeforeLongBreak', label: 'Sessions per long break', emoji: '🔁', min: LIMITS.minCount, max: LIMITS.maxCount, suffix: '' },
  { key: 'totalCycles', label: 'Total focus sessions', emoji: '🎯', min: LIMITS.minCount, max: LIMITS.maxCount, suffix: '' },
];

const TOGGLE_FIELDS: { key: keyof PomodoroSettings; label: string; emoji: string }[] = [
  { key: 'autoStartNext', label: 'Auto-start next timer', emoji: '⏭️' },
  { key: 'soundEnabled', label: 'Play chime', emoji: '🔔' },
  { key: 'notificationsEnabled', label: 'Browser notifications', emoji: '📣' },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState<PomodoroSettings>(settings);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Close on Escape + simple focus trap.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const setNumber = (key: keyof PomodoroSettings, raw: string) => {
    const value = Number(raw);
    setDraft((d) => ({ ...d, [key]: Number.isNaN(value) ? d[key] : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized: PomodoroSettings = { ...draft };
    for (const f of NUMBER_FIELDS) {
      normalized[f.key] = clamp(Math.round(Number(draft[f.key])), f.min, f.max) as never;
    }
    if (normalized.sessionsBeforeLongBreak > normalized.totalCycles) {
      normalized.sessionsBeforeLongBreak = normalized.totalCycles;
    }
    onSave(normalized);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="settings-title">⚙️ Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <X aria-hidden="true" />
          </button>
        </header>

        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="field-grid">
            {NUMBER_FIELDS.map((f, i) => (
              <label key={f.key} className="field">
                <span className="field__label">
                  <span aria-hidden="true">{f.emoji}</span> {f.label}
                </span>
                <span className="field__input">
                  <input
                    ref={i === 0 ? firstFieldRef : undefined}
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    value={String(draft[f.key])}
                    onChange={(e) => setNumber(f.key, e.target.value)}
                  />
                  {f.suffix && <span className="field__suffix">{f.suffix}</span>}
                </span>
              </label>
            ))}
          </div>

          <fieldset className="toggles">
            <legend className="sr-only">Preferences</legend>
            {TOGGLE_FIELDS.map((f) => (
              <label key={f.key} className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(draft[f.key])}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))}
                />
                <span className="toggle__track" aria-hidden="true">
                  <span className="toggle__thumb" />
                </span>
                <span className="toggle__label">
                  <span aria-hidden="true">{f.emoji}</span> {f.label}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDraft(DEFAULT_SETTINGS)}
            >
              <RotateCcw aria-hidden="true" />
              <span>Reset</span>
            </button>
            <button type="submit" className="btn btn--primary">
              <span>Save ✨</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
