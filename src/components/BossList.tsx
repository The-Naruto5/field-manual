import { useState } from "preact/hooks";
import { loadManualState, saveManualState, type ManualState } from "../lib/storage";

interface Boss { ch: string; name: string; loc: string; lv: string; hp?: string; weak: string[]; tactic: string; }

export default function BossList({ gameId, bosses }: { gameId: string; bosses: Boss[] }) {
  const [st, setSt] = useState<ManualState>(loadManualState);
  const isEP = gameId === "persona2-ep";

  const setRoute = (r: "all" | "nate" | "ellen") => {
    const next = { ...st, epRoute: r };
    setSt(next);
    saveManualState(next);
  };

  const visible = bosses.filter(b => {
    if (!isEP || st.epRoute === "all") return true;
    const low = b.ch.toLowerCase();
    if (st.epRoute === "nate" && low.includes("ellen")) return false;
    if (st.epRoute === "ellen" && low.includes("nate")) return false;
    return true;
  });

  return (
    <div>
      {isEP && (
        <div class="panel" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span class="fm" style="font-size:11px;color:var(--muted);">ROUTE FILTER:</span>
          {(["all", "nate", "ellen"] as const).map(r => (
            <button key={r} type="button" class={st.epRoute === r ? "btn btn-accent" : "btn"} onClick={() => setRoute(r)}>
              {r === "all" ? "All Routes" : r === "nate" ? "Nate Nanjo" : "Ellen Kirishima"}
            </button>
          ))}
        </div>
      )}
      <div style="display:grid;gap:10px;">
        {visible.map(b => (
          <div key={`${b.ch}-${b.name}`} class="panel">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
              <strong>{b.name.replace(/\[spoiler\]|\[\/spoiler\]/g, "")} <span class="fm" style="font-size:12px;color:var(--muted);">({b.ch} • {b.loc})</span></strong>
              <div style="display:flex;gap:6px;align-items:center;">
                <span class="fm" style="font-size:12px;color:var(--muted);">Lv. {b.lv}{b.hp && b.hp !== "—" ? ` • ${b.hp} HP` : ""}</span>
                {b.weak.map(w => <span key={w} class={`el el-${w}`}>{w}</span>)}
              </div>
            </div>
            <p style="margin:6px 0 0;font-size:13px;color:var(--muted);">{b.tactic}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
