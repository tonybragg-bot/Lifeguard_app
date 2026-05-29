import React, { useState } from 'react';
import { UserPlus, Check, X } from 'lucide-react';
import { phoneError } from '@/lib/contactValidation';

interface Props {
  onAdd: (name: string, relationship: string, phone: string) => void;
  onCancel?: () => void;
}

const ManualContactForm: React.FC<Props> = ({ onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) { setErr('Name is required.'); return; }
    const pe = phoneError(phone);
    if (pe) { setErr(pe); return; }
    onAdd(name.trim(), relationship.trim() || 'Contact', phone.trim());
    setName(''); setRelationship(''); setPhone(''); setErr('');
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        <UserPlus className="h-4 w-4 text-red-600" /> New contact
      </p>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</span>
        <input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="e.g. Alex Carter" className={inputCls} />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Relationship</span>
        <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Brother" className={inputCls} />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone Number</span>
        <input value={phone} onChange={(e) => { setPhone(e.target.value); setErr(''); }} inputMode="tel" placeholder="+44 7700 900000" className={inputCls} />
      </label>
      {err && <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={submit} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700">
          <Check className="h-4 w-4" /> Add Contact
        </button>
        {onCancel && (
          <button onClick={onCancel} className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default ManualContactForm;
