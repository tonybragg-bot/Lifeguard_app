import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/lib/lifeguardStore';
import { Lock, Delete, ShieldAlert, Wifi, BatteryFull, Signal } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUnlock: () => void;        // owner pin correct
  onEmergency: () => void;     // emergency code typed
}

const LockScreen: React.FC<Props> = ({ settings, onUnlock, onEmergency }) => {
  const [entry, setEntry] = useState('');
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const press = (d: string) => {
    const next = (entry + d).slice(0, 6);
    setEntry(next);
    if (next === settings.emergencyCode) { setEntry(''); onEmergency(); return; }
    if (next.length >= settings.pin.length && next === settings.pin) { setEntry(''); onUnlock(); return; }
    if (next.length >= 6) { setShake(true); setTimeout(() => { setShake(false); setEntry(''); }, 500); }
  };

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* status bar */}
      <div className="flex items-center justify-between px-5 pt-3 text-xs opacity-80">
        <span>{time}</span>
        <div className="flex items-center gap-1.5"><Signal className="h-3.5 w-3.5" /><Wifi className="h-3.5 w-3.5" /><BatteryFull className="h-4 w-4" /></div>
      </div>

      {/* clock */}
      <div className="mt-10 text-center">
        <div className="text-6xl font-extralight tracking-tight">{time}</div>
        <div className="mt-1 text-sm text-slate-300">{date}</div>
        <div className="mt-6 flex justify-center"><div className="rounded-full bg-white/10 p-3"><Lock className="h-6 w-6 text-slate-200" /></div></div>
      </div>

      {/* pin dots */}
      <div className={`mt-8 flex justify-center gap-3 ${shake ? 'animate-pulse' : ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`h-3 w-3 rounded-full border border-white/40 ${i < entry.length ? 'bg-white' : 'bg-transparent'} ${shake ? 'border-red-400' : ''}`} />
        ))}
      </div>

      {/* keypad */}
      <div className="mt-auto px-8 pb-6">
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} onClick={() => press(d)} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-light hover:bg-white/20 active:scale-95 transition">
              {d}
            </button>
          ))}
          <span />
          <button onClick={() => press('0')} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-light hover:bg-white/20 active:scale-95 transition">0</button>
          <button onClick={() => setEntry((e) => e.slice(0, -1))} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white/70 hover:bg-white/10">
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {/* emergency affordance */}
        <button onClick={() => press(settings.emergencyCode)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-red-400/60 bg-red-500/15 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/25">
          <ShieldAlert className="h-4 w-4" /> Emergency — type {settings.emergencyCode} for medical info
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">Owner PIN unlocks the phone · {settings.emergencyCode} opens secure medical info only</p>
      </div>
    </div>
  );
};

export default LockScreen;
