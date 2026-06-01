import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Upload, FileSpreadsheet, ClipboardPaste, Send, Trash2, X, Copy, Check, Mail } from 'lucide-react';

// ============================================================
// CAMP LIST · EMAILS — contacts + Excel/CSV/paste import + outreach
// Self-contained; persists to localStorage ('pittv3:camp').
// ============================================================
const PITT_NAVY = '#003594';
const PITT_GOLD = '#FFB81C';
const KEY = 'pittv3:camp';
const uid = () => Math.random().toString(36).slice(2, 10);

const CAMP_STATUS = [
  { id: 'new', label: 'Not contacted', color: '#78716c' },
  { id: 'invited', label: 'Invited', color: '#3b82f6' },
  { id: 'replied', label: 'Replied', color: '#f59e0b' },
  { id: 'attending', label: 'Attending', color: '#10b981' },
];

const TEMPLATES = [
  { id: 'invite', name: 'Camp Invitation', subject: 'Invitation: Pitt Women’s Soccer ID Camp',
    body: `Hi {name},\n\nReaching out from the University of Pittsburgh Women’s Soccer staff. We’d like to invite {team} players to our upcoming ID Camp on campus — a great chance for our staff to evaluate players in our environment and for prospects to experience our program.\n\nDetails and registration below. Happy to answer any questions.\n\nBest,\nPitt Women’s Soccer` },
  { id: 'followup', name: 'Follow-up — Saw You Play', subject: 'Following up — Pitt Women’s Soccer',
    body: `Hi {name},\n\nOur staff recently watched {team} and wanted to follow up — we were impressed and would like to stay in contact as we continue our evaluation.\n\nWe’d love to get you on campus for an upcoming ID Camp or visit. Let me know the best way to keep in touch.\n\nBest,\nPitt Women’s Soccer` },
];

function mapRow(row) {
  const get = (keys, exclude = []) => {
    for (const k of Object.keys(row)) {
      const kn = String(k).toLowerCase().trim();
      if (exclude.some(x => kn.includes(x))) continue;
      if (keys.some(t => kn.includes(t))) { const v = String(row[k] ?? '').trim(); if (v) return v; }
    }
    return '';
  };
  return {
    name: get(['full name', 'player name', 'athlete']) || get(['name', 'player'], ['team', 'club', 'school', 'first', 'last']),
    team: get(['team', 'club', 'school', 'college']),
    gradYear: get(['grad', 'class of', 'year']).replace(/[^0-9]/g, ''),
    phone: get(['phone', 'cell', 'mobile', 'tel']),
    email: get(['email', 'e-mail', 'mail']),
  };
}

