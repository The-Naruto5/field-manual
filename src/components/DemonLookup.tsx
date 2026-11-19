import { useState } from "preact/hooks";
import { loadManualState, saveManualState, type ManualState } from "../lib/storage";

interface Demon {
  name: string; lv: number; arcana: string; dungeons: string[]; weak: string[]; avoid: string[]; eager: string; happy: string; cards: string;
}

export default function DemonLookup({ demons }: { demons: Demon[] }) {
  const [st, setSt] = useState<ManualState>(loadManualState);
  const [q, setQ] = useState("");
  const [dungeon, setDungeon] = useState("ALL");
  const [arcana, setArcana] = useState("ALL");
  const [pactsOnly, setPactsOnly] = useState(false);

  const dungeons = [...new Set(demons.flatMap(d => d.dungeons))];
  const arcanas = [...new Set(demons.map(d => d.arcana))].sort();

  const togglePact = (name: string) => {
    let nextPacts = [...st.activePacts];
    if (nextPacts.includes(name)) nextPacts = nextPacts.filter(x => x !== name);
    else { if (nextPacts.length >= 3) nextPacts.shift(); nextPacts.push(name); }
    const next = { ...st, activePacts: nextPacts };
    setSt(next);
    saveManualState(next);
  };

  const filtered = demons.filter(d => {
    if (pactsOnly && !st.activePacts.includes(d.name)) return false;
    if (dungeon !== "ALL" && !d.dungeons.includes(dungeon)) return false;
    if (arcana !== "ALL" && d.arcana !== arcana) return false;
    if (q.trim()) {
      const hay = `${d.name} ${d.arcana} ${d.eager} ${d.happy} ${d.cards}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div class="panel" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span class="fm" style="font-size:11px;color:var(--muted);">ACTIVE PACTS ({st.activePacts.length}/3):</span>
        {st.activePacts.length ? st.activePacts.map(n => (
          <button key={n} type="button" class="btn" style="border-color:var(--done);color:var(--done);" onClick={() => togglePact(n)}>{n} &times;</button>
        )) : <span style="font-size:12px;color:var(--muted);">None tracked yet</span>}
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <input type="text" value={q} onInput={e => setQ((e.target as HTMLInputElement).value)} placeholder="Type demon name, contact, or card..." style="flex:1;min-width:200px;background:var(--surface);border:1px solid var(--line);color:var(--text);padding:7px 10px;border-radius:var(--r);" />
        <select value={dungeon} onChange={e => setDungeon((e.target as HTMLSelectElement).value)} style="background:var(--surface);border:1px solid var(--line);color:var(--text);padding:7px;border-radius:var(--r);">
          <option value="ALL">All Dungeons ({demons.length})</option>
          {dungeons.map(dg => <option key={dg} value={dg}>{dg}</option>)}
        </select>
        <select value={arcana} onChange={e => setArcana((e.target as HTMLSelectElement).value)} style="background:var(--surface);border:1px solid var(--line);color:var(--text);padding:7px;border-radius:var(--r);">
          <option value="ALL">All Arcanas</option>
          {arcanas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button type="button" class={pactsOnly ? "btn btn-accent" : "btn"} onClick={() => setPactsOnly(!pactsOnly)}>My Pacts Only</button>
      </div>

      <div class="fm" style="font-size:11px;color:var(--muted);margin-bottom:8px;">Showing {filtered.length} of {demons.length} demons</div>

      <div class="grid-2">
        {filtered.map(d => {
          const isPact = st.activePacts.includes(d.name);
          return (
            <div key={d.name} class="panel" style={isPact ? "border-color:var(--done);border-left:3px solid var(--done);" : ""}>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div><strong>{d.name}</strong> <span class="fm" style="font-size:11px;color:var(--muted);">Lv.{d.lv} • {d.arcana}</span></div>
                <button type="button" class={isPact ? "btn btn-accent" : "btn"} onClick={() => togglePact(d.name)}>{isPact ? "Pact ✓" : "+ Pact"}</button>
              </div>
              <div style="font-size:12px;margin-bottom:4px;">
                <span class="fm" style="color:var(--muted);margin-right:6px;">WEAK</span>
                {d.weak.length ? d.weak.map(w => <span key={w} class={`el el-${w}`} style="margin-right:4px;">{w}</span>) : <span class="el el-NONE">NONE</span>}
              </div>
              <div style="font-size:12px;margin-bottom:4px;"><span class="fm" style="color:var(--muted);margin-right:6px;">AVOID</span><span style="color:var(--warn);">{d.avoid.join(", ") || "None"}</span></div>
              <div style="font-size:12px;margin-bottom:4px;"><span class="fm" style="color:var(--muted);margin-right:6px;">EAGER</span><span style="color:var(--done);font-weight:600;">{d.eager}</span></div>
              <div style="font-size:12px;margin-bottom:6px;"><span class="fm" style="color:var(--muted);margin-right:6px;">HAPPY</span><span style="color:var(--tip);font-weight:600;">{d.happy}</span></div>
              <div class="fm" style="font-size:11px;color:var(--muted);border-top:1px solid var(--line);padding-top:5px;">{d.cards}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
