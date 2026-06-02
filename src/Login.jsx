import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Check, AlertCircle } from 'lucide-react';

const PITT_NAVY = '#003594';
const PITT_GOLD = '#FFB81C';

export default function Login({ notAuthorized, email }) {
  const [addr, setAddr] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    if (!addr.trim()) return;
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithOtp({
      email: addr.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  };

  const signOut = async () => { await supabase.auth.signOut(); window.location.reload(); };

  const Shell = ({ children }) => (
    <div className="min-h-screen grid place-items-center bg-stone-950 p-6" style={{ fontFamily: 'ui-sans-serif,system-ui,sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" />
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-sm p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-10 w-10 rounded-sm grid place-items-center" style={{ backgroundColor: PITT_GOLD }}>
            <span className="font-serif font-black text-2xl leading-none" style={{ fontFamily: '"Playfair Display",Georgia,serif', color: PITT_NAVY }}>P</span>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: PITT_GOLD }}>Pittsburgh</div>
            <div className="text-xs font-semibold text-stone-200">Women's Soccer · Command Center</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  if (notAuthorized) {
    return (
      <Shell>
        <div className="flex items-start gap-2 text-amber-400 mb-3"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div className="text-sm font-semibold text-stone-100">Access not enabled</div></div>
        <p className="text-sm text-stone-400 leading-relaxed">You're signed in as <span className="text-stone-200">{email}</span>, but that address isn't on the staff list yet. Ask Coach Waldrum to add you.</p>
        <button onClick={signOut} className="mt-5 w-full text-xs tracking-wider uppercase font-semibold text-stone-300 px-4 py-2.5 border border-stone-600 hover:border-stone-400 rounded-sm">Sign out</button>
      </Shell>
    );
  }

  if (sent) {
    return (
      <Shell>
        <div className="flex items-start gap-2 text-emerald-400 mb-3"><Check size={18} className="mt-0.5 shrink-0" /><div className="text-sm font-semibold text-stone-100">Check your email</div></div>
        <p className="text-sm text-stone-400 leading-relaxed">We sent a one-tap sign-in link to <span className="text-stone-200">{addr}</span>. Open it on this device to enter the Command Center.</p>
        <button onClick={() => setSent(false)} className="mt-5 text-xs text-stone-500 hover:text-amber-400">Use a different email</button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-2">Staff Sign-In</div>
      <p className="text-sm text-stone-400 mb-4 leading-relaxed">Enter your staff email. We'll send a secure link — no password needed.</p>
      <input type="email" autoFocus value={addr} onChange={e => setAddr(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
        placeholder="you@athletics.pitt.edu"
        className="w-full px-3 py-2.5 text-sm border border-stone-600 bg-stone-800 text-stone-100 focus:border-amber-400 focus:outline-none rounded-sm placeholder:text-stone-500" />
      {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
      <button onClick={send} disabled={busy} className="mt-4 w-full flex items-center justify-center gap-2 text-xs tracking-wider uppercase font-semibold px-4 py-2.5 rounded-sm" style={{ background: PITT_GOLD, color: PITT_NAVY, opacity: busy ? 0.7 : 1 }}>
        <Mail size={14} /> {busy ? 'Sending…' : 'Send sign-in link'}
      </button>
    </Shell>
  );
}
