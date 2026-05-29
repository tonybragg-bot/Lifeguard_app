// Browser implementations that emulate the native emergency tools.

let audioCtx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;
let sirenInterval: number | null = null;

export function startSiren() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (osc) return;
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 800;
    gain.gain.value = 0.25;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    let up = true;
    sirenInterval = window.setInterval(() => {
      if (!osc) return;
      osc.frequency.setValueAtTime(up ? 1200 : 600, audioCtx!.currentTime);
      up = !up;
    }, 350);
  } catch (e) { /* audio not available */ }
}

export function stopSiren() {
  if (sirenInterval) { clearInterval(sirenInterval); sirenInterval = null; }
  try { osc?.stop(); } catch (e) { /* ignore */ }
  osc?.disconnect();
  gain?.disconnect();
  osc = null;
  gain = null;
}

export function getLocation(): Promise<{ url: string; coords: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve({
          url: `https://maps.google.com/?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`,
          coords: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}

export function vibrate(pattern: number | number[]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// Offline outbox - queues messages when "no signal", flushes on reconnect.
const OUTBOX_KEY = 'lifeguard.outbox.v1';
export interface QueuedMessage { to: string; body: string; ts: number; }

export function queueMessage(msg: QueuedMessage) {
  const out = loadOutbox();
  out.push(msg);
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(out));
}
export function loadOutbox(): QueuedMessage[] {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; }
}
export function clearOutbox() { localStorage.removeItem(OUTBOX_KEY); }
