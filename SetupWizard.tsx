import React, { useState } from 'react';
import {
  MedicalProfile, AppSettings, EmergencyContact, emptyProfile, defaultSettings, PHONE_CONTACTS,
} from '@/lib/lifeguardStore';
import {
  ShieldCheck, ArrowRight, ArrowLeft, HeartPulse, KeyRound, BookUser,
  Zap, CheckCircle2, Star, Trash2, Check, UserPlus,
} from 'lucide-react';
import ManualContactForm from './ManualContactForm';
import ContactVerification from './ContactVerification';


interface Props {
  onComplete: (p: MedicalProfile, s: AppSettings) => void;
}

const STEPS = ['Welcome', 'Medical', 'Security', 'Contacts', 'Triggers', 'Done'];

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; ta?: boolean; placeholder?: string }> =
  ({ label, value, onChange, type = 'text', ta, placeholder }) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
    {ta ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
    )}
  </label>
);

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

const SetupWizard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<MedicalProfile>({ ...emptyProfile });
  const [settings, setSettings] = useState<AppSettings>({ ...defaultSettings, pin: '', emergencyCode: '999' });
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);

  const sp = (k: keyof MedicalProfile, v: any) => setProfile((d) => ({ ...d, [k]: v }));
  const ss = (k: keyof AppSettings, v: any) => setSettings((d) => ({ ...d, [k]: v }));

  const toggleContact = (name: string, phone: string) => {
    setProfile((d) => {
      const exists = d.contacts.find((c) => c.phone === phone);
      if (exists) return { ...d, contacts: d.contacts.filter((c) => c.phone !== phone) };
      const c: EmergencyContact = { id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name, relationship: 'Contact', phone, isPrimary: d.contacts.length === 0 };
      return { ...d, contacts: [...d.contacts, c] };
    });
  };
  const addManualContact = (name: string, relationship: string, phone: string) => {
    setProfile((d) => {
      const c: EmergencyContact = { id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name, relationship, phone, isPrimary: d.contacts.length === 0 };
      return { ...d, contacts: [...d.contacts, c] };
    });
    setShowManual(false);
    setError('');
  };
  const setPrimary = (id: string) => setProfile((d) => ({ ...d, contacts: d.contacts.map((c) => ({ ...c, isPrimary: c.id === id })) }));
  const removeContact = (id: string) => setProfile((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
  const verifyContact = (id: string) => setProfile((d) => ({ ...d, contacts: d.contacts.map((c) => c.id === id ? { ...c, verified: true } : c) }));


  const next = () => {
    setError('');
    if (step === 1 && !profile.fullName.trim()) { setError('Please enter your full name.'); return; }
    if (step === 2) {
      if (settings.pin.length < 4) { setError('PIN must be at least 4 digits.'); return; }
      if (settings.emergencyCode.length < 3) { setError('Emergency code must be at least 3 digits.'); return; }
      if (settings.pin === settings.emergencyCode) { setError('PIN and emergency code must be different.'); return; }
    }
    if (step === 3 && profile.contacts.length === 0) { setError('Add at least one emergency contact.'); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50">
      {/* progress */}
      <div className="bg-gradient-to-br from-red-600 to-red-500 px-5 pt-6 pb-5 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-lg font-bold">LifeGuard Setup</h1>
        </div>
        <div className="mt-4 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-red-100">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {step === 0 && (
          <div className="space-y-4 pt-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600"><HeartPulse className="h-8 w-8" /></div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to LifeGuard</h2>
            <p className="text-sm text-slate-500">Let's set up your emergency profile. First responders will be able to view your vital medical details from the lock screen — without unlocking your phone.</p>
            <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-slate-600">
              {['Enter your medical details', 'Choose a PIN & emergency code', 'Pick emergency contacts', 'Turn on SOS triggers'].map((t, i) => (
                <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">{i + 1}</span>{t}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">All data is encrypted and stays on your device.</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><HeartPulse className="h-5 w-5 text-red-600" /> Your Medical Details</h2>
            <Field label="Full Name" value={profile.fullName} onChange={(v) => sp('fullName', v)} placeholder="e.g. Jane Smith" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth" type="date" value={profile.dateOfBirth} onChange={(v) => sp('dateOfBirth', v)} />
              <Field label="Blood Type" value={profile.bloodType} onChange={(v) => sp('bloodType', v)} placeholder="O-" />
            </div>
            <Field label="Address" value={profile.address} onChange={(v) => sp('address', v)} ta placeholder="Home address" />
            <Field label="Medical Conditions" value={profile.conditions} onChange={(v) => sp('conditions', v)} ta placeholder="e.g. Diabetes" />
            <Field label="Allergies" value={profile.allergies} onChange={(v) => sp('allergies', v)} ta placeholder="e.g. Penicillin" />
            <Field label="Medications" value={profile.medications} onChange={(v) => sp('medications', v)} ta />
            <Field label="Emergency Notes" value={profile.notes} onChange={(v) => sp('notes', v)} ta />
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={profile.organDonor} onChange={(e) => sp('organDonor', e.target.checked)} className="h-4 w-4 accent-red-600" /> Registered Organ Donor
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><KeyRound className="h-5 w-5 text-red-600" /> Security Codes</h2>
            <p className="text-sm text-slate-500">Your PIN unlocks the phone. The emergency code opens the medical screen only — give it to no one; responders simply tap the emergency bar.</p>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner PIN (4-6 digits)</span>
              <input value={settings.pin} onChange={(e) => ss('pin', e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-lg tracking-[0.4em] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" placeholder="••••" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency Code</span>
              <input value={settings.emergencyCode} onChange={(e) => ss('emergencyCode', e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-lg tracking-[0.4em] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" placeholder="999" />
            </label>
            <Toggle label="Biometric lock for editing info" checked={settings.biometricLock} onChange={(v) => ss('biometricLock', v)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><BookUser className="h-5 w-5 text-red-600" /> Emergency Contacts</h2>
            <p className="text-sm text-slate-500">Pick contacts from your phone book. The starred contact is messaged first in an emergency.</p>
            <div className="rounded-xl border border-slate-200 bg-white">
              {PHONE_CONTACTS.map((pc) => {
                const sel = profile.contacts.find((c) => c.phone === pc.phone);
                return (
                  <button key={pc.phone} onClick={() => toggleContact(pc.name, pc.phone)}
                    className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-sm last:border-0 hover:bg-slate-50">
                    <div className="text-left">
                      <p className="font-medium text-slate-800">{pc.name}</p>
                      <p className="text-xs text-slate-400">{pc.phone}</p>
                    </div>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${sel ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 text-transparent'}`}>
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
            {showManual ? (
              <ManualContactForm onAdd={addManualContact} onCancel={() => setShowManual(false)} />
            ) : (
              <button onClick={() => setShowManual(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-red-300 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100">
                <UserPlus className="h-4 w-4" /> Add a new contact manually
              </button>
            )}

            {profile.contacts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Selected ({profile.contacts.length})</p>
                {profile.contacts.map((c) => (
                  <div key={c.id} className="rounded-lg bg-white p-2.5 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPrimary(c.id)} aria-label="Set primary"><Star className={`h-5 w-5 ${c.isPrimary ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>
                        <button onClick={() => removeContact(c.id)} aria-label="Remove"><Trash2 className="h-5 w-5 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status:</span>
                      <ContactVerification phone={c.phone} verified={c.verified} onVerified={() => verifyContact(c.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><Zap className="h-5 w-5 text-red-600" /> SOS Triggers</h2>
            <p className="text-sm text-slate-500">Choose what happens when you press the volume buttons three times quickly.</p>
            <Toggle label="Enable triple-press trigger" desc="3 rapid volume presses launch SOS" checked={settings.triggerEnabled} onChange={(v) => ss('triggerEnabled', v)} />
            <Toggle label="Send emergency SMS + GPS" checked={settings.smsEnabled} onChange={(v) => ss('smsEnabled', v)} />
            <Toggle label="Auto-call primary contact" checked={settings.autoCallEnabled} onChange={(v) => ss('autoCallEnabled', v)} />
            <Toggle label="Sound loud alarm/siren" checked={settings.alarmEnabled} onChange={(v) => ss('alarmEnabled', v)} />
            <Toggle label="Flashlight SOS strobe" checked={settings.flashlightEnabled} onChange={(v) => ss('flashlightEnabled', v)} />
            <Toggle label="Share live location" checked={settings.shareLocationEnabled} onChange={(v) => ss('shareLocationEnabled', v)} />
            <label className="block pt-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom emergency message</span>
              <textarea value={settings.customMessage} onChange={(e) => ss('customMessage', e.target.value)} rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 pt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"><CheckCircle2 className="h-9 w-9" /></div>
            <h2 className="text-xl font-bold text-slate-900">You're all set, {profile.fullName.split(' ')[0] || 'there'}!</h2>
            <p className="text-sm text-slate-500">Your encrypted emergency profile is ready. You can edit anything later from Settings.</p>
            <div className="rounded-xl bg-white p-4 text-left text-sm border border-slate-200 space-y-1">
              <p><b>Name:</b> {profile.fullName || '—'}</p>
              <p><b>Blood type:</b> {profile.bloodType || '—'}</p>
              <p><b>Contacts:</b> {profile.contacts.length}</p>
              <p><b>Emergency code:</b> {settings.emergencyCode}</p>
              <p><b>Triggers:</b> {settings.triggerEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 bg-white p-4">
        {step > 0 && step < 5 && (
          <button onClick={back} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        {step < 5 ? (
          <button onClick={next} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700">
            {step === 0 ? 'Get Started' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => onComplete(profile, settings)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700">
            <CheckCircle2 className="h-4 w-4" /> Finish &amp; Save
          </button>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
