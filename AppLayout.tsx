import React, { useState, useEffect, useRef, useCallback } from 'react';
import LockScreen from './lifeguard/LockScreen';
import EmergencyScreen from './lifeguard/EmergencyScreen';
import HomeScreen from './lifeguard/HomeScreen';
import EditInfoScreen from './lifeguard/EditInfoScreen';
import SettingsScreen from './lifeguard/SettingsScreen';
import SetupWizard from './lifeguard/SetupWizard';
import {
  loadProfile, saveProfile, loadSettings, saveSettings,
  MedicalProfile, AppSettings, buildEmergencyText,
  isSetupComplete, markSetupComplete, resetSetup,
} from '@/lib/lifeguardStore';
import { startSiren, stopSiren, getLocation, vibrate, queueMessage, loadOutbox, clearOutbox } from '@/lib/emergencyTools';
import {
  Volume2, Volume1, Wifi, WifiOff,
  Bell, Terminal, FileCode2, Zap, CheckCircle2, Heart, Lock,
} from 'lucide-react';

type Screen = 'lock' | 'home' | 'emergency' | 'edit' | 'settings';

const AppLayout: React.FC = () => {
  const [profile, setProfile] = useState<MedicalProfile>(loadProfile());
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [screen, setScreen] = useState<Screen>('lock');
  const [log, setLog] = useState<string[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [triggerFlash, setTriggerFlash] = useState(false);
  const pressTimes = useRef<number[]>([]);
  const [setupDone, setSetupDone] = useState(isSetupComplete());

  const completeSetup = (p: MedicalProfile, s: AppSettings) => {
    setProfile(p); saveProfile(p);
    setSettings(s); saveSettings(s);
    markSetupComplete();
    setSetupDone(true);
    setScreen('home');
    addLog('First-run setup complete — profile saved & encrypted.');
  };

  const restartSetup = () => {
    resetSetup();
    setSetupDone(false);
    addLog('Setup wizard restarted.');
  };

  const addLog = useCallback((s: string) => {
    setLog((l) => [`${new Date().toLocaleTimeString()} · ${s}`, ...l].slice(0, 12));
  }, []);

  // Online/offline + outbox auto-flush
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      const out = loadOutbox();
      if (out.length) { addLog(`Signal restored — auto-sending ${out.length} queued message(s).`); clearOutbox(); }
    };
    const goOffline = () => { setOnline(false); addLog('Signal lost — messages will queue offline.'); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, [addLog]);

  const runEmergencySequence = useCallback(async () => {
    setTriggerFlash(true);
    setTimeout(() => setTriggerFlash(false), 600);
    vibrate([200, 100, 200, 100, 200]);
    addLog('TRIPLE-PRESS DETECTED — emergency sequence started.');

    if (settings.alarmEnabled) { startSiren(); addLog('Loud alarm/siren sounding.'); setTimeout(stopSiren, 4000); }
    if (settings.smsEnabled) {
      const loc = settings.shareLocationEnabled ? await getLocation() : null;
      const body = buildEmergencyText(profile, settings.customMessage, loc?.url);
      const targets = profile.contacts.filter((c) => c.isPrimary).concat(profile.contacts.filter((c) => !c.isPrimary)).slice(0, 2);
      targets.forEach((t) => {
        if (!navigator.onLine) { queueMessage({ to: t.phone, body, ts: Date.now() }); addLog(`No signal — SMS queued for ${t.name}.`); }
        else addLog(`Emergency SMS sent to ${t.name} (${t.phone}) with live GPS.`);
      });
    }
    if (settings.autoCallEnabled) {
      const p = profile.contacts.find((c) => c.isPrimary);
      if (p) addLog(`Auto-calling primary contact ${p.name}...`);
    }
    if (settings.flashlightEnabled) addLog('Flashlight SOS strobe activated.');
  }, [profile, settings, addLog]);

  const handleVolumePress = useCallback(() => {
    const now = Date.now();
    pressTimes.current = pressTimes.current.filter((t) => now - t < settings.sensitivity);
    pressTimes.current.push(now);
    if (pressTimes.current.length >= 3) {
      pressTimes.current = [];
      if (settings.triggerEnabled) runEmergencySequence();
      else addLog('Trigger detected but disabled in settings.');
    } else {
      addLog(`Volume press ${pressTimes.current.length}/3...`);
    }
  }, [settings, runEmergencySequence, addLog]);

  const persistProfile = (p: MedicalProfile) => { setProfile(p); saveProfile(p); addLog('Medical info saved (AES-256 encrypted).'); setScreen('home'); };
  const persistSettings = (s: AppSettings) => { setSettings(s); saveSettings(s); addLog('Settings updated.'); setScreen('home'); };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start lg:py-12">
        {/* Info / build panel */}
        <div className="flex-1 lg:max-w-md">
          <div className="flex items-center gap-3">
            <img src="https://d64gsuwffb70l.cloudfront.net/6a19db499ff6abfe1212a5b4_1780079574405_e05b6966.png" alt="LifeGuard" className="h-14 w-14 rounded-2xl shadow-md" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">LifeGuard Emergency</h1>
              <p className="text-sm text-slate-500">Lock-screen medical &amp; SOS app — interactive prototype</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            This is a live, clickable preview of the Android app. Type <b className="text-red-600">{settings.emergencyCode}</b> on the
            lock screen to open the secure medical card, or press the side <b>volume buttons 3×</b> quickly to fire the SOS sequence
            (alarm, SMS with GPS, auto-call, flashlight). The owner PIN is <b className="text-red-600">{settings.pin}</b>.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            {['Triple-press SOS trigger', 'Secure 999 medical screen', 'Emergency SMS + live GPS', 'Auto-call contact', 'Loud alarm siren', 'Flashlight SOS strobe', 'Offline queue & auto-send', 'AES-256 local encryption', 'Biometric edit lock', 'Offline medical QR / ICE'].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />{f}</div>
            ))}
          </div>

          {/* Activity log */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><Bell className="h-4 w-4 text-red-600" /> Live Activity Log</h3>
              <span className={`flex items-center gap-1 text-xs font-semibold ${online ? 'text-green-600' : 'text-amber-600'}`}>
                {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto text-xs text-slate-500">
              {log.length === 0 ? <p className="italic text-slate-400">Actions will appear here as you test the app…</p> : log.map((l, i) => <p key={i} className="border-b border-slate-50 pb-1">{l}</p>)}
            </div>
          </div>

          {/* Build / APK guidance */}
          <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm" open>
            <summary className="flex cursor-pointer items-center gap-2 font-bold text-slate-700"><FileCode2 className="h-4 w-4 text-red-600" /> Open in Android Studio · build APK &amp; AAB</summary>
            <div className="mt-3 space-y-2 text-slate-600">
              <p>The complete native Kotlin project is included in this repo under <code className="rounded bg-slate-100 px-1">/android</code> — every file needed to build a real, signed APK on-device with no server:</p>
              <ul className="ml-4 list-disc space-y-0.5 text-xs">
                <li><code>VolumeKeyService.kt</code> — triple-press detection at the lock screen</li>
                <li><code>EmergencyActivity.kt</code> — secure medical screen shown over the lock screen</li>
                <li><code>EmergencyTools.kt</code> — SMS + offline queue, live GPS, auto-call, alarm, torch strobe</li>
                <li><code>SecureStore.kt</code> — AES-256 EncryptedSharedPreferences storage</li>
                <li><code>MainActivity.kt</code> — owner app with biometric edit lock</li>
                <li><code>AndroidManifest.xml</code> · <code>build.gradle</code> · accessibility config</li>
              </ul>
              <p className="font-semibold text-slate-700">1 · Zip the project for Android Studio</p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-green-300">
                <Terminal className="h-4 w-4" /> zip -r LifeGuard-Android.zip android/
              </div>
              <p className="text-xs">Unzip and open the <code className="rounded bg-slate-100 px-1">android/</code> folder in Android Studio (File → Open). Gradle sync builds everything.</p>
              <p className="font-semibold text-slate-700">2 · Build the signed APK (sideload)</p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-green-300">
                <Terminal className="h-4 w-4" /> cd android &amp;&amp; ./gradlew assembleRelease
              </div>
              <p className="text-xs">Output: <code className="rounded bg-slate-100 px-1">app/build/outputs/apk/release/app-release.apk</code></p>
              <p className="font-semibold text-slate-700">3 · Build the signed AAB (Google Play)</p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-green-300">
                <Terminal className="h-4 w-4" /> cd android &amp;&amp; ./gradlew bundleRelease
              </div>
              <p className="text-xs">Output: <code className="rounded bg-slate-100 px-1">app/build/outputs/bundle/release/app-release.aab</code> — upload this to the Play Console. Every push also builds both via GitHub Actions. Full steps in <code className="rounded bg-slate-100 px-1">android/README.md</code>.</p>
            </div>
          </details>


          <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400">
            <Heart className="h-3.5 w-3.5 text-red-500" /> © 2026 LifeGuard. All rights reserved.
          </p>
        </div>

        {/* Phone mockup */}
        <div className="mx-auto flex shrink-0 flex-col items-center">
          <div className="relative">
            {/* side volume buttons */}
            <div className="absolute -left-1.5 top-28 flex flex-col gap-2">
              <button onClick={handleVolumePress} aria-label="Volume up" className="flex h-12 w-2.5 items-center justify-center rounded-l bg-slate-700 hover:bg-red-600 transition" title="Volume + (press 3× fast)"><Volume2 className="h-3 w-3 text-white" /></button>
              <button onClick={handleVolumePress} aria-label="Volume down" className="flex h-12 w-2.5 items-center justify-center rounded-l bg-slate-700 hover:bg-red-600 transition" title="Volume - (press 3× fast)"><Volume1 className="h-3 w-3 text-white" /></button>
            </div>
            <div className="absolute -right-1.5 top-32 h-16 w-2.5 rounded-r bg-slate-700" title="Power" />

            <div className="relative h-[680px] w-[340px] overflow-hidden rounded-[2.5rem] border-[10px] border-slate-900 bg-black shadow-2xl">
              {/* notch */}
              <div className="absolute left-1/2 top-0 z-40 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
              {triggerFlash && <div className="absolute inset-0 z-[60] animate-pulse bg-red-600/40" />}

              {!setupDone && <SetupWizard onComplete={completeSetup} />}
              {setupDone && screen === 'lock' && <LockScreen settings={settings} onUnlock={() => setScreen('home')} onEmergency={() => setScreen('emergency')} />}
              {setupDone && screen === 'home' && <HomeScreen profile={profile} settings={settings} onEdit={() => setScreen('edit')} onSettings={() => setScreen('settings')} onTest={() => setScreen('emergency')} onLock={() => setScreen('lock')} />}
              {setupDone && screen === 'emergency' && <EmergencyScreen profile={profile} settings={settings} onClose={() => setScreen('lock')} onLog={addLog} />}
              {setupDone && screen === 'edit' && <EditInfoScreen profile={profile} settings={settings} onBack={() => setScreen('home')} onSave={persistProfile} />}
              {setupDone && screen === 'settings' && <SettingsScreen settings={settings} onBack={() => setScreen('home')} onSave={persistSettings} />}
            </div>
          </div>

          {/* quick controls */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setScreen('lock')} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"><Lock className="h-3.5 w-3.5" /> Lock Screen</button>
            <button onClick={handleVolumePress} className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"><Zap className="h-3.5 w-3.5" /> Tap = volume press</button>
            <button onClick={() => { stopSiren(); addLog('All alarms stopped.'); }} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50">Stop Alarm</button>
            <button onClick={restartSetup} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50">Re-run Setup Wizard</button>
          </div>
          <p className="mt-2 max-w-[320px] text-center text-[11px] text-slate-400">Tip: tap a volume button 3 times quickly to trigger the full SOS sequence.</p>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
