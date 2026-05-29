import { useState, useEffect } from 'react';
import { Plus, Mail, Trash2, Save, X, AlertCircle, CheckCircle2, Zap, Edit2, Phone, AtSign } from 'lucide-react';

const GOLD = '#FFB81C';
const NAVY = '#003594';

const AUDIENCE_TYPES = ['alumni', 'season_tickets'];
const AUDIENCE_LABELS = { alumni: 'Alumni', season_tickets: 'Season Ticket Holders' };
const AUDIENCE_COLORS = { alumni: 'bg-blue-600', season_tickets: 'bg-amber-500' };

const TEMPLATE_ALUMNI = `PITT WOMEN'S SOCCER — ALUMNI UPDATE

Hi [First Name],

Thank you for your continued support of Pitt Women's Soccer. Here's your latest update from the program.

─────────────────────────────
PROGRAM NEWS
─────────────────────────────
[Add your program update here]

─────────────────────────────
UPCOMING MATCHES
─────────────────────────────
[Add match schedule here]

─────────────────────────────
ALUMNI SPOTLIGHT
─────────────────────────────
[Feature a former player]

─────────────────────────────
GET INVOLVED
─────────────────────────────
Interested in mentoring current players or attending a game?
Reply to this email or visit pittsburghpanthers.com.

Forged in Steel,
Ben Waldrum
Head Coach, Pitt Women's Soccer`;

const TEMPLATE_SEASON = `PITT WOMEN'S SOCCER — SEASON TICKET HOLDER UPDATE

Hi [First Name],

Thank you for being a valued Season Ticket Holder. Here's everything you need to know for the upcoming matches.

─────────────────────────────
UPCOMING HOME MATCHES
─────────────────────────────
[Add match details, dates, times, opponents]

─────────────────────────────
TICKET INFORMATION
─────────────────────────────
[Parking, gate times, family sections]

─────────────────────────────
TEAM NEWS
─────────────────────────────
[Roster updates, results, highlights]

─────────────────────────────
EXCLUSIVE ACCESS
─────────────────────────────
[Season ticket holder events, meet and greet, etc.]

We will see you at Ambrose Urbanic Field!

Forged in Steel,
Ben Waldrum
Head Coach, Pitt Women's Soccer`;

