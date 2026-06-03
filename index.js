import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Target, Mail, Plus, X, Download, Trash2,
  Edit3, Send, Copy, Check, Loader2, ClipboardPaste, Users,
  MapPin, Award, RefreshCw, AlertCircle,
} from "lucide-react";

const C = {
  navy: "#062a5e", navyDeep: "#041d40", navy2: "#0a3a7a",
  gold: "#FFB81C", goldSoft: "#ffd56b",
  pitch: "#2f7d3c", pitchDark: "#296f35",
  ink: "#101725", panel: "#ffffff", bg: "#eef1f5", line: "#dde3ec",
};

const STATUS = [
  { id: "starter", label: "Starter-ready", color: "#22c55e" },
  { id: "minutes", label: "Significant mins", color: "#eab308" },
  { id: "developmental", label: "Developmental", color: "#9ca3af" },
  { id: "need", label: "Priority need", color: "#ef4444" },
];
const statusOf = (id) => STATUS.find((s) => s.id === id) || STATUS[2];

const TIERS = [
  { id: 1, label: "Tier 1", short: "T1", color: "#FFB81C" },
  { id: 2, label: "Tier 2", short: "T2", color: "#0a3a7a" },
  { id: 3, label: "Tier 3", short: "T3", color: "#9ca3af" },
];
const tierOf = (id) => TIERS.find((t) => t.id === id) || TIERS[1];

const INTEREST = [
  { id: "top2", label: "Top 2 choices", short: "Top 2", color: "#16a34a" },
  { id: "strong", label: "Strong interest", short: "Strong", color: "#eab308" },
  { id: "moderate", label: "Moderate interest", short: "Moderate", color: "#9ca3af" },
];
const interestOf = (id) => INTEREST.find((i) => i.id === id) || INTEREST[2];

const CONTACT_STATUS = [
  { id: "new", label: "Not contacted", color: "#9ca3af" },
  { id: "invited", label: "Invited", color: "#3b82f6" },
  { id: "replied", label: "Replied", color: "#eab308" },
  { id: "attending", label: "Attending", color: "#22c55e" },
  { id: "attended", label: "Attended", color: "#0a3a7a" },
];
const cStatusOf = (id) => CONTACT_STATUS.find((s) => s.id === id) || CONTACT_STATUS[0];

const POSITION_GROUPS = ["GK", "LB", "CB", "RB", "CDM", "CM", "LW", "RW", "ST"];
const RATINGS = [
  { key: "technical", label: "Technical" },
  { key: "athleticism", label: "Athleticism (ACC)" },
  { key: "fit", label: "Positional Fit" },
  { key: "character", label: "Character" },
  { key: "coachability", label: "Coachability" },
];
const GRAD_YEARS = [2027, 2028, 2029, 2030];

const POSITIONS = [
  { id: "st", label: "9", name: "Striker", x: 50, y: 11 },
  { id: "lw", label: "LW", name: "Left Wing", x: 16, y: 17 },
  { id: "rw", label: "RW", name: "Right Wing", x: 84, y: 17 },
  { id: "lcm", label: "8", name: "Left CM", x: 29, y: 39 },
  { id: "rcm", label: "8", name: "Right CM", x: 71, y: 39 },
  { id: "cdm", label: "6", name: "Holding Mid", x: 50, y: 50 },
  { id: "lb", label: "LB", name: "Left Back", x: 12, y: 69 },
  { id: "lcb", label: "CB", name: "Left CB", x: 37, y: 74 },
  { id: "rcb", label: "CB", name: "Right CB", x: 63, y: 74 },
  { id: "rb", label: "RB", name: "Right Back", x: 88, y: 69 },
  { id: "gk", label: "GK", name: "Goalkeeper", x: 50, y: 90 },
];

const PLACEMENT_KEY = "pitt-placements-v2";
const NOTES_KEY = "pitt-notes-v2";

