import { useCallback, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Timer } from './components/Timer';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/SettingsModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePomodoro } from './hooks/usePomodoro';
import { DEFAULT_SETTINGS, PHASE_META, STORAGE_KEY } from './constants';
import type { Phase, PomodoroSettings } from './types';
import { playChime, primeAudio } from './utils/sound';
import { ensureNotificationPermission, notify } from './utils/notify';
import './App.css';

export default function App() {
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const handlePhaseComplete = useCallback(
    (finished: Phase, next: Phase | null) => {
      if (settings.soundEnabled) playChime();
      if (settings.notificationsEnabled) {
        const finishedMeta = PHASE_META[finished];
        const body = next
          ? `${finishedMeta.label} done! Next up: ${PHASE_META[next].label} ${PHASE_META[next].emoji}`
          : 'All focus sessions complete! Great work 🎉';
        notify(`${finishedMeta.emoji} Time's up!`, body);
      }
    },
    [settings.soundEnabled, settings.notificationsEnabled],
  );

  const pomodoro = usePomodoro(settings, { onPhaseComplete: handlePhaseComplete });

  const handleStart = useCallback(() => {
    primeAudio();
    if (settings.notificationsEnabled) void ensureNotificationPermission();
    pomodoro.start();
  }, [pomodoro, settings.notificationsEnabled]);

  const handleSave = useCallback(
    (next: PomodoroSettings) => {
      setSettings(next);
      setShowSettings(false);
    },
    [setSettings],
  );

  return (
    <div className="app" data-phase={pomodoro.phase} data-status={pomodoro.status}>
      <header className="app__header">
        <h1 className="app__title">
          <span aria-hidden="true">🍅</span> Pomodoro
        </h1>
        <button
          type="button"
          className="icon-btn icon-btn--header"
          onClick={() => setShowSettings(true)}
          aria-label="Open settings"
        >
          <SettingsIcon aria-hidden="true" />
        </button>
      </header>

      <main className="app__main">
        <Timer
          phase={pomodoro.phase}
          secondsLeft={pomodoro.secondsLeft}
          progress={pomodoro.progress}
          currentWorkSession={pomodoro.currentWorkSession}
          totalCycles={settings.totalCycles}
          status={pomodoro.status}
        />

        {pomodoro.status === 'done' && (
          <p className="app__done" role="status">
            🎉 All sessions complete — nice focus!
          </p>
        )}

        <Controls
          status={pomodoro.status}
          onStart={handleStart}
          onPause={pomodoro.pause}
          onStop={pomodoro.stop}
          onSkip={pomodoro.skip}
        />
      </main>

      <footer className="app__footer">
        <span>Stay focused, stay offline-ready 📴✨</span>
      </footer>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
