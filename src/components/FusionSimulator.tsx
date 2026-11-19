import { scheduleCloudPush } from "../lib/storage";
import { useEffect, useState } from "preact/hooks";

interface FusionSpell {
  stage: string;
  name: string;
  seq: string;
  el: string[];
  effect: string;
}

interface Slot {
  char: string;
  skill: string;
}

const SKILL_OPTIONS = [
  "Fire", "Water", "Wind", "Earth",
  "Ice", "Elec", "Nuclear", "Almighty",
  "Light", "Dark", "Dia/Media", "Healing Melody",
  "Affectionate Prayer", "-kaja", "Heartfelt Prayer",
  "Summon Spirits", "Sonic Punch", "Ma-dyne", "Asteroid Bomb"
];

const DEFAULT_PARTY: Record<string, Slot[]> = {
  "persona2-is": [
    { char: "Tatsuya", skill: "Water" },
    { char: "Lisa", skill: "Earth" },
    { char: "Eikichi", skill: "Fire" },
    { char: "Maya", skill: "Dia/Media" },
    { char: "Yukki / Jun", skill: "Wind" }
  ],
  "persona2-ep": [
    { char: "Maya", skill: "Water" },
    { char: "Katsuya", skill: "Fire" },
    { char: "Ulala", skill: "Earth" },
    { char: "Baofu", skill: "Wind" },
    { char: "Nate / Ellen / Tatsuya", skill: "Elec" }
  ]
};

// Map common Fusion Spell names to their exact contiguous trigger token sequences
const SPELL_TOKENS: Record<string, string[][]> = {
  "Blazing Burst": [["Fire", "Fire"]],
  "Towering Inferno": [["Water", "Earth", "Fire"]],
  "Tower Inferno": [["Wind", "Earth", "Fire"]],
  "Mega Blaze": [["Fire", "Wind", "Fire"]],
  "L'oiseau de Feu": [["Fire", "Earth", "Fire"]],
  "Salamander": [["Fire", "Summon Spirits"]],
  "Heavy Rain": [["Water", "Water"]],
  "Hydro Boost": [["Fire", "Earth", "Water"]],
  "Hydro-Boost": [["Earth", "Wind", "Water"]],
  "Bane Splash": [["Water", "Earth", "Water"]],
  "Undine": [["Water", "Summon Spirits"]],
  "Dragon Flight": [["Wind", "Wind"]],
  "Wind Cutter": [["Fire", "Water", "Wind"]],
  "Maxi Tempest": [["Wind", "Fire", "Wind"]],
  "Sylph": [["Wind", "Summon Spirits"]],
  "Boulder Smash": [["Earth", "Earth"]],
  "Stone Rise": [["Water", "Fire", "Earth"]],
  "Craggy Fang": [["Earth", "Water", "Earth"]],
  "Gnome": [["Earth", "Summon Spirits"]],
  "Meltdown": [["Fire", "Earth", "Ma-dyne"], ["Fire", "Almighty", "Ma-dyne"]],
  "Giga Cyclone": [["Wind", "Water", "Ma-dyne"], ["Wind", "Almighty", "Ma-dyne"]],
  "Ice Blast / Ice Crush": [["Water", "Wind", "Ice"], ["Water", "Earth", "Ice"]],
  "Ice Blast / Jihad": [["Ice", "Ice"]],
  "Thunder Blast / Crush": [["Fire", "Wind", "Elec"], ["Fire", "Earth", "Elec"]],
  "Lightning Blast / Jihad": [["Elec", "Elec"]],
  "Nuclear Blast / Jihad": [["Nuclear", "Nuclear"]],
  "Meteor Crush": [["Fire", "Earth", "Asteroid Bomb"]],
  "Kagutsuchi": [["Nuclear", "Summon Spirits"]],
  "Hachiman": [["Almighty", "Summon Spirits"]],
  "Death's Roulette": [["Light", "Dark"]],
  "Diamai / Mediamai": [["Dia/Media", "Healing Melody"]],
  "Mediamai": [["Dia/Media", "Affectionate Prayer"]],
  "Party Buffs (-kaja)": [["-kaja", "Heartfelt Prayer"]],
  "Party Buffs (Maha -kaja)": [["-kaja", "Affectionate Prayer"]],
  "Pegasus Strike": [["Wind", "Sonic Punch"]]
};

