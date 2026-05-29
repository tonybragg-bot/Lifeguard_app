import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface Props {
  phone: string;
  verified?: boolean;
  onVerified: () => void;
}

// Simulated SMS verification flow for a newly added emergency contact.
// In the real Android app this would dispatch a real SMS via SmsManager and
// compare the user-entered code against the one we sent. Here it is fully mocked.
const ContactVerification: React.FC<Props> = ({ phone, verified, onVerified }) => {
  const [phase, setPhase] = useState<'idle' | 'sent'>('idle');
  const [sentCode, setSentCode] = useState('');
  const [entry, setEntry] = useState('');
  const [err, setErr] = useState('');

  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
        <ShieldCheck className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }

  const sendCode = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code);
    setPhase('sent');
    setEntry('');
    setErr('');
  };

  const confirm = () => {
    if (entry.trim() === sentCode) {
      onVerified();
    } else {
      setErr('Incorrect code. Please try again.');
    }
  };

  if (phase === 'idle') {
    return (
      <button
        onClick={sendCode}
        className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
      >
        <Send className="h-3 w-3" /> Send verification code
      </button>
    );
  }

  return (
    <div className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <MessageSquare className="h-3.5 w-3.5 text-red-500" />
        Simulated SMS sent to <span className="font-semibold text-slate-700">{phone}</span>
      </p>
      <p className="rounded bg-white px-2 py-1 text-[11px] text-slate-400">
        Demo code (would be private in production): <span className="font-mono font-bold tracking-widest text-slate-700">{sentCode}</span>
      </p>
      <div className="flex items-center gap-2">
        <input
          value={entry}
          onChange={(e) => { setEntry(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
          inputMode="numeric"
          placeholder="Enter 6-digit code"
          className="w-32 rounded border border-slate-300 px-2 py-1.5 text-sm font-mono tracking-widest outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
        />
        <button
          onClick={confirm}
          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
        >
          <CheckCircle2 className="h-4 w-4" /> Verify
        </button>
        <button onClick={sendCode} className="text-[11px] font-medium text-slate-500 hover:text-slate-700 underline">Resend</button>
      </div>
      {err && <p className="text-[11px] font-medium text-red-600">{err}</p>}
    </div>
  );
};

export default ContactVerification;
