import { scheduleCloudPush } from "../lib/storage";
import { useEffect, useState } from "preact/hooks";

interface Persona {
  name: string;
  arcana: string;
  lv: number;
  role: string;
  note: string;
}

interface WatchItem {
  id: string;
  from: string;
  to: string;
  why: string;
}

const MUTATION_WATCHLIST: Record<string, WatchItem[]> = {
  "persona2-is": [
    { id: "mut-pixie", from: "Pixie (Lovers Lv.2)", to: "Budai (Wand Lv.10)", why: "Earliest Estoma at Rank 8 via Fusion Spell mutation." },
    { id: "mut-hermes", from: "Hermes (Fortune)", to: "Chronos", why: "Equip Hermes at Aquarius Temple boss, then mutate at Rank 8." },
    { id: "mut-michael", from: "Michael (Judgement)", to: "Lucifer (Devil Lv.99)", why: "Alternative unlock for Lucifer without Morning Star card." },
    { id: "mut-starters", from: "Starter Personas (Rank 8)", to: "Return for Incense", why: "Returning maxed starter Personas yields permanent stat Incense." }
  ],
  "persona2-ep": [
    { id: "ep-mut-maia", from: "Maia (Moon)", to: "Maia Custom (Lv.31)", why: "Keep Maia & pick 'Shut up! You're wrong about her!' in GOLD." },
    { id: "ep-mut-lakshmi", from: "Lakshmi (Rank 8)", to: "Avatarah (Vishnu Card)", why: "Mystic Change Lakshmi to unlock Emperor Vishnu (Lv.86)." },
    { id: "ep-mut-skanda", from: "Skanda (Rank 8)", to: "Maximum Tempest (Siva Card)", why: "Mystic Change Skanda to unlock Chariot Siva (Lv.85)." },
    { id: "ep-mut-kuroda", from: "Junnosuke Kuroda (Rank 8)", to: "Carma Ring (Return)", why: "Return maxed Kuroda for Carma Ring (needed for Alice's Champion card)." },
    { id: "ep-mut-lucifer", from: "Lucifer (Rank 8)", to: "Gun of Might (255 ATK)", why: "Return maxed Lucifer for the strongest gun in the game." },
    { id: "ep-mut-tobi", from: "Tobi Katou / Tsukuyomi / Grinbulsti", to: "Book of Fuuma / Moon of Ur / Noatun", why: "Mystic Changes for Fuuma Kotarou, Nanna, and Njord Material Cards." }
  ]
};

interface TrackerState {
  freeCards: number;
  stats: Record<string, number>;
  summoned: Record<string, boolean>;
  maxed: Record<string, boolean>;
  watch: Record<string, boolean>;
}

const DEFAULT_TRACKER: TrackerState = { freeCards: 0, stats: { Dx: 10, Vt: 8, Ag: 8, Ma: 7, Lu: 6, St: 7 }, summoned: {}, maxed: {}, watch: {} };