function matchesSequence(partySkills: string[], pattern: string[]): boolean {
  for (let i = 0; i <= partySkills.length - pattern.length; i++) {
    let ok = true;
    for (let j = 0; j < pattern.length; j++) {
      if (partySkills[i + j] !== pattern[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

export default function FusionSimulator({ gameId, fusions }: { gameId: string; fusions: FusionSpell[] }) {
  const storageKey = `fm_party_${gameId}`;
  const [party, setParty] = useState<Slot[]>(() => DEFAULT_PARTY[gameId] || DEFAULT_PARTY["persona2-is"]);
  const [stageFilter, setStageFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 5) setParty(parsed);
      }
    } catch {}
  }, [gameId]);

  const updateParty = (next: Slot[]) => {
    setParty(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); scheduleCloudPush(); } catch {}
  };

  const setSkill = (idx: number, skill: string) => {
    const next = party.map((s, i) => i === idx ? { ...s, skill } : s);
    updateParty(next);
  };

  const move = (idx: number, delta: number) => {
    const j = idx + delta;
    if (j < 0 || j >= party.length) return;
    const next = [...party];
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    updateParty(next);
  };

  const partySkills = party.map(p => p.skill);
  const activeMatches = fusions.filter(f => {
    const pats = SPELL_TOKENS[f.name];
    return pats ? pats.some(pat => matchesSequence(partySkills, pat)) : false;
  });

  const stages = ["ALL", ...new Set(fusions.map(f => f.stage))];
  const visible = fusions.filter(f => {
    if (stageFilter !== "ALL" && f.stage !== stageFilter) return false;
    if (query.trim()) {
      const hay = `${f.name} ${f.seq} ${f.effect} ${f.stage}`.toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div class="panel" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <strong class="fh" style="font-size:17px;">5-Turn Party Loadout &amp; Order Simulator</strong>
          <button type="button" class="btn" onClick={() => updateParty(DEFAULT_PARTY[gameId] || DEFAULT_PARTY["persona2-is"])}>Reset Default</button>
        </div>
        <div style="display:grid;gap:8px;">
          {party.map((slot, i) => (
            <div key={slot.char} style="display:grid;grid-template-columns:28px minmax(120px,160px) 1fr auto;gap:8px;align-items:center;">
              <span class="fm" style="font-size:12px;color:var(--muted);">#{i + 1}</span>
              <strong style="font-size:13px;">{slot.char}</strong>
              <select
                value={slot.skill}
                onChange={e => setSkill(i, (e.target as HTMLSelectElement).value)}
                style="background:var(--bg);border:1px solid var(--line);color:var(--text);padding:6px 8px;border-radius:var(--r);font-size:13px;"
              >
                {SKILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div style="display:flex;gap:4px;">
                <button type="button" class="btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">&uarr;</button>
                <button type="button" class="btn" disabled={i === party.length - 1} onClick={() => move(i, 1)} aria-label="Move down">&darr;</button>
              </div>
            </div>
          ))}
        </div>

        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line);">
          <div class="fm" style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:6px;">
            Triggered Fusion Spells ({activeMatches.length})
          </div>
          {activeMatches.length ? (
            <div style="display:grid;gap:6px;">
              {activeMatches.map(m => (
                <div key={m.name} style="padding:8px 10px;background:var(--raised);border-left:3px solid var(--done);border-radius:var(--r);font-size:13px;">
                  <strong>{m.name}</strong> <span class="fm" style="font-size:11px;color:var(--done);">({m.seq})</span> — <span style="color:var(--muted);">{m.effect}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style="font-size:13px;color:var(--muted);">No contiguous Fusion Spell matched yet — try adjusting skills or turn order above.</div>
          )}
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
        <input
          type="text"
          value={query}
          onInput={e => setQuery((e.target as HTMLInputElement).value)}
          placeholder="Filter fusion spells by name, sequence, or effect..."
          style="flex:1;min-width:200px;background:var(--surface);border:1px solid var(--line);color:var(--text);padding:7px 10px;border-radius:var(--r);font-size:13px;"
        />
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          {stages.map(st => (
            <button key={st} type="button" class={stageFilter === st ? "btn btn-accent" : "btn"} onClick={() => setStageFilter(st)}>{st}</button>
          ))}
        </div>
      </div>

      <table class="dt">
        <thead><tr><th>Category</th><th>Spell</th><th>Sequence</th><th>Elements</th><th>Effect</th></tr></thead>
        <tbody>
          {visible.map(f => (
            <tr key={f.name}>
              <td>{f.stage}</td>
              <td><strong>{f.name}</strong></td>
              <td class="fm" style="font-size:12px;">{f.seq}</td>
              <td>{f.el.map(e => <span key={e} class={`el el-${e}`} style="margin-right:3px;">{e}</span>)}</td>
              <td>{f.effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
