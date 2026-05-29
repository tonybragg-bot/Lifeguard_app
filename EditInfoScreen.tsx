import React, { useState } from 'react';
import { MedicalProfile, EmergencyContact, AppSettings } from '@/lib/lifeguardStore';
import { ArrowLeft, Fingerprint, Trash2, Star, BookUser, Save, UserPlus } from 'lucide-react';
import ManualContactForm from './ManualContactForm';
import ContactVerification from './ContactVerification';
import { phoneError } from '@/lib/contactValidation';


interface Props {
  profile: MedicalProfile;
  settings: AppSettings;
  onBack: () => void;
  onSave: (p: MedicalProfile) => void;
}

// Simulated phone contacts to import from
const PHONE_CONTACTS = [
  { name: 'Sarah Doe', phone: '+44 7700 900123' },
  { name: 'Dr. Patel', phone: '+44 7700 900456' },
  { name: 'Mum', phone: '+44 7700 900789' },
  { name: 'James Wright', phone: '+44 7700 900222' },
  { name: 'Aunt Lucy', phone: '+44 7700 900333' },
];

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; ta?: boolean }> = ({ label, value, onChange, type = 'text', ta }) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
    {ta ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
    )}
  </label>
);

const EditInfoScreen: React.FC<Props> = ({ profile, settings, onBack, onSave }) => {
  const [authed, setAuthed] = useState(!settings.biometricLock);
  const [draft, setDraft] = useState<MedicalProfile>({ ...profile });
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (k: keyof MedicalProfile, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  const addContact = (name: string, phone: string) => {
    const c: EmergencyContact = { id: `c${Date.now()}`, name, relationship: 'Contact', phone, isPrimary: draft.contacts.length === 0 };
    setDraft((d) => ({ ...d, contacts: [...d.contacts, c] }));
    setShowImport(false);
  };
  const addManualContact = (name: string, relationship: string, phone: string) => {
    const c: EmergencyContact = { id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name, relationship, phone, isPrimary: draft.contacts.length === 0 };
    setDraft((d) => ({ ...d, contacts: [...d.contacts, c] }));
    setShowManual(false);
    setSaveError('');
  };
  const updateContact = (id: string, k: keyof EmergencyContact, v: any) =>
    setDraft((d) => ({ ...d, contacts: d.contacts.map((c) => c.id === id ? { ...c, [k]: v } : c) }));
  const removeContact = (id: string) => setDraft((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
  const setPrimary = (id: string) => setDraft((d) => ({ ...d, contacts: d.contacts.map((c) => ({ ...c, isPrimary: c.id === id })) }));

  const handleSave = () => {
    // Validate every contact's phone number before saving.
    const bad = draft.contacts.find((c) => phoneError(c.phone) !== '');
    if (bad) { setSaveError(`Invalid phone number for "${bad.name}": ${phoneError(bad.phone)}`); return; }
    setSaveError('');
    onSave(draft);
  };


  if (!authed) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900 text-white px-8">
        <Fingerprint className="h-20 w-20 text-red-400 animate-pulse" />
        <h2 className="mt-6 text-lg font-bold">Biometric Verification</h2>
        <p className="mt-2 text-center text-sm text-slate-400">Editing medical info is protected. Confirm your identity to continue.</p>
        <button onClick={() => setAuthed(true)} className="mt-8 rounded-full bg-red-600 px-8 py-3 font-semibold hover:bg-red-700">Authenticate</button>
        <button onClick={onBack} className="mt-3 text-sm text-slate-400 hover:text-white">Cancel</button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-slate-50">
      <div className="flex items-center gap-3 bg-white px-4 py-3 border-b border-slate-200">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
        <h2 className="font-bold text-slate-800">Edit Medical Info</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Input label="Full Name" value={draft.fullName} onChange={(v) => set('fullName', v)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date of Birth" type="date" value={draft.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
          <Input label="Blood Type" value={draft.bloodType} onChange={(v) => set('bloodType', v)} />
        </div>
        <Input label="Address" value={draft.address} onChange={(v) => set('address', v)} ta />
        <Input label="Medical Conditions" value={draft.conditions} onChange={(v) => set('conditions', v)} ta />
        <Input label="Allergies" value={draft.allergies} onChange={(v) => set('allergies', v)} ta />
        <Input label="Medications" value={draft.medications} onChange={(v) => set('medications', v)} ta />
        <Input label="Emergency Notes" value={draft.notes} onChange={(v) => set('notes', v)} ta />
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={draft.organDonor} onChange={(e) => set('organDonor', e.target.checked)} className="h-4 w-4 accent-red-600" /> Registered Organ Donor
        </label>

        <div className="pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Emergency Contacts</h3>
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowImport((s) => !s); setShowManual(false); }} className="flex items-center gap-1 text-sm font-semibold text-red-600">
                <BookUser className="h-4 w-4" /> Import
              </button>
              <button onClick={() => { setShowManual((s) => !s); setShowImport(false); }} className="flex items-center gap-1 text-sm font-semibold text-red-600">
                <UserPlus className="h-4 w-4" /> Add New
              </button>
            </div>
          </div>

          {showManual && (
            <div className="mt-2">
              <ManualContactForm onAdd={addManualContact} onCancel={() => setShowManual(false)} />
            </div>
          )}


          {showImport && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 space-y-1">
              <p className="px-2 py-1 text-xs text-slate-400">From phone contacts</p>
              {PHONE_CONTACTS.map((pc) => (
                <button key={pc.phone} onClick={() => addContact(pc.name, pc.phone)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  <span className="font-medium text-slate-700">{pc.name}</span>
                  <span className="text-xs text-slate-400">{pc.phone}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 space-y-2">
            {draft.contacts.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <input value={c.name} onChange={(e) => updateContact(c.id, 'name', e.target.value)} className="font-semibold text-slate-800 outline-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setPrimary(c.id)} aria-label="Set primary"><Star className={`h-5 w-5 ${c.isPrimary ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>
                    <button onClick={() => removeContact(c.id)} aria-label="Remove"><Trash2 className="h-5 w-5 text-slate-400 hover:text-red-500" /></button>
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <input value={c.relationship} onChange={(e) => updateContact(c.id, 'relationship', e.target.value)} placeholder="Relationship" className="rounded border border-slate-200 px-2 py-1 text-xs outline-none" />
                  <input value={c.phone} onChange={(e) => updateContact(c.id, 'phone', e.target.value)} placeholder="Phone" className="rounded border border-slate-200 px-2 py-1 text-xs outline-none" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status:</span>
                  <ContactVerification phone={c.phone} verified={c.verified} onVerified={() => updateContact(c.id, 'verified', true)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white p-4 space-y-2">
        {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{saveError}</p>}
        <button onClick={handleSave} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white hover:bg-red-700">
          <Save className="h-5 w-5" /> Save Encrypted
        </button>
      </div>

    </div>
  );
};

export default EditInfoScreen;