/* ====== API HELPERS ====== */
async function apiGet(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPatch(path, body) {
  const r = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiDelete(path, body) {
  const r = await fetch(path, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ====== MAIN APP ====== */
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [prospects, setProspects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [placements, setPlacements] = useState({});
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([apiGet("/api/prospects"), apiGet("/api/contacts")]);
      setProspects(p);
      setContacts(c);
      // placements + notes stay in localStorage (they're positional UI state, not data)
      try {
        const pl = localStorage.getItem(PLACEMENT_KEY);
        const nt = localStorage.getItem(NOTES_KEY);
        if (pl) setPlacements(JSON.parse(pl));
        if (nt) setNotes(JSON.parse(nt));
      } catch (_) {}
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // persist placements + notes to localStorage
  useEffect(() => {
    try { localStorage.setItem(PLACEMENT_KEY, JSON.stringify(placements)); } catch (_) {}
  }, [placements]);
  useEffect(() => {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch (_) {}
  }, [notes]);

  /* PROSPECT CRUD */
  const addProspect = async (data) => {
    setSyncing(true);
    try {
      const created = await apiPost("/api/prospects", data);
      setProspects((prev) => [...prev, created]);
      return created;
    } finally { setSyncing(false); }
  };
  const updateProspect = async (data) => {
    setSyncing(true);
    try {
      const updated = await apiPatch("/api/prospects", data);
      setProspects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    } finally { setSyncing(false); }
  };
  const removeProspect = async (id) => {
    setSyncing(true);
    try {
      await apiDelete("/api/prospects", { id });
      setProspects((prev) => prev.filter((p) => p.id !== id));
      setPlacements((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => { next[k] = (next[k] || []).filter((x) => x !== id); });
        return next;
      });
    } finally { setSyncing(false); }
  };

  /* CONTACT CRUD */
  const addContact = async (data) => {
    setSyncing(true);
    try {
      const created = await apiPost("/api/contacts", data);
      setContacts((prev) => [...prev, created]);
      return created;
    } finally { setSyncing(false); }
  };
  const updateContact = async (data) => {
    setSyncing(true);
    try {
      const updated = await apiPatch("/api/contacts", data);
      setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } finally { setSyncing(false); }
  };
  const removeContact = async (id) => {
    setSyncing(true);
    try {
      await apiDelete("/api/contacts", { id });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } finally { setSyncing(false); }
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "recruiting", label: "Top Recruiting", icon: Target },
    { id: "camp", label: "Camp List · Emails", icon: Mail },
  ];

  return (
    <div style={{ fontFamily: "'Archivo', system-ui, sans-serif", background: C.bg, color: C.ink, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Narrow:wght@600;700&display=swap');
        .rcc-uc{font-family:'Archivo Narrow',sans-serif;letter-spacing:.06em;text-transform:uppercase}
        input,select,textarea{font-family:inherit}
        ::-webkit-scrollbar{width:9px;height:9px}::-webkit-scrollbar-thumb{background:#c2cad6;border-radius:9px}
        .spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
      `}</style>

      <header style={{ background: `linear-gradient(180deg,${C.navy2},${C.navy})`, borderBottom: `4px solid ${C.gold}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.gold, color: C.navy, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 15 }}>PITT</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 19, lineHeight: 1 }}>Recruiting Command Center</div>
            <div className="rcc-uc" style={{ color: C.goldSoft, fontSize: 12, marginTop: 4 }}>Women's Soccer · 1-4-3-3 · Notion Sync</div>
          </div>
          {syncing && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.goldSoft, fontSize: 13 }}>
              <Loader2 size={15} className="spin" /> Saving…
            </div>
          )}
          <button onClick={loadAll} style={btn("transparent", "#fff", `1.5px solid ${C.gold}`)}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </header>

      <div style={{ display: "flex", alignItems: "stretch", minHeight: "calc(100vh - 76px)" }}>
        <aside style={{ width: 218, background: C.navyDeep, padding: "18px 12px", flexShrink: 0 }}>
          {nav.map((n) => {
            const active = page === n.id;
            const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 11,
                padding: "12px 14px", marginBottom: 6, borderRadius: 10, border: "none",
                cursor: "pointer", textAlign: "left", fontWeight: 700, fontSize: 14.5,
                background: active ? C.gold : "transparent",
                color: active ? C.navy : "#c6d2e6",
                borderLeft: active ? `4px solid ${C.navy}` : "4px solid transparent",
              }}>
                <Icon size={18} /> {n.label}
              </button>
            );
          })}
          <div style={{ marginTop: 22, padding: "0 6px" }}>
            <div className="rcc-uc" style={{ color: "#5e7196", fontSize: 11, marginBottom: 8 }}>Legend</div>
            {STATUS.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, color: "#aebbd2", fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: s.color }} /> {s.label}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: "12px 6px", borderTop: "1px solid #1a2f50" }}>
            <div className="rcc-uc" style={{ color: "#5e7196", fontSize: 10, marginBottom: 6 }}>Notion Sync</div>
            <div style={{ color: "#7c9cc0", fontSize: 12 }}>All data saves directly to your Notion workspace in real time.</div>
          </div>
        </aside>

        <main style={{ flex: 1, padding: 22, overflow: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", placeItems: "center", height: 300 }}>
              <div style={{ textAlign: "center", color: "#7c8aa3" }}>
                <Loader2 size={32} className="spin" style={{ marginBottom: 12 }} />
                <div>Loading from Notion…</div>
              </div>
            </div>
          ) : error ? (
            <div style={{ display: "grid", placeItems: "center", height: 300 }}>
              <div style={{ textAlign: "center", color: "#ef4444", maxWidth: 440 }}>
                <AlertCircle size={32} style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Connection Error</div>
                <div style={{ fontSize: 13, color: "#9aa6bb", marginBottom: 16 }}>{error}</div>
                <button onClick={loadAll} style={btn(C.navy, "#fff")}>Try Again</button>
              </div>
            </div>
          ) : page === "dashboard" ? (
            <Dashboard prospects={prospects} placements={placements} contacts={contacts} setPage={setPage} />
          ) : page === "recruiting" ? (
            <TopRecruiting
              prospects={prospects}
              placements={placements} setPlacements={setPlacements}
              notes={notes} setNotes={setNotes}
              onAdd={addProspect} onUpdate={updateProspect} onRemove={removeProspect}
            />
          ) : (
            <CampList
              contacts={contacts}
              onAdd={addContact} onUpdate={updateContact} onRemove={removeContact}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function btn(bg, color, border) {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px",
    borderRadius: 9, border: border || "none", background: bg, color,
    fontWeight: 700, fontSize: 13.5, cursor: "pointer",
  };
}
function card(extra = {}) {
  return { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, ...extra };
}

/* ====== DASHBOARD ====== */
function Dashboard({ prospects, placements, contacts, setPage }) {
  const byYear = GRAD_YEARS.map((y) => ({ y, n: prospects.filter((p) => p.gradYear === y).length }));
  const byPos = POSITION_GROUPS.map((g) => ({ g, n: prospects.filter((p) => p.position === g).length }));
  const placedCount = Object.values(placements).reduce((a, ids) => a + (ids?.length || 0), 0);
  const filledSlots = POSITIONS.filter((s) => (placements[s.id] || []).length > 0);
  const gapSlots = POSITIONS.filter((s) => (placements[s.id] || []).length === 0);
  const byTier = TIERS.map((t) => ({ ...t, n: prospects.filter((p) => p.tier === t.id).length }));
  const byInterest = INTEREST.map((i) => ({ ...i, n: prospects.filter((p) => p.interest === i.id).length }));
  const cStatusCounts = CONTACT_STATUS.map((s) => ({ ...s, n: contacts.filter((c) => c.status === s.id).length }));

  return (
    <div>
      <PageTitle title="Dashboard" sub="Program snapshot · synced with Notion" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <Stat label="Prospects tracked" value={prospects.length} icon={Users} />
        <Stat label="Placed on board" value={placedCount} sub={`${filledSlots.length}/11 positions covered`} icon={MapPin} />
        <Stat label="Camp contacts" value={contacts.length} icon={Mail} />
        <Stat label="Priority needs" value={prospects.filter((p) => p.status === "need").length} icon={Award} accent />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card({ padding: 18 })}>
          <SectionH>Prospect Tiers</SectionH>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {byTier.map((t) => (
              <div key={t.id} style={{ flex: 1, textAlign: "center", background: C.bg, borderRadius: 10, padding: "14px 0", borderTop: `3px solid ${t.color}` }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.navy }}>{t.n}</div>
                <div className="rcc-uc" style={{ fontSize: 12, color: "#64718a", marginTop: 2 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={card({ padding: 18 })}>
          <SectionH>Interest in Pitt</SectionH>
          <div style={{ marginTop: 12 }}>
            {byInterest.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: i.color }} />
                <span style={{ flex: 1, fontSize: 13.5 }}>{i.label}</span>
                <span style={{ fontWeight: 800 }}>{i.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card({ padding: 18 })}>
          <SectionH>Targets by Grad Year</SectionH>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {byYear.map((x) => (
              <div key={x.y} style={{ flex: 1, textAlign: "center", background: C.bg, borderRadius: 10, padding: "14px 0" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.navy }}>{x.n}</div>
                <div className="rcc-uc" style={{ fontSize: 12, color: "#64718a", marginTop: 2 }}>{x.y}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={card({ padding: 18 })}>
          <SectionH>Board Coverage (1-4-3-3)</SectionH>
          <div style={{ marginTop: 10 }}>
            <div className="rcc-uc" style={{ fontSize: 11.5, color: "#ef4444", marginBottom: 6 }}>Open positions (no target)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gapSlots.length === 0 ? <Pill tone="ok">All 11 covered</Pill> :
                gapSlots.map((s) => <Pill key={s.id} tone="bad">{s.name}</Pill>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={card({ padding: 18 })}>
          <SectionH>Targets by Position</SectionH>
          <div style={{ marginTop: 10 }}>
            {byPos.map((x) => (
              <div key={x.g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="rcc-uc" style={{ width: 36, fontSize: 11.5, fontWeight: 800, color: C.navy }}>{x.g}</span>
                <div style={{ flex: 1, background: C.bg, borderRadius: 6, height: 10 }}>
                  <div style={{ width: `${(x.n / Math.max(1, ...byPos.map(b => b.n))) * 100}%`, background: C.navy, height: "100%", borderRadius: 6 }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: C.navy, width: 20, textAlign: "right" }}>{x.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card({ padding: 18 })}>
          <SectionH>Camp Contact Status</SectionH>
          <div style={{ marginTop: 12 }}>
            {cStatusCounts.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: s.color }} />
                <span style={{ flex: 1, fontSize: 13.5 }}>{s.label}</span>
                <span style={{ fontWeight: 800 }}>{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== TOP RECRUITING ====== */
const BLANK_FORM = { name: "", club: "", gradYear: 2027, position: "CM", tier: 2, interest: "moderate", status: "developmental", notes: "", ratings: { technical: 0, athleticism: 0, fit: 0, character: 0, coachability: 0 } };

function TopRecruiting({ prospects, placements, setPlacements, notes, setNotes, onAdd, onUpdate, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [editing, setEditing] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [selectId, setSelectId] = useState(null);
  const [yearFilter, setYearFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const visible = yearFilter === "all" ? prospects : prospects.filter((p) => p.gradYear === yearFilter);
  const grouped = GRAD_YEARS.map((y) => ({ y, list: visible.filter((p) => p.gradYear === y) }));
  const placedIds = new Set(Object.values(placements).flat());

  const openEdit = (p) => { setForm({ ...p }); setEditing(p.id); setShowForm(true); };
  const openAdd = () => { setForm(BLANK_FORM); setEditing(null); setShowForm(true); };

  const submit = async () => {
    setSaving(true);
    try {
      if (editing) { await onUpdate({ ...form, id: editing }); }
      else { await onAdd(form); }
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm("Remove this prospect?")) await onRemove(id); };

  const dropSlot = (slotId) => {
    if (!dragId) return;
    setPlacements((prev) => ({ ...prev, [slotId]: [...new Set([...(prev[slotId] || []), dragId])] }));
    setDragId(null);
  };
  const slotClick = (slotId) => {
    if (!selectId) return;
    setPlacements((prev) => ({ ...prev, [slotId]: [...new Set([...(prev[slotId] || []), selectId])] }));
    setSelectId(null);
  };
  const unplace = (slotId, pid) => {
    setPlacements((prev) => ({ ...prev, [slotId]: (prev[slotId] || []).filter((x) => x !== pid) }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <PageTitle title="Top Recruiting Targets" sub="1-4-3-3 visual board · drag or tap to place" />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            style={{ ...inp, width: "auto", padding: "8px 12px" }}>
            <option value="all">All Years</option>
            {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openAdd} style={btn(C.navy, "#fff")}><Plus size={15} /> Add Prospect</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 18 }}>
        <Pitch placements={placements} prospects={prospects} onDropSlot={dropSlot} onSlotClick={slotClick} onUnplace={unplace} highlightYear={yearFilter !== "all" ? yearFilter : null} />

        <div>
          <div style={card({ padding: 0, overflow: "hidden", marginBottom: 14 })}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center" }}>
              <SectionH plain>Prospect List</SectionH>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#7c8aa3" }}>{visible.length} shown</span>
            </div>
            <div style={{ maxHeight: 460, overflow: "auto", padding: 12 }}>
              {visible.length === 0 ? (
                <Empty>No prospects yet. Click <b>Add Prospect</b> to start the board.</Empty>
              ) : grouped.map((g) => g.list.length === 0 ? null : (
                <div key={g.y} style={{ marginBottom: 14 }}>
                  <div className="rcc-uc" style={{ fontSize: 12, color: "#64718a", margin: "2px 2px 8px" }}>Class of {g.y}</div>
                  {g.list.map((p) => (
                    <ProspectChip key={p.id} p={p} placed={placedIds.has(p.id)}
                      selected={selectId === p.id}
                      onDragStart={() => setDragId(p.id)} onDragEnd={() => setDragId(null)}
                      onSelect={() => setSelectId(selectId === p.id ? null : p.id)}
                      onEdit={() => openEdit(p)} onRemove={() => remove(p.id)} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={card({ padding: 16 })}>
            <SectionH>Notes · {yearFilter !== "all" ? yearFilter : "All Years"}</SectionH>
            <textarea
              value={notes[yearFilter] || ""}
              onChange={(e) => setNotes((n) => ({ ...n, [yearFilter]: e.target.value }))}
              placeholder="e.g. Need a 2 GK and a CB; could use an OB; one more CM."
              style={{ width: "100%", minHeight: 90, marginTop: 10, padding: 11, borderRadius: 9, border: `1px solid ${C.line}`, resize: "vertical", fontSize: 13.5, boxSizing: "border-box" }} />
          </div>
        </div>
      </div>

      {showForm && (
        <ProspectForm form={form} setForm={setForm} editing={!!editing} saving={saving}
          onCancel={() => setShowForm(false)} onSubmit={submit} />
      )}
    </div>
  );
}

function ProspectChip({ p, placed, selected, onDragStart, onDragEnd, onSelect, onEdit, onRemove }) {
  const s = statusOf(p.status);
  const t = tierOf(p.tier);
  const intr = interestOf(p.interest);
  const avg = (RATINGS.reduce((a, r) => a + (p.ratings?.[r.key] || 0), 0) / RATINGS.length).toFixed(1);
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", marginBottom: 7,
        borderRadius: 10, cursor: "grab", background: selected ? "#fff7e0" : "#fff",
        border: `1.5px solid ${selected ? C.gold : C.line}`,
      }}>
      <span style={{ width: 11, height: 11, borderRadius: "50%", background: s.color, flexShrink: 0 }} title={s.label} />
      <span className="rcc-uc" style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: t.id === 1 ? C.navy : "#fff", background: t.color, borderRadius: 6, padding: "3px 6px" }}>{t.short}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {p.name} {placed && <span style={{ color: C.navy, fontSize: 11 }}>● on pitch</span>}
        </div>
        <div style={{ fontSize: 12, color: "#7c8aa3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {p.club || "—"} · {p.position} · <span style={{ color: intr.color, fontWeight: 700 }}>{intr.short}</span>
        </div>
      </div>
      <span className="rcc-uc" style={{ fontSize: 12, fontWeight: 700, color: C.navy, background: C.bg, borderRadius: 6, padding: "3px 7px" }}>{avg}</span>
      <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={iconBtn}><Edit3 size={14} /></button>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={iconBtn}><Trash2 size={14} /></button>
    </div>
  );
}
const iconBtn = { border: "none", background: "transparent", color: "#8a97ad", cursor: "pointer", padding: 3, display: "grid", placeItems: "center" };

function Pitch({ placements, prospects, onDropSlot, onSlotClick, onUnplace, highlightYear }) {
  const pById = useMemo(() => Object.fromEntries(prospects.map((p) => [p.id, p])), [prospects]);
  return (
    <div style={{
      position: "relative", width: "100%", paddingBottom: "118%",
      background: `repeating-linear-gradient(0deg,${C.pitch} 0 9%,${C.pitchDark} 9% 18%)`,
      borderRadius: 10, overflow: "hidden", border: "2px solid rgba(255,255,255,.25)",
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", width: 0, height: "100%", borderLeft: "2px solid rgba(255,255,255,.35)", transform: "translateX(-1px)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "26%", paddingBottom: "26%", border: "2px solid rgba(255,255,255,.35)", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "absolute", top: -1, left: "50%", width: "44%", height: "16%", border: "2px solid rgba(255,255,255,.35)", transform: "translateX(-50%)" }} />
      <div style={{ position: "absolute", bottom: -1, left: "50%", width: "44%", height: "16%", border: "2px solid rgba(255,255,255,.35)", transform: "translateX(-50%)" }} />
      <div className="rcc-uc" style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.6)", fontSize: 11 }}>▲ Attack</div>
      {POSITIONS.map((slot) => {
        const ids = placements[slot.id] || [];
        return (
          <div key={slot.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDropSlot(slot.id); }}
            onClick={() => onSlotClick(slot.id)}
            style={{ position: "absolute", left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%,-50%)", minWidth: 86, textAlign: "center" }}>
            <div className="rcc-uc" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 30, height: 30, padding: "0 8px", borderRadius: 8, fontWeight: 800, fontSize: 13,
              background: ids.length ? C.gold : "rgba(255,255,255,.18)",
              color: ids.length ? C.navy : "#fff",
              border: `2px solid ${ids.length ? C.navy : "rgba(255,255,255,.5)"}`,
            }}>{slot.label}</div>
            <div style={{ marginTop: 3 }}>
              {ids.length === 0 ? (
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.55)" }}>{slot.name}</div>
              ) : ids.map((id) => {
                const p = pById[id]; if (!p) return null;
                const dim = highlightYear && p.gradYear !== highlightYear;
                const s = statusOf(p.status); const t = tierOf(p.tier);
                return (
                  <div key={id} onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4, margin: "2px 1px 0",
                      background: "rgba(255,255,255,.95)", borderRadius: 7, padding: "2px 5px 2px 4px",
                      fontSize: 11, fontWeight: 700, color: C.ink, opacity: dim ? 0.4 : 1,
                      borderLeft: `4px solid ${s.color}`,
                    }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: t.id === 1 ? C.navy : "#fff", background: t.color, borderRadius: 4, padding: "1px 3px" }}>{t.short}</span>
                    <span style={{ maxWidth: 72, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name} <span style={{ color: "#8a97ad", fontWeight: 600 }}>'{String(p.gradYear).slice(2)}</span>
                    </span>
                    <button onClick={() => onUnplace(slot.id, id)} style={{ border: "none", background: "transparent", color: "#b04", cursor: "pointer", padding: 0, lineHeight: 0 }}><X size={12} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProspectForm({ form, setForm, editing, saving, onCancel, onSubmit }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title={editing ? "Edit Prospect" : "Add Prospect"} onClose={onCancel}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Name"><input style={inp} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        <Field label="Club / School"><input style={inp} value={form.club || ""} onChange={(e) => set("club", e.target.value)} /></Field>
        <Field label="Grad Year">
          <select style={inp} value={form.gradYear} onChange={(e) => set("gradYear", Number(e.target.value))}>
            {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Position">
          <select style={inp} value={form.position} onChange={(e) => set("position", e.target.value)}>
            {POSITION_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Tier" full>
          <div style={{ display: "flex", gap: 8 }}>
            {TIERS.map((t) => (
              <button key={t.id} onClick={() => set("tier", t.id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${form.tier === t.id ? C.navy : C.line}`,
                background: form.tier === t.id ? "#eef3fb" : "#fff", fontWeight: 700, fontSize: 13,
              }}>
                <span className="rcc-uc" style={{ fontSize: 11, fontWeight: 800, color: t.id === 1 ? C.navy : "#fff", background: t.color, borderRadius: 5, padding: "2px 6px" }}>{t.short}</span> {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Interest in Pitt" full>
          <div style={{ display: "flex", gap: 8 }}>
            {INTEREST.map((i) => (
              <button key={i.id} onClick={() => set("interest", i.id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${form.interest === i.id ? C.navy : C.line}`,
                background: form.interest === i.id ? "#eef3fb" : "#fff", fontWeight: 700, fontSize: 13,
              }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: i.color }} /> {i.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Projected Status" full>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS.map((s) => (
              <button key={s.id} onClick={() => set("status", s.id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 9, cursor: "pointer",
                border: `1.5px solid ${form.status === s.id ? C.navy : C.line}`,
                background: form.status === s.id ? "#eef3fb" : "#fff", fontWeight: 700, fontSize: 13,
              }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: s.color }} /> {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Notes" full>
          <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Scouting notes, links, context…" />
        </Field>
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="rcc-uc" style={{ fontSize: 12, color: "#64718a", marginBottom: 10 }}>Evaluation (1–5)</div>
        {RATINGS.map((r) => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
            <span style={{ width: 150, fontSize: 13.5, fontWeight: 600 }}>{r.label}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setForm((f) => ({ ...f, ratings: { ...f.ratings, [r.key]: n } }))}
                  style={{
                    width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 14,
                    border: `1.5px solid ${C.line}`,
                    background: (form.ratings?.[r.key] || 0) >= n ? C.navy : "#fff",
                    color: (form.ratings?.[r.key] || 0) >= n ? "#fff" : "#9aa6bb",
                  }}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <button onClick={onCancel} style={btn(C.bg, C.ink)}>Cancel</button>
        <button onClick={onSubmit} disabled={saving} style={btn(C.navy, "#fff")}>
          {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : editing ? "Save Changes" : "Add to Board"}
        </button>
      </div>
    </Modal>
  );
}

/* ====== CAMP LIST ====== */
const EMAIL_TEMPLATES = [
  {
    id: "invite", name: "Camp Invitation",
    subject: "Invitation: Pitt Women's Soccer ID Camp",
    body: `Hi {name},\n\nI'm reaching out from the University of Pittsburgh Women's Soccer staff. We'd like to invite {team} players to our upcoming ID Camp here on campus.\n\nIt's a great chance for our staff to evaluate players in our environment and for prospects to experience our program first-hand.\n\nCamp details and registration are below — happy to answer any questions.\n\nBest,\nPitt Women's Soccer`,
  },
  {
    id: "followup", name: "Follow-up — Saw You Play",
    subject: "Following up — Pitt Women's Soccer",
    body: `Hi {name},\n\nOur staff recently watched {team} and wanted to follow up. We were impressed by what we saw and would like to stay in contact as we continue our evaluation.\n\nWe'd love to get you on campus for an upcoming ID Camp or visit. Let me know the best way to keep in touch.\n\nBest,\nPitt Women's Soccer`,
  },
];

function CampList({ contacts, onAdd, onUpdate, onRemove }) {
  const [sel, setSel] = useState(new Set());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [composer, setComposer] = useState(null);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(sel.size === contacts.length ? new Set() : new Set(contacts.map((c) => c.id)));

  const addRow = async () => {
    const created = await onAdd({ name: "", team: "", phone: "", email: "", source: "Manual", status: "new", notes: "" });
  };

  const update = async (id, field, value) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    await onUpdate({ ...contact, [field]: value });
  };

  const removeRow = async (id) => {
    if (confirm("Remove this contact?")) await onRemove(id);
  };

  const applyPaste = async () => {
    const lines = pasteText.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return;
    setSaving(true);
    try {
      for (const line of lines) {
        const cols = line.split("\t").map((c) => c.trim());
        if (cols.length >= 2) {
          await onAdd({ name: cols[0] || "", team: cols[1] || "", phone: cols[2] || "", email: cols[3] || "", source: "Paste", status: "new", notes: "" });
        }
      }
      setPasteOpen(false);
      setPasteText("");
    } finally { setSaving(false); }
  };

  const openComposer = (templateId) => {
    const chosen = contacts.filter((c) => sel.has(c.id));
    if (!chosen.length) return alert("Select at least one contact first.");
    setComposer({ templateId, chosen });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <PageTitle title="Camp List · Emails" sub={`${contacts.length} contacts · ${sel.size} selected`} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setPasteOpen(true)} style={btn(C.bg, C.ink)}><ClipboardPaste size={15} /> Paste from Sheet</button>
          <button onClick={addRow} style={btn(C.bg, C.ink)}><Plus size={15} /> Add Row</button>
          {EMAIL_TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => openComposer(t.id)} style={btn(C.navy, "#fff")}><Send size={15} /> {t.name}</button>
          ))}
        </div>
      </div>

      <div style={card({ overflow: "hidden" })}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: C.navy, color: "#fff" }}>
              <tr>
                <Th><input type="checkbox" checked={sel.size === contacts.length && contacts.length > 0} onChange={toggleAll} /></Th>
                <Th>Name</Th><Th>Team</Th><Th>Phone</Th><Th>Email</Th><Th>Source</Th><Th>Status</Th><Th>Notes</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#9aa6bb" }}>No contacts yet. Add a row or paste from a spreadsheet.</td></tr>
              ) : contacts.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 ? "#f7f9fc" : "#fff" }}>
                  <Td><input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} /></Td>
                  <Td><CellInput v={c.name} onChange={(v) => update(c.id, "name", v)} ph="Name" /></Td>
                  <Td><CellInput v={c.team} onChange={(v) => update(c.id, "team", v)} ph="Team" /></Td>
                  <Td><CellInput v={c.phone} onChange={(v) => update(c.id, "phone", v)} ph="Phone" /></Td>
                  <Td><CellInput v={c.email} onChange={(v) => update(c.id, "email", v)} ph="Email" /></Td>
                  <Td><span style={{ fontSize: 12, color: "#7c8aa3" }}>{c.source}</span></Td>
                  <Td>
                    <select value={c.status} onChange={(e) => update(c.id, "status", e.target.value)}
                      style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 6px", fontSize: 12.5, color: cStatusOf(c.status).color, fontWeight: 700 }}>
                      {CONTACT_STATUS.map((s) => <option key={s.id} value={s.id} style={{ color: "#111" }}>{s.label}</option>)}
                    </select>
                  </Td>
                  <Td><CellInput v={c.notes} onChange={(v) => update(c.id, "notes", v)} ph="—" /></Td>
                  <Td><button onClick={() => removeRow(c.id)} style={iconBtn}><Trash2 size={15} /></button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pasteOpen && (
        <Modal title="Paste from Excel / Google Sheet" onClose={() => setPasteOpen(false)} wide>
          <div style={{ fontSize: 13.5, color: "#64718a", marginBottom: 10 }}>
            Copy rows from your sheet and paste below. Column order: <b>Name · Team · Phone · Email</b>
          </div>
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} autoFocus
            placeholder={"Name\tTeam\tPhone\tEmail\n…paste rows here…"}
            style={{ ...inp, minHeight: 220, resize: "vertical", fontFamily: "monospace", fontSize: 12.5 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button onClick={() => setPasteOpen(false)} style={btn(C.bg, C.ink)}>Cancel</button>
            <button onClick={applyPaste} disabled={saving} style={btn(C.navy, "#fff")}>
              {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : "Add Contacts"}
            </button>
          </div>
        </Modal>
      )}

      {composer && <Composer composer={composer} setComposer={setComposer} onClose={() => setComposer(null)} />}
    </div>
  );
}

function Composer({ composer, setComposer, onClose }) {
  const tpl = EMAIL_TEMPLATES.find((t) => t.id === composer.templateId);
  const chosen = composer.chosen;
  const single = chosen.length === 1 ? chosen[0] : null;
  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(personalize(tpl.body, single, chosen));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = EMAIL_TEMPLATES.find((x) => x.id === composer.templateId);
    setSubject(t.subject);
    setBody(personalize(t.body, single, chosen));
  }, [composer.templateId]);

  const recipients = chosen.map((c) => c.email).filter(Boolean).join(",");
  const mailto = `mailto:${single ? (single.email || "") : ""}?${single ? "" : `bcc=${encodeURIComponent(recipients)}&`}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const copy = () => { navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <Modal title={`Compose · ${chosen.length} recipient${chosen.length > 1 ? "s" : ""}`} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {EMAIL_TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => setComposer((c) => ({ ...c, templateId: t.id }))}
            style={{ padding: "9px 14px", borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: "pointer", border: `1.5px solid ${composer.templateId === t.id ? C.navy : C.line}`, background: composer.templateId === t.id ? "#eef3fb" : "#fff", color: C.navy }}>{t.name}</button>
        ))}
      </div>
      <Field label="To"><input style={inp} readOnly value={single ? (single.email || "—") : `${chosen.length} recipients (BCC)`} /></Field>
      <div style={{ height: 10 }} />
      <Field label="Subject"><input style={inp} value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
      <div style={{ height: 10 }} />
      <Field label="Body">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ ...inp, minHeight: 230, resize: "vertical", lineHeight: 1.5 }} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button onClick={copy} style={btn(C.bg, C.ink)}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}</button>
        <a href={mailto} style={{ ...btn(C.navy, "#fff"), textDecoration: "none" }}><Mail size={15} /> Open in Mail</a>
      </div>
    </Modal>
  );
}
function personalize(body, single, chosen) {
  if (single) return body.replaceAll("{name}", single.name || "there").replaceAll("{team}", single.team || "your team");
  return body.replaceAll("{name}", "Coaches & Players").replaceAll("{team}", "your team");
}

/* ====== SHARED UI ====== */
function PageTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.navy, letterSpacing: "-0.01em" }}>{title}</h1>
      <div className="rcc-uc" style={{ color: "#7c8aa3", fontSize: 12.5, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
function SectionH({ children, plain }) {
  return <div className="rcc-uc" style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{children}</div>;
}
function Stat({ label, value, sub, icon: Icon, accent }) {
  return (
    <div style={card({ padding: 16, display: "flex", alignItems: "center", gap: 14, borderTop: `3px solid ${accent ? C.gold : C.navy}` })}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: accent ? "#fff6df" : "#eef3fb", display: "grid", placeItems: "center", color: accent ? "#b8860b" : C.navy }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.navy, lineHeight: 1 }}>{value}</div>
        <div className="rcc-uc" style={{ fontSize: 11.5, color: "#7c8aa3", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#9aa6bb", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
function Empty({ children }) {
  return <div style={{ color: "#9aa6bb", fontSize: 13.5, padding: "14px 4px", textAlign: "center" }}>{children}</div>;
}
function Pill({ children, tone }) {
  const map = { ok: ["#e7f7ec", "#1a7f37"], bad: ["#fdeeee", "#c0392b"] };
  const [bg, fg] = map[tone] || ["#eef3fb", C.navy];
  return <span style={{ background: bg, color: fg, fontSize: 12, fontWeight: 700, padding: "4px 9px", borderRadius: 7 }}>{children}</span>;
}
function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div className="rcc-uc" style={{ fontSize: 11.5, color: "#64718a", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
const inp = { width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${C.line}`, fontSize: 14, boxSizing: "border-box" };
function CellInput({ v, onChange, ph }) {
  const [local, setLocal] = useState(v);
  useEffect(() => setLocal(v), [v]);
  return (
    <input value={local} placeholder={ph} onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== v) onChange(local); }}
      style={{ width: "100%", minWidth: 90, border: "1px solid transparent", background: "transparent", padding: "6px 4px", fontSize: 13.5, borderRadius: 6 }}
      onFocus={(e) => (e.target.style.border = `1px solid ${C.line}`)} />
  );
}
const Th = ({ children }) => <th style={{ textAlign: "left", padding: "11px 12px", fontWeight: 700, fontSize: 12.5, color: "#fff" }} className="rcc-uc">{children}</th>;
const Td = ({ children }) => <td style={{ padding: "6px 12px", borderBottom: `1px solid ${C.line}` }}>{children}</td>;
function Modal({ title, children, onClose, wide }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,20,45,.55)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: wide ? 640 : 560, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.line}`, background: C.navy, borderRadius: "16px 16px 0 0" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "transparent", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
