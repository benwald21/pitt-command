import React, { useState, useMemo } from 'react';
import { X, Layers } from 'lucide-react';

// ============================================================
// RECRUITING BOARD — 1-4-3-3 drag board (matches your depth chart positions)
// Uses your existing `recruits` data. Adds boardPos + interest fields.
// ============================================================
const PITT_NAVY = '#003594';
const PITT_GOLD = '#FFB81C';

const FORMATION = [
  { id: 'lw',  label: 'LW',  x: 16, y: 16 },
  { id: 'st',  label: 'ST',  x: 50, y: 10 },
  { id: 'rw',  label: 'RW',  x: 84, y: 16 },
  { id: 'cm',  label: 'CM',  x: 26, y: 42 },
  { id: 'cdm', label: 'CDM', x: 50, y: 52 },
  { id: 'cam', label: 'CAM', x: 74, y: 42 },
  { id: 'lb',  label: 'LB',  x: 14, y: 68 },
  { id: 'cb1', label: 'CB',  x: 36, y: 74 },
  { id: 'cb2', label: 'CB',  x: 64, y: 74 },
  { id: 'rb',  label: 'RB',  x: 86, y: 68 },
  { id: 'gk',  label: 'GK',  x: 50, y: 90 },
];

const INTEREST_META = {
  top2:     { label: 'Top 2 Choices',    short: 'Top 2',    color: 'bg-emerald-500', hex: '#10b981' },
  strong:   { label: 'Strong Interest',  short: 'Strong',   color: 'bg-amber-500',   hex: '#f59e0b' },
  moderate: { label: 'Moderate Interest',short: 'Moderate', color: 'bg-stone-500',   hex: '#78716c' },
};

const tierColor = t =>
  t === '1' ? 'bg-amber-500 text-stone-900'
  : t?.includes('1') ? 'bg-amber-400/70 text-stone-900'
  : (t === '2' || t === '2/1') ? 'bg-blue-600 text-white'
  : 'bg-stone-700 text-stone-300';

