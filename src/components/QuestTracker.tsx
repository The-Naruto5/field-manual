import { useState } from "preact/hooks";
import { loadManualState, saveManualState, type ManualState } from "../lib/storage";

interface SideQuest { id: string; type: string; name: string; window: string; reward: string; missable: boolean; }
interface Weapon { id: string; char: string; weapon: string; req: string; }
interface MaterialCard { id: string; card: string; persona: string; arcana: string; lv: number; how: string; route?: "all" | "nate" | "ellen"; }

export default function QuestTracker({ gameId, sideQuests, ultimateWeapons, materialCards = [] }: { gameId: string; sideQuests: SideQuest[]; ultimateWeapons: Weapon[]; materialCards?: MaterialCard[]; }) {
  const [st, setSt] = useState<ManualState>(loadManualState);
  const keyFor = (id: string) => `${gameId}:${id}`;
  const isDone = (id: string) => Boolean(st.checked[keyFor(id)]);
  const toggle = (id: string) => {
    const k = keyFor(id);
    const next = { ...st, checked: { ...st.checked, [k]: !st.checked[k] } };
    setSt(next); saveManualState(next);
  };

  const filteredCards = materialCards.filter(mc => {
    if (gameId !== "persona2-ep" || st.epRoute === "all" || !mc.route || mc.route === "all") return true;
    return mc.route === st.epRoute;
  });

  return (
    <div>
      <h2 class="fh" style="margin-top:0;">Side Quests &amp; Rumors</h2>
      <table class="dt" style="margin-bottom:20px;">
        <thead><tr><th>Done</th><th>Quest</th><th>Window</th><th>Reward</th></tr></thead>
        <tbody>
          {sideQuests.map(q => (
            <tr key={q.id}>
              <td><input type="checkbox" checked={isDone(q.id)} onChange={() => toggle(q.id)} /></td>
              <td><strong>{q.name}</strong></td>
              <td>{q.window}</td>
              <td>{q.reward}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 class="fh">Ultimate Weapons</h2>
      <table class="dt" style="margin-bottom:20px;">
        <thead><tr><th>Done</th><th>Character</th><th>Weapon</th><th>Unlock</th></tr></thead>
        <tbody>
          {ultimateWeapons.map(w => (
            <tr key={w.id}>
              <td><input type="checkbox" checked={isDone(w.id)} onChange={() => toggle(w.id)} /></td>
              <td><strong>{w.char.replace(/\[spoiler\]|\[\/spoiler\]/g, "")}</strong></td>
              <td>{w.weapon}</td>
              <td>{w.req}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {materialCards.length > 0 && (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <h2 class="fh" style="margin:0;">Material Cards ({filteredCards.filter(c => isDone(c.id)).length}/{filteredCards.length})</h2>
            <div style="display:flex;gap:6px;">
              {(["all", "nate", "ellen"] as const).map(r => (
                <button key={r} type="button" class={st.epRoute === r ? "btn btn-accent" : "btn"} onClick={() => {
                  const next = { ...st, epRoute: r }; setSt(next); saveManualState(next);
                }}>{r === "all" ? "All" : r === "nate" ? "Nate" : "Ellen"}</button>
              ))}
            </div>
          </div>
          <table class="dt">
            <thead><tr><th>Done</th><th>Card</th><th>Persona</th><th>Arcana</th><th>Lv</th><th>How to Obtain</th></tr></thead>
            <tbody>
              {filteredCards.map(mc => (
                <tr key={mc.id}>
                  <td><input type="checkbox" checked={isDone(mc.id)} onChange={() => toggle(mc.id)} /></td>
                  <td><strong>{mc.card}</strong></td>
                  <td>{mc.persona}</td>
                  <td>{mc.arcana}</td>
                  <td class="fm">{mc.lv}</td>
                  <td>{mc.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