export default function PersonaTracker({ gameId, personas }: { gameId: string; personas: Persona[] }) {
  const storageKey = `fm_personas_${gameId}`;
  const [st, setSt] = useState<TrackerState>(DEFAULT_TRACKER);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw);
        setSt({ ...DEFAULT_TRACKER, ...p, stats: p.stats || DEFAULT_TRACKER.stats, summoned: p.summoned || {}, maxed: p.maxed || {}, watch: p.watch || {} });
      }
    } catch {}
  }, [gameId]);

  const save = (next: TrackerState) => {
    setSt(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); scheduleCloudPush(); } catch {}
  };

  const adjCards = (delta: number) => save({ ...st, freeCards: Math.max(0, st.freeCards + delta) });
  const adjStat = (k: string, d: number) => save({ ...st, stats: { ...st.stats, [k]: Math.max(1, Math.min(99, (st.stats[k] || 1) + d)) } });
  const toggleMap = (field: "summoned" | "maxed" | "watch", key: string) =>
    save({ ...st, [field]: { ...st[field], [key]: !st[field][key] } });

  const watchlist = MUTATION_WATCHLIST[gameId] || [];
  const roles = ["ALL", ...new Set(personas.map(p => p.role))];
  const visible = personas.filter(p => {
    if (role !== "ALL" && p.role !== role) return false;
    if (q.trim()) {
      const hay = `${p.name} ${p.arcana} ${p.role} ${p.note}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>

      <div class="panel" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
          <strong class="fh" style="font-size:15px;">{gameId === "persona2-is" ? "Tatsuya Stat Targets (Stop Dx at 60–80)" : "Maya Stat Targets (Focus Ma / Ag / Vi)"}</strong>
          <span class="fm" style="font-size:11px;color:var(--muted);">Auto-saved &amp; synced</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;">
          {Object.entries(st.stats).map(([k, v]) => (
            <div key={k} style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r);">
              <span class="fm" style="font-size:12px;"><strong>{k}</strong>: {v}</span>
              <div style="display:flex;gap:3px;">
                <button type="button" class="btn" style="padding:2px 6px;" onClick={() => adjStat(k, -1)}>-</button>
                <button type="button" class="btn" style="padding:2px 6px;" onClick={() => adjStat(k, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div class="grid-2" style="margin-bottom:16px;">
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <div>
              <div class="fm" style="font-size:11px;color:var(--muted);text-transform:uppercase;">Velvet Room Free Tarot Cards</div>
              <div class="fm" style="font-size:28px;font-weight:700;color:var(--accent);">{st.freeCards}</div>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              {[-10, -1, 1, 10, 50].map(d => (
                <button key={d} type="button" class="btn" onClick={() => adjCards(d)}>{d > 0 ? `+${d}` : d}</button>
              ))}
            </div>
          </div>
          <p style="margin:8px 0 0;font-size:12px;color:var(--muted);">
            Summoned: <strong class="fm">{personas.filter(p => st.summoned[p.name]).length}/{personas.length}</strong> •
            Rank 8 / Returned: <strong class="fm">{personas.filter(p => st.maxed[p.name]).length}/{personas.length}</strong>
          </p>
        </div>

        <div class="panel">
          <strong class="fh" style="font-size:15px;">Mutation &amp; Rank 8 Return Watchlist</strong>
          <div style="display:grid;gap:6px;margin-top:8px;">
            {watchlist.map(w => (
              <label key={w.id} style="display:flex;align-items:flex-start;gap:8px;font-size:12px;cursor:pointer;">
                <input type="checkbox" checked={Boolean(st.watch[w.id])} onChange={() => toggleMap("watch", w.id)} style="margin-top:2px;" />
                <span style={st.watch[w.id] ? "text-decoration:line-through;color:var(--muted);" : ""}>
                  <strong>{w.from} &rarr; {w.to}</strong>: <span style="color:var(--muted);">{w.why}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <input
          type="text"
          value={q}
          onInput={e => setQ((e.target as HTMLInputElement).value)}
          placeholder="Filter personas by name, Arcana, skill, or card..."
          style="flex:1;min-width:200px;background:var(--surface);border:1px solid var(--line);color:var(--text);padding:7px 10px;border-radius:var(--r);font-size:13px;"
        />
        <select value={role} onChange={e => setRole((e.target as HTMLSelectElement).value)} style="background:var(--surface);border:1px solid var(--line);color:var(--text);padding:7px;border-radius:var(--r);font-size:13px;">
          {roles.map(r => <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>)}
        </select>
      </div>

      <table class="dt">
        <thead><tr><th>Fused</th><th>Rank 8</th><th>Persona</th><th>Arcana</th><th>Lv</th><th>Role</th><th>Notes</th></tr></thead>
        <tbody>
          {visible.map(p => (
            <tr key={p.name}>
              <td><input type="checkbox" checked={Boolean(st.summoned[p.name])} onChange={() => toggleMap("summoned", p.name)} /></td>
              <td><input type="checkbox" checked={Boolean(st.maxed[p.name])} onChange={() => toggleMap("maxed", p.name)} /></td>
              <td><strong>{p.name}</strong></td>
              <td>{p.arcana}</td>
              <td class="fm">{p.lv}</td>
              <td>{p.role}</td>
              <td>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
