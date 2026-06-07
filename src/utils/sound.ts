let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Unlock/resume the audio context after a user gesture (autoplay policies). */
export function primeAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

/**
 * Play a short three-note chime using the Web Audio API. No assets needed,
 * so it works fully offline.
 */
export function playChime(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();

  const now = c.currentTime;
  const notes = [660, 880, 1046.5]; // E5, A5, C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    const end = start + 0.32;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(end);
  });
}
