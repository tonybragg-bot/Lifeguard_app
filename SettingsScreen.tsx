import React, { useState } from 'react';
import { AppSettings } from '@/lib/lifeguardStore';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onBack: () => void;
  onSave: (s: AppSettings) => void;
}

const Toggle: React.FC<{ label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200">
    <div className="pr-3">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {desc && <p className="text-xs text-slate-400">{desc}</p>}
    </div>
    <button onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-red-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

const SettingsScreen: React.FC<Props> = ({ settings, onBack, onSave }) => {
  const [d, setD] = useState<AppSettings>({ ...settings });
  const set = (k: keyof AppSettings, v: any) => setD((p) => ({ ...p, [k]: v }));

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-slate-50">
      <div className="flex items-center gap-3 bg-white px-4 py-3 border-b border-slate-200">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
        <h2 className="font-bold text-slate-800">Settings &amp; Triggers</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Trigger</h3>
        <Toggle label="Triple-press volume trigger" desc="3 rapid volume presses launch emergency" checked={d.triggerEnabled} onChange={(v) => set('triggerEnabled', v)} />
        <label className="block rounded-xl bg-white p-3 border border-slate-200">
          <span className="text-sm font-semibold text-slate-800">Trigger speed window: {d.sensitivity}ms</span>
          <input type="range" min={800} max={2500} step={100} value={d.sensitivity} onChange={(e) => set('sensitivity', Number(e.target.value))} className="mt-2 w-full accent-red-600" />
        </label>

        <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">On Trigger, Activate</h3>
        <Toggle label="Send emergency SMS" desc="With live GPS to your contacts" checked={d.smsEnabled} onChange={(v) => set('smsEnabled', v)} />
        <Toggle label="Auto-call primary contact" checked={d.autoCallEnabled} onChange={(v) => set('autoCallEnabled', v)} />
        <Toggle label="Sound loud alarm/siren" checked={d.alarmEnabled} onChange={(v) => set('alarmEnabled', v)} />
        <Toggle label="Flashlight SOS strobe" checked={d.flashlightEnabled} onChange={(v) => set('flashlightEnabled', v)} />
        <Toggle label="Share live location" checked={d.shareLocationEnabled} onChange={(v) => set('shareLocationEnabled', v)} />

        <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Custom Emergency Message</h3>
        <textarea value={d.customMessage} onChange={(e) => set('customMessage', e.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />

        <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Security</h3>
        <Toggle label="Biometric lock for editing" checked={d.biometricLock} onChange={(v) => set('biometricLock', v)} />
        <div className="grid grid-cols-2 gap-3">
          <label className="block rounded-xl bg-white p-3 border border-slate-200">
            <span className="text-xs font-semibold uppercase text-slate-500">Owner PIN</span>
            <input value={d.pin} onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none" />
          </label>
          <label className="block rounded-xl bg-white p-3 border border-slate-200">
            <span className="text-xs font-semibold uppercase text-slate-500">Emergency Code</span>
            <input value={d.emergencyCode} onChange={(e) => set('emergencyCode', e.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none" />
          </label>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white p-4">
        <button onClick={() => onSave(d)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white hover:bg-red-700">
          <Save className="h-5 w-5" /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