export default function CampList() {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState(new Set());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [composer, setComposer] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setRows(JSON.parse(raw)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch {} }, [rows, loaded]);

  const add = () => setRows(r => [...r, { id: uid(), name: '', team: '', gradYear: '', phone: '', email: '', status: 'new', notes: '', source: 'Manual' }]);
  const upd = (id, k, v) => setRows(r => r.map(x => x.id === id ? { ...x, [k]: v } : x));
  const del = id => { setRows(r => r.filter(x => x.id !== id)); setSel(s => { const n = new Set(s); n.delete(id); return n; }); };
  const toggle = id => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSel = rows.length > 0 && sel.size === rows.length;

  const importSheet = async file => {
    setErr('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const mapped = json.map(mapRow).filter(r => r.name || r.email || r.team)
        .map(r => ({ id: uid(), ...r, status: 'new', notes: '', source: 'Import' }));
      if (!mapped.length) { setErr('No rows with Name / Team / Email found. Use columns like Name, Team, Grad Year, Phone, Email.'); return; }
      setRows(r => [...r, ...mapped]);
    } catch { setErr('Could not read that file. Export your sheet as .xlsx or .csv and try again.'); }
  };

  const applyPaste = () => {
    const lines = pasteText.split(/\r?\n/).map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
    if (!lines.length) return;
    const delim = lines[0].includes('\t') ? '\t' : ',';
    const split = l => l.split(delim).map(s => s.trim());
    const first = split(lines[0]).map(s => s.toLowerCase());
    const hasHeader = first.some(h => ['name', 'email', 'team', 'club', 'phone', 'grad'].some(k => h.includes(k)));
    let parsed;
    if (hasHeader) {
      const headers = split(lines[0]);
      parsed = lines.slice(1).map(l => { const c = split(l); const o = {}; headers.forEach((h, i) => o[h] = c[i] ?? ''); return mapRow(o); });
    } else {
      parsed = lines.map(l => { const c = split(l); return { name: c[0] || '', team: c[1] || '', gradYear: c[2] || '', phone: c[3] || '', email: c[4] || '' }; });
    }
    const mapped = parsed.filter(r => r.name || r.email || r.team).map(r => ({ id: uid(), ...r, status: 'new', notes: '', source: 'Paste' }));
    if (!mapped.length) { setErr('Nothing parsed. Paste rows with Name, Team, Grad Year, Phone, Email.'); return; }
    setRows(r => [...r, ...mapped]); setPasteOpen(false); setPasteText('');
  };

  const inp = 'w-full px-3 py-2 text-sm border border-stone-600 bg-stone-800 text-stone-100 focus:border-amber-400 focus:outline-none rounded-sm';
  const btnP = 'flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold text-stone-900 px-3 py-2 rounded-sm';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Recruiting · Outreach</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Camp List · Emails</h1>
          <p className="text-sm text-stone-500 mt-1">{rows.length} contacts · import the CSV from your Brochure Reader, or paste / add by hand</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <label className={btnP + ' cursor-pointer'} style={{ background: PITT_NAVY, color: '#fff' }}>
          <FileSpreadsheet size={14} /> Import Excel / CSV
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files[0] && importSheet(e.target.files[0])} />
        </label>
        <button onClick={() => { setErr(''); setPasteOpen(true); }} className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold text-stone-300 px-3 py-2 border border-stone-600 hover:border-stone-400 rounded-sm"><ClipboardPaste size={14} /> Paste from Sheet</button>
        <button onClick={add} className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold text-stone-300 px-3 py-2 border border-stone-600 hover:border-stone-400 rounded-sm"><Plus size={14} /> Add Manually</button>
        <div className="flex-1" />
        <button onClick={() => sel.size && setComposer({ chosen: rows.filter(r => sel.has(r.id)), templateId: 'invite' })} disabled={!sel.size} className={btnP} style={{ background: sel.size ? PITT_GOLD : '#44403c', color: sel.size ? PITT_NAVY : '#78716c', cursor: sel.size ? 'pointer' : 'default' }}><Send size={14} /> Compose Email ({sel.size})</button>
      </div>

      {err && <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-2 rounded-sm">{err}</div>}

      <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-stone-500 italic">No camp contacts yet. Import your Brochure Reader CSV, paste from a sheet, or add manually.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-400 bg-stone-950">
                  <th className="px-3 py-2 w-9"><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(rows.map(r => r.id)))} /></th>
                  {['Name', 'Team / School', 'Grad', 'Phone', 'Email', 'Status', 'Notes', ''].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-stone-800 hover:bg-stone-800/30">
                    <td className="px-3 py-1.5"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></td>
                    {['name', 'team', 'gradYear', 'phone', 'email'].map(f => (
                      <td key={f} className="px-1 py-1"><input value={r[f]} onChange={e => upd(r.id, f, e.target.value)} className="w-full min-w-[80px] bg-transparent text-stone-100 px-2 py-1 rounded-sm border border-transparent hover:border-stone-700 focus:border-amber-400 focus:outline-none" /></td>
                    ))}
                    <td className="px-1 py-1">
                      <select value={r.status} onChange={e => upd(r.id, 'status', e.target.value)} className="bg-stone-800 border border-stone-700 text-xs rounded-sm px-1 py-1" style={{ color: (CAMP_STATUS.find(s => s.id === r.status) || CAMP_STATUS[0]).color }}>
                        {CAMP_STATUS.map(s => <option key={s.id} value={s.id} style={{ color: '#fff' }}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1"><input value={r.notes} onChange={e => upd(r.id, 'notes', e.target.value)} className="w-full min-w-[80px] bg-transparent text-stone-300 px-2 py-1 rounded-sm border border-transparent hover:border-stone-700 focus:border-amber-400 focus:outline-none" /></td>
                    <td className="px-2 py-1"><button onClick={() => del(r.id)} className="text-stone-600 hover:text-red-400"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPasteOpen(false)}>
          <div className="bg-stone-900 border border-stone-700 max-w-2xl w-full rounded-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
              <h3 className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Paste from Excel / Google Sheet</h3>
              <button onClick={() => setPasteOpen(false)} className="text-stone-500 hover:text-stone-200"><X size={16} /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-stone-500 mb-3">Copy rows from your sheet and paste below. With a header row, columns are matched automatically; without one, order is <b>Name · Team · Grad · Phone · Email</b>.</p>
              <textarea autoFocus value={pasteText} onChange={e => setPasteText(e.target.value)} rows={9} className={inp + ' font-mono text-xs'} placeholder={'Name\tTeam\tGrad\tPhone\tEmail\n…paste here…'} />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setPasteOpen(false)} className="text-xs tracking-wider uppercase font-semibold text-stone-300 px-4 py-2 border border-stone-600 rounded-sm">Cancel</button>
                <button onClick={applyPaste} className="text-xs tracking-wider uppercase font-semibold px-4 py-2 rounded-sm" style={{ background: PITT_GOLD, color: PITT_NAVY }}>Add Contacts</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {composer && <Composer composer={composer} setComposer={setComposer} onClose={() => setComposer(null)} inp={inp} />}
    </div>
  );
}