const firstName = n => (n || '').split(/[\s,]+/).filter(Boolean)[0] || '';
const initials = n => (n || '').split(/[\s,]+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '—';

export default function RecruitingBoard({ recruits, setRecruits }) {
  const classes = useMemo(() => {
    const base = ['2027', '2028', '2029', '2030'];
    const found = [...new Set(recruits.map(r => r.class))];
    return [...new Set([...base, ...found])].sort();
  }, [recruits]);

  const [cls, setCls] = useState(() => {
    const withData = ['2028', '2027', '2029', '2030'].find(y => recruits.some(r => r.class === y));
    return withData || '2028';
  });
  const [dragId, setDragId] = useState(null);
  const [selId, setSelId] = useState(null);

  const inClass = recruits.filter(r => r.class === cls);
  const placedBySlot = id => inClass.filter(r => r.boardPos === id);
  const bench = inClass.filter(r => !r.boardPos);

  const place = (id, pos) => { if (id) setRecruits(rs => rs.map(r => r.id === id ? { ...r, boardPos: pos } : r)); setSelId(null); };
  const clear = id => setRecruits(rs => rs.map(r => r.id === id ? { ...r, boardPos: '' } : r));
  const setInterest = (id, val) => setRecruits(rs => rs.map(r => r.id === id ? { ...r, interest: val } : r));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Recruiting · 1-4-3-3</div>
          <h1 className="font-serif text-4xl text-stone-100 tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Recruiting Board</h1>
          <p className="text-sm text-stone-500 mt-1">Drag a prospect onto the formation · {bench.length} unplaced in {cls}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {classes.map(y => (
            <button key={y} onClick={() => setCls(y)} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${cls === y ? 'text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'}`} style={cls === y ? { backgroundColor: PITT_GOLD } : {}}>{y}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(INTEREST_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-stone-400"><div className={`h-2.5 w-2.5 rounded-full ${m.color}`} />{m.label}</div>
        ))}
        {selId && <span className="text-xs text-amber-400 ml-auto">Tap a position to drop the selected prospect</span>}
      </div>

      <div className="grid grid-cols-3 gap-5 items-start">
        {/* PITCH */}
        <div className="col-span-2 bg-stone-900 border border-stone-700 p-3 rounded-sm">
          <div className="relative w-full" style={{ aspectRatio: '16/11', background: 'linear-gradient(180deg,#14532d 0%,#166534 50%,#14532d 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 55px, rgba(255,255,255,0.05) 55px, rgba(255,255,255,0.05) 110px)' }} />
            <svg className="absolute inset-3" viewBox="0 0 100 70" preserveAspectRatio="none" style={{ width: 'calc(100% - 24px)', height: 'calc(100% - 24px)' }}>
              <rect x="0" y="0" width="100" height="70" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.3" />
              <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(255,255,255,0.28)" strokeWidth="0.25" strokeDasharray="0.8 0.6" />
              <circle cx="50" cy="35" r="7" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.25" />
              <rect x="18" y="0" width="64" height="12" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.25" />
              <rect x="18" y="58" width="64" height="12" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.25" />
            </svg>
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] uppercase text-white/40 font-semibold">▲ Attack</div>

            {FORMATION.map(slot => {
              const here = placedBySlot(slot.id);
              const filled = here.length > 0;
              return (
                <div key={slot.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); place(dragId || selId, slot.id); }}
                  onClick={() => selId && place(selId, slot.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, minWidth: 96 }}>
                  <div className="text-[8px] font-bold tracking-wider px-1 py-0.5 rounded-sm mb-1" style={{ backgroundColor: filled ? PITT_GOLD : 'rgba(255,255,255,0.18)', color: filled ? PITT_NAVY : '#fff', border: `1.5px solid ${filled ? PITT_NAVY : 'rgba(255,255,255,0.5)'}` }}>{slot.label}</div>
                  {here.length === 0 ? (
                    <div className="text-[9px] text-white/45">drop here</div>
                  ) : here.map(r => {
                    const im = INTEREST_META[r.interest || 'moderate'];
                    return (
                      <div key={r.id} className="flex items-center gap-1 bg-white/95 rounded-sm px-1 py-0.5 mb-0.5" style={{ borderLeft: `3px solid ${im.hex}` }}>
                        <span className={`text-[8px] font-bold px-1 rounded-sm ${tierColor(r.tier)}`}>T{r.tier}</span>
                        <span className="text-[9px] font-semibold text-stone-900 truncate" style={{ maxWidth: 64 }}>{firstName(r.name)}</span>
                        <button onClick={e => { e.stopPropagation(); clear(r.id); }} className="text-red-600 leading-none"><X size={10} /></button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* BENCH (unplaced prospects for this class) */}
        <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400">Class of {cls}</span>
            <span className="text-[10px] text-stone-600">drag onto pitch</span>
          </div>
          <div className="p-2 space-y-1.5 max-h-[520px] overflow-y-auto">
            {bench.length === 0 && inClass.length === 0 && <div className="text-xs text-stone-600 italic px-2 py-8 text-center">No {cls} prospects yet. Add them in the Recruiting section.</div>}
            {bench.length === 0 && inClass.length > 0 && <div className="text-xs text-stone-600 italic px-2 py-8 text-center">All {cls} prospects are on the pitch.</div>}
            {bench.map(r => {
              const im = INTEREST_META[r.interest || 'moderate'];
              return (
                <div key={r.id} draggable
                  onDragStart={() => setDragId(r.id)} onDragEnd={() => setDragId(null)}
                  onClick={() => setSelId(selId === r.id ? null : r.id)}
                  className={`bg-stone-800 border p-2 rounded-sm cursor-grab ${selId === r.id ? 'border-amber-400' : 'border-stone-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 flex items-center justify-center text-[9px] font-bold rounded-sm shrink-0" style={{ background: PITT_NAVY, color: PITT_GOLD }}>{initials(r.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-stone-100 truncate">{r.name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{r.pos || '—'} · {r.club}</div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${tierColor(r.tier)}`}>T{r.tier}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className={`h-2 w-2 rounded-full ${im.color}`} />
                    <select value={r.interest || 'moderate'} onClick={e => e.stopPropagation()} onChange={e => setInterest(r.id, e.target.value)}
                      className="bg-stone-900 border border-stone-700 text-[10px] text-stone-300 rounded-sm px-1 py-0.5 flex-1">
                      {Object.entries(INTEREST_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
