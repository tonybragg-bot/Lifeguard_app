import React, { useState } from 'react';
import { MedicalProfile, AppSettings, calcAge, buildEmergencyText } from '@/lib/lifeguardStore';
import { startSiren, stopSiren, getLocation, vibrate, queueMessage } from '@/lib/emergencyTools';
import MedicalQR from './MedicalQR';
import {
  Phone, MessageSquare, Siren, Flashlight, MapPin, Droplet, AlertTriangle,
  Pill, HeartPulse, User, Home, X, ShieldCheck, QrCode,
} from 'lucide-react';

interface Props {
  profile: MedicalProfile;
  settings: AppSettings;
  onClose: () => void;
  onLog: (s: string) => void;
}

const Field: React.FC<{ icon: React.ReactNode; label: string; value: string; danger?: boolean }> = ({ icon, label, value, danger }) => (
  <div className={`rounded-xl p-3 border ${danger ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className={danger ? 'text-red-600' : 'text-slate-400'}>{icon}</span>{label}
    </div>
    <div className={`mt-1 text-sm font-medium ${danger ? 'text-red-700' : 'text-slate-800'}`}>{value || '—'}</div>
  </div>
);

const EmergencyScreen: React.FC<Props> = ({ profile, settings, onClose, onLog }) => {
  const [siren, setSiren] = useState(false);
  const [strobe, setStrobe] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const age = calcAge(profile.dateOfBirth);

  const toggleSiren = () => {
    if (siren) { stopSiren(); setSiren(false); }
    else { startSiren(); setSiren(true); vibrate(200); onLog('Alarm siren activated'); }
  };
  const toggleStrobe = () => {
    setStrobe((s) => { if (!s) onLog('Flashlight SOS strobe activated'); return !s; });
  };

  const sendSms = async (contactName: string, phone: string) => {
    vibrate([100, 50, 100]);
    onLog(`Locating GPS for emergency SMS to ${contactName}...`);
    const loc = await getLocation();
    const body = buildEmergencyText(profile, settings.customMessage, loc?.url);
    if (!navigator.onLine) {
      queueMessage({ to: phone, body, ts: Date.now() });
      onLog(`No signal — message queued for ${contactName}, will auto-send on reconnect.`);
      return;
    }
    onLog(`Emergency SMS sent to ${contactName} (${phone}).`);
    // In native app: SmsManager.sendTextMessage(...)
    window.open(`sms:${phone.replace(/\s/g, '')}?body=${encodeURIComponent(body)}`, '_self');
  };

  const callContact = (contactName: string, phone: string) => {
    onLog(`Calling ${contactName} (${phone})...`);
    window.open(`tel:${phone.replace(/\s/g, '')}`, '_self');
  };

  React.useEffect(() => () => stopSiren(), []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-slate-100">
      {strobe && <StrobeOverlay onStop={toggleStrobe} />}
      {/* Header */}
      <div className="bg-red-600 px-4 pt-6 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <div>
              <p className="text-[11px] uppercase tracking-widest opacity-90">Secure Emergency Mode</p>
              <h2 className="text-lg font-bold leading-tight">Medical Information</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/20 p-2 hover:bg-white/30">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-red-100">No other phone access is granted. Visible to first responders only.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Identity */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl font-bold">
              {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{profile.fullName}</h3>
              <p className="text-sm text-slate-500">{age != null ? `Age ${age}` : ''}{profile.organDonor ? ' · Organ Donor' : ''}</p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
            <Home className="mt-0.5 h-4 w-4 text-slate-400" />{profile.address || '—'}
          </div>
        </div>

        {/* Critical fields */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<Droplet className="h-4 w-4" />} label="Blood Type" value={profile.bloodType} danger />
          <Field icon={<AlertTriangle className="h-4 w-4" />} label="Allergies" value={profile.allergies} danger />
        </div>
        <Field icon={<HeartPulse className="h-4 w-4" />} label="Medical Conditions" value={profile.conditions} />
        <Field icon={<Pill className="h-4 w-4" />} label="Medications" value={profile.medications} />
        <Field icon={<User className="h-4 w-4" />} label="Notes" value={profile.notes} />

        {/* Contacts */}
        <div>
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Emergency Contacts</h4>
          <div className="space-y-2">
            {profile.contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">{c.name}
                    {c.isPrimary && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">PRIMARY</span>}
                    {c.verified && <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700"><ShieldCheck className="h-3 w-3" />VERIFIED</span>}
                  </p>
                  <p className="text-xs text-slate-500">{c.relationship} · {c.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => callContact(c.name, c.phone)} className="rounded-full bg-green-100 p-2.5 text-green-700 hover:bg-green-200" aria-label="Call">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button onClick={() => sendSms(c.name, c.phone)} className="rounded-full bg-blue-100 p-2.5 text-blue-700 hover:bg-blue-200" aria-label="Text">
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <ToolBtn active={siren} onClick={toggleSiren} icon={<Siren className="h-6 w-6" />} label={siren ? 'Stop Alarm' : 'Alarm'} />
          <ToolBtn active={strobe} onClick={toggleStrobe} icon={<Flashlight className="h-6 w-6" />} label="Flashlight" />
          <ToolBtn onClick={() => setShowQR((q) => !q)} icon={<QrCode className="h-6 w-6" />} label="Medical QR" />
        </div>

        {showQR && (
          <div className="flex flex-col items-center rounded-2xl bg-white p-4 border border-slate-200">
            <MedicalQR data={buildEmergencyText(profile, settings.customMessage)} />
            <p className="mt-2 text-center text-xs text-slate-500">Offline ICE medical card — scan for full summary.</p>
          </div>
        )}

        <button
          onClick={() => { const p = profile.contacts.find((x) => x.isPrimary) || profile.contacts[0]; if (p) sendSms(p.name, p.phone); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-base font-bold text-white shadow-lg shadow-red-300 hover:bg-red-700 active:scale-95 transition">
          <MapPin className="h-5 w-5" /> Send Emergency SMS with Live Location
        </button>
      </div>
    </div>
  );
};

const ToolBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-xl p-3 border transition ${active ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
    {icon}<span className="text-xs font-semibold">{label}</span>
  </button>
);

const StrobeOverlay: React.FC<{ onStop: () => void }> = ({ onStop }) => {
  const [on, setOn] = useState(true);
  React.useEffect(() => {
    // SOS-ish strobe pattern
    const id = setInterval(() => setOn((o) => !o), 180);
    return () => clearInterval(id);
  }, []);
  return (
    <div onClick={onStop} className={`fixed inset-0 z-50 flex items-end justify-center pb-10 cursor-pointer ${on ? 'bg-white' : 'bg-black'}`}>
      <span className={`rounded-full px-4 py-2 text-sm font-bold ${on ? 'bg-black text-white' : 'bg-white text-black'}`}>Tap to stop strobe</span>
    </div>
  );
};

export default EmergencyScreen;