function Composer({ composer, setComposer, onClose, inp }) {
  const tpl = TEMPLATES.find(t => t.id === composer.templateId);
  const chosen = composer.chosen;
  const single = chosen.length === 1 ? chosen[0] : null;
  const fill = b => single ? b.replaceAll('{name}', single.name || 'there').replaceAll('{team}', single.team || 'your team') : b.replaceAll('{name}', 'Coaches & Players').replaceAll('{team}', 'your team');
  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(fill(tpl.body));
  const [copied, setCopied] = useState(false);
  useEffect(() => { const t = TEMPLATES.find(x => x.id === composer.templateId); setSubject(t.subject); setBody(fill(t.body)); /* eslint-disable-next-line */ }, [composer.templateId]);

  const recipients = chosen.map(c => c.email).filter(Boolean).join(',');
  const mailto = `mailto:${single ? (single.email || '') : ''}?${single ? '' : `bcc=${encodeURIComponent(recipients)}&`}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const copy = () => { navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 max-w-2xl w-full rounded-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
          <h3 className="font-serif text-xl text-stone-100" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Camp Email · {chosen.length} recipient{chosen.length > 1 ? 's' : ''}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setComposer(c => ({ ...c, templateId: t.id }))} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${composer.templateId === t.id ? 'border-amber-400 text-amber-400' : 'border-stone-600 text-stone-300'}`}>{t.name}</button>
            ))}
          </div>
          {!single && <div className="text-xs text-stone-500">Multiple recipients → BCC with a generic greeting (name/team aren’t personalized for group sends).</div>}
          <div><div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">To</div><input readOnly value={single ? (single.email || '—') : `${chosen.length} recipients (BCC)`} className={inp} /></div>
          <div><div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Subject</div><input value={subject} onChange={e => setSubject(e.target.value)} className={inp} /></div>
          <div><div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Body</div><textarea value={body} onChange={e => setBody(e.target.value)} rows={9} className={inp} style={{ lineHeight: 1.5 }} /></div>
          <div className="flex justify-end gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold text-stone-300 px-4 py-2 border border-stone-600 rounded-sm">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}</button>
            <a href={mailto} className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold px-4 py-2 rounded-sm" style={{ background: PITT_GOLD, color: PITT_NAVY, textDecoration: 'none' }}><Mail size={14} /> Open in Mail</a>
          </div>
        </div>
      </div>
    </div>
  );
}