const INP = 'w-full px-3 py-2 text-sm border border-stone-600 bg-stone-800 text-stone-100 focus:border-amber-400 focus:outline-none rounded-sm placeholder:text-stone-500';
const BTN_P = 'text-xs tracking-wider uppercase font-semibold text-stone-900 bg-amber-400 px-4 py-2 hover:bg-amber-300 flex items-center gap-1.5 transition-colors rounded-sm';
const BTN_S = 'text-xs tracking-wider uppercase font-semibold text-stone-300 px-4 py-2 border border-stone-600 hover:border-stone-400 rounded-sm';

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400 block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl rounded-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
          <h3 className="text-xl text-stone-100 font-semibold">{title}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 text-stone-200">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-stone-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function SubscriberModal({ sub, audience, onSave, onClose }) {
  const [d, setD] = useState(sub || { firstName: '', lastName: '', email: '', audience, status: 'active' });
  return (
    <Modal open onClose={onClose} title={sub ? 'Edit Subscriber' : 'Add Subscriber'} footer={
      <>
        <button onClick={onClose} className={BTN_S}>Cancel</button>
        <button onClick={() => onSave(d)} className={BTN_P}><Save size={12} />Save</button>
      </>
    }>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name"><input autoFocus value={d.firstName} onChange={e => setD({ ...d, firstName: e.target.value })} className={INP} /></Field>
        <Field label="Last Name"><input value={d.lastName} onChange={e => setD({ ...d, lastName: e.target.value })} className={INP} /></Field>
        <div className="col-span-2"><Field label="Email"><input type="email" value={d.email} onChange={e => setD({ ...d, email: e.target.value })} className={INP} /></Field></div>
        <Field label="Audience">
          <select value={d.audience} onChange={e => setD({ ...d, audience: e.target.value })} className={INP}>
            {AUDIENCE_TYPES.map(a => <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={d.status} onChange={e => setD({ ...d, status: e.target.value })} className={INP}>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}

async function loadStore(key, fallback) {
  try { const r = await window.storage.get(key); if (r?.value) return JSON.parse(r.value); } catch {}
  return fallback;
}
async function saveStore(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}
function nid(p) { return `${p}${Date.now()}${Math.random().toString(36).slice(2, 5)}`; }

export default function ConnectionView() {
  const [tab, setTab] = useState('campaigns');
  const [audience, setAudience] = useState('alumni');
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [composing, setComposing] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [apiMsg, setApiMsg] = useState('');

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([loadStore('pcc:campaigns', []), loadStore('pcc:subscribers', [])]);
      setCampaigns(c); setSubscribers(s);
    })();
  }, []);

  const saveCampaigns = v => { setCampaigns(v); saveStore('pcc:campaigns', v); };
  const saveSubscribers = v => { setSubscribers(v); saveStore('pcc:subscribers', v); };

  const audienceSubs = subscribers.filter(s => s.audience === audience);
  const audienceCampaigns = campaigns.filter(c => c.audience === audience);

  const sendCampaign = async (campaign) => {
    setApiStatus('sending');
    setApiMsg('');
    try {
      const res = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience: campaign.audience, subject: campaign.subject, previewText: campaign.previewText, body: campaign.body }),
      });
      const data = await res.json();
      if (res.ok) {
        saveCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: 'sent', sentAt: new Date().toISOString(), sentCount: data.sent } : c));
        setApiStatus('ok');
        setApiMsg(`Sent to ${data.sent} subscribers.`);
      } else {
        setApiStatus('err');
        setApiMsg(data.error || 'Send failed.');
      }
    } catch (e) {
      setApiStatus('err');
      setApiMsg('Could not reach /api/send-newsletter. Make sure the API file is deployed.');
    }
    setTimeout(() => setApiStatus(null), 6000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-stone-700 pb-5">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">Alumni · Season Ticket Holders</div>
          <h1 className="text-4xl font-bold text-stone-100">Connection</h1>
          <p className="text-sm text-stone-500 mt-1">Newsletter system powered by Resend · {subscribers.length} total subscribers</p>
        </div>
        <div className="flex items-center gap-2">
          {AUDIENCE_TYPES.map(a => (
            <button key={a} onClick={() => setAudience(a)} className={`text-xs tracking-wider uppercase font-semibold px-3 py-2 border rounded-sm ${audience === a ? 'text-stone-900 border-amber-400' : 'bg-stone-900 text-stone-300 border-stone-700'}`} style={audience === a ? { backgroundColor: GOLD } : {}}>{AUDIENCE_LABELS[a]}</button>
          ))}
        </div>
      </div>

      {apiStatus && (
        <div className={`px-4 py-3 rounded-sm flex items-center gap-3 text-sm font-medium ${apiStatus === 'sending' ? 'bg-stone-800 border border-stone-700 text-stone-300' : apiStatus === 'ok' ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300' : 'bg-red-950/50 border border-red-800 text-red-300'}`}>
          {apiStatus === 'sending' && <div className="h-3 w-3 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" />}
          {apiStatus === 'ok' && <CheckCircle2 size={14} />}
          {apiStatus === 'err' && <AlertCircle size={14} />}
          {apiStatus === 'sending' ? 'Sending via Resend…' : apiMsg}
        </div>
      )}

      <div className="grid grid-cols-4 gap-px bg-stone-800">
        {[
          { label: `${AUDIENCE_LABELS[audience]} Subscribers`, val: audienceSubs.length, sub: `${audienceSubs.filter(s => s.status === 'active').length} active`, accent: 'border-amber-400' },
          { label: 'Campaigns Sent', val: audienceCampaigns.filter(c => c.status === 'sent').length, sub: `to ${AUDIENCE_LABELS[audience]}`, accent: 'border-emerald-500' },
          { label: 'Drafts', val: audienceCampaigns.filter(c => c.status === 'draft').length, sub: 'ready to send', accent: 'border-blue-500' },
          { label: 'All Subscribers', val: subscribers.length, sub: 'across both audiences', accent: 'border-violet-500' },
        ].map((m, i) => (
          <div key={i} className={`bg-stone-900 p-5 border-t-2 ${m.accent}`}>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold mb-2">{m.label}</div>
            <div className="text-3xl font-bold text-stone-100 leading-none mb-1">{m.val}</div>
            <div className="text-xs text-stone-500">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-px bg-stone-800/50">
        {[{ id: 'campaigns', label: 'Campaigns' }, { id: 'compose', label: 'Compose' }, { id: 'subscribers', label: 'Subscribers' }, { id: 'templates', label: 'Templates' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`text-xs tracking-wider uppercase font-semibold px-5 py-2.5 transition-colors ${tab === t.id ? 'bg-stone-900 text-amber-400' : 'bg-stone-950 text-stone-500 hover:text-stone-300 hover:bg-stone-900/60'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-100">{AUDIENCE_LABELS[audience]} Campaigns</h2>
            <button onClick={() => { setComposing({ audience, subject: '', previewText: '', body: audience === 'alumni' ? TEMPLATE_ALUMNI : TEMPLATE_SEASON, status: 'draft' }); setTab('compose'); }} className={BTN_P}><Plus size={13} />New Campaign</button>
          </div>
          {audienceCampaigns.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 p-16 text-center rounded-sm">
              <Mail size={32} className="text-stone-700 mx-auto mb-4" />
              <div className="text-stone-400 text-sm mb-2">No campaigns yet for {AUDIENCE_LABELS[audience]}</div>
              <button onClick={() => { setComposing({ audience, subject: '', previewText: '', body: audience === 'alumni' ? TEMPLATE_ALUMNI : TEMPLATE_SEASON, status: 'draft' }); setTab('compose'); }} className={BTN_P + ' mx-auto'}><Plus size={13} />Create First Campaign</button>
            </div>
          ) : (
            <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
              <div className="grid px-4 py-2 border-b border-stone-800 bg-stone-950 text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-400" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                {['Subject', 'Status', 'Created', 'Recipients', ''].map((h, i) => <div key={i}>{h}</div>)}
              </div>
              {[...audienceCampaigns].reverse().map(c => (
                <div key={c.id} className="grid px-4 py-3 border-b border-stone-800 last:border-0 items-center hover:bg-stone-800/30" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                  <div className="text-sm font-medium text-stone-100 truncate">{c.subject || '(no subject)'}</div>
                  <div><span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm border ${c.status === 'sent' ? 'text-emerald-300 bg-emerald-950 border-emerald-800' : 'text-amber-300 bg-amber-950 border-amber-800'}`}>{c.status}</span></div>
                  <div className="text-xs text-stone-500 font-mono">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</div>
                  <div className="text-xs font-mono text-stone-400">{c.sentCount ?? '—'}</div>
                  <div className="flex items-center gap-2">
                    {c.status === 'draft' && (
                      <>
                        <button onClick={() => { setComposing(c); setTab('compose'); }} className="text-[10px] px-2 py-1 border border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-400 rounded-sm">Edit</button>
                        <button onClick={() => { if (window.confirm(`Send "${c.subject}" to ${subscribers.filter(s => s.audience === c.audience && s.status === 'active').length} active subscribers?`)) sendCampaign(c); }} className="text-[10px] px-2 py-1 border border-stone-700 text-emerald-400 hover:border-emerald-500 rounded-sm">Send</button>
                      </>
                    )}
                    {c.status === 'sent' && <span className="text-[10px] text-stone-600 italic">Sent {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : ''}</span>}
                    <button onClick={() => saveCampaigns(campaigns.filter(x => x.id !== c.id))} className="text-stone-700 hover:text-red-400"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'compose' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-100">{composing?.id ? 'Edit Campaign' : 'New Campaign'}</h2>
            <div className="flex gap-2">
              <button onClick={() => { setComposing(null); setTab('campaigns'); }} className={BTN_S}>Cancel</button>
              <button onClick={() => {
                if (!composing) return;
                const now = new Date().toISOString();
                if (composing.id) {
                  saveCampaigns(campaigns.map(x => x.id === composing.id ? composing : x));
                } else {
                  saveCampaigns([...campaigns, { ...composing, id: nid('camp'), createdAt: now, status: 'draft' }]);
                }
                setComposing(null);
                setTab('campaigns');
              }} className={BTN_P}><Save size={12} />Save Draft</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-3">
              <Field label="Subject Line"><input value={composing?.subject || ''} onChange={e => setComposing({ ...composing, subject: e.target.value })} className={INP} placeholder="e.g. Pitt Women's Soccer — Spring 2026 Alumni Update" /></Field>
              <Field label="Preview Text"><input value={composing?.previewText || ''} onChange={e => setComposing({ ...composing, previewText: e.target.value })} className={INP} placeholder="Short summary shown in email inbox" /></Field>
            </div>
            <div>
              <Field label="Audience">
                <select value={composing?.audience || 'alumni'} onChange={e => setComposing({ ...composing, audience: e.target.value, body: e.target.value === 'alumni' ? TEMPLATE_ALUMNI : TEMPLATE_SEASON })} className={INP}>
                  {AUDIENCE_TYPES.map(a => <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>)}
                </select>
              </Field>
              <div className="bg-stone-900 border border-stone-800 p-3 rounded-sm text-xs text-stone-500 space-y-1">
                <div className="font-semibold text-stone-300 text-[11px] uppercase tracking-wider">Placeholders</div>
                <div><code className="text-amber-300">[First Name]</code></div>
                <div><code className="text-amber-300">[Last Name]</code></div>
                <div><code className="text-amber-300">[Date]</code></div>
              </div>
            </div>
          </div>
          <Field label="Email Body">
            <textarea value={composing?.body || ''} onChange={e => setComposing({ ...composing, body: e.target.value })} className={INP + ' font-mono text-xs leading-relaxed'} rows={20} />
          </Field>
        </div>
      )}

      {tab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-100">{AUDIENCE_LABELS[audience]} Subscribers</h2>
            <button onClick={() => setEditingSub({ _new: true })} className={BTN_P}><Plus size={13} />Add Subscriber</button>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
            <div className="grid px-4 py-2 border-b border-stone-800 bg-stone-950 text-[10px] tracking-[0.15em] uppercase font-semibold text-stone-400" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr auto' }}>
              {['Name', 'Email', 'Audience', 'Status', ''].map((h, i) => <div key={i}>{h}</div>)}
            </div>
            {audienceSubs.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-stone-500 italic">No subscribers yet. Click Add Subscriber to get started.</div>
            ) : (
              audienceSubs.map(s => (
                <div key={s.id} className="grid px-4 py-3 border-b border-stone-800 last:border-0 items-center hover:bg-stone-800/30" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr auto' }}>
                  <div className="text-sm font-medium text-stone-100">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-stone-400 font-mono truncate">{s.email}</div>
                  <div><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm text-white ${AUDIENCE_COLORS[s.audience]}`}>{AUDIENCE_LABELS[s.audience]}</span></div>
                  <button onClick={() => saveSubscribers(subscribers.map(x => x.id === s.id ? { ...x, status: x.status === 'active' ? 'unsubscribed' : 'active' } : x))} className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm border ${s.status === 'active' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-stone-900 text-stone-500 border-stone-700'}`}>{s.status === 'active' ? 'Active' : 'Unsub'}</button>
                  <button onClick={() => saveSubscribers(subscribers.filter(x => x.id !== s.id))} className="text-stone-700 hover:text-red-400 ml-2"><Trash2 size={11} /></button>
                </div>
              ))
            )}
          </div>
          {editingSub && (
            <SubscriberModal
              sub={editingSub._new ? null : editingSub}
              audience={audience}
              onSave={s => {
                if (editingSub._new) saveSubscribers([...subscribers, { ...s, id: nid('sub'), status: 'active' }]);
                else saveSubscribers(subscribers.map(x => x.id === s.id ? s : x));
                setEditingSub(null);
              }}
              onClose={() => setEditingSub(null)}
            />
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-2 gap-5">
          {[
            { key: 'alumni', label: 'Alumni Newsletter', template: TEMPLATE_ALUMNI },
            { key: 'season_tickets', label: 'Season Ticket Holder Update', template: TEMPLATE_SEASON },
          ].map(t => (
            <div key={t.key} className="bg-stone-900 border border-stone-800 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm text-white ${AUDIENCE_COLORS[t.key]}`}>{AUDIENCE_LABELS[t.key]}</span>
                  <div className="text-sm font-semibold text-stone-100 mt-1">{t.label}</div>
                </div>
                <button onClick={() => { setAudience(t.key); setComposing({ audience: t.key, subject: '', previewText: '', body: t.template, status: 'draft' }); setTab('compose'); }} className={BTN_P + ' text-[11px]'}><Edit2 size={11} />Use Template</button>
              </div>
              <div className="px-5 py-3">
                <pre className="text-[10px] text-stone-400 leading-relaxed whitespace-pre-wrap bg-stone-950 border border-stone-800 p-3 rounded-sm max-h-64 overflow-y-auto font-mono">{t.template}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
