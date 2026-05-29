import React from 'react';
import { MedicalProfile, AppSettings, calcAge } from '@/lib/lifeguardStore';
import { loadOutbox } from '@/lib/emergencyTools';
import {
  UserCog, Settings, ShieldAlert, ClipboardList, Lock as LockIcon,
  CheckCircle2, Droplet, Users, FileWarning,
} from 'lucide-react';

interface Props {
  profile: MedicalProfile;
  settings: AppSettings;
  onEdit: () => void;
  onSettings: () => void;
  onTest: () => void;
  onLock: () => void;
}

const HomeScreen: React.FC<Props> = ({ profile, settings, onEdit, onSettings, onTest, onLock }) => {
  const age = calcAge(profile.dateOfBirth);
  const outbox = loadOutbox();
  const filled = [profile.fullName, profile.bloodType, profile.conditions, profile.allergies, profile.medications, profile.address].filter(Boolean).length;
  const pct = Math.round((filled / 6) * 100);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-slate-50">
      <div className="bg-gradient-to-br from-red-600 to-red-500 px-5 pt-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold leading-tight">LifeGuard</h1>
              <p className="text-xs text-red-100">Emergency Lock Screen</p>
            </div>
          </div>
          <button onClick={onLock} className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30">
            <LockIcon className="h-4 w-4" /> Lock
          </button>
        </div>
        <div className="mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span>Profile completeness</span><span className="font-bold">{pct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 -mt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
              {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-bold text-slate-900">{profile.fullName}</p>
              <p className="text-xs text-slate-500">{age != null ? `Age ${age} · ` : ''}Blood {profile.bloodType}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Droplet className="h-4 w-4 text-red-500" />} label="Blood" value={profile.bloodType || '—'} />
            <Stat icon={<Users className="h-4 w-4 text-blue-500" />} label="Contacts" value={String(profile.contacts.length)} />
            <Stat icon={<FileWarning className="h-4 w-4 text-amber-500" />} label="Allergies" value={profile.allergies ? String(profile.allergies.split(',').length) : '0'} />
          </div>
        </div>

        {outbox.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {outbox.length} message(s) queued offline — will auto-send when signal returns.
          </div>
        )}

        <button onClick={onTest} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition">
          <ShieldAlert className="h-5 w-5" /> Preview Emergency Screen
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Tile icon={<UserCog className="h-6 w-6" />} label="Edit Medical Info" onClick={onEdit} locked={settings.biometricLock} />
          <Tile icon={<Settings className="h-6 w-6" />} label="Settings & Triggers" onClick={onSettings} />
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 text-xs text-slate-500 space-y-2">
          <p className="flex items-center gap-2 font-semibold text-slate-700"><ClipboardList className="h-4 w-4" /> How responders access your info</p>
          <p>1. On the lock screen they tap the red Emergency bar or type <b>{settings.emergencyCode}</b>.</p>
          <p>2. Only your medical card opens — no other phone data is accessible.</p>
          <p className="flex items-center gap-1.5 text-green-600"><CheckCircle2 className="h-4 w-4" /> All data encrypted &amp; stored only on this device.</p>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg bg-slate-50 p-2">
    <div className="flex justify-center">{icon}</div>
    <p className="mt-1 text-sm font-bold text-slate-800 truncate">{value}</p>
    <p className="text-[10px] uppercase text-slate-400">{label}</p>
  </div>
);

const Tile: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; locked?: boolean }> = ({ icon, label, onClick, locked }) => (
  <button onClick={onClick} className="relative flex flex-col items-start gap-2 rounded-xl bg-white p-4 border border-slate-200 hover:border-red-300 hover:shadow-sm transition text-left">
    <span className="text-red-600">{icon}</span>
    <span className="text-sm font-semibold text-slate-800">{label}</span>
    {locked && <LockIcon className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400" />}
  </button>
);

export default HomeScreen;
