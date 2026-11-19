import { useState } from "preact/hooks";
import { loadManualState, saveManualState, type ManualState } from "../lib/storage";

export default function SettingsBackup() {
  const [st, setSt] = useState<ManualState>(loadManualState);
  const [msg, setMsg] = useState("");

  const update = (patch: Partial<ManualState>) => {
    const next = { ...st, ...patch };
    setSt(next);
    saveManualState(next);
    if (patch.theme) {
      if (patch.theme === "auto") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", patch.theme);
    }
  };

  const downloadJson = () => {
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(st, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field-manual-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg(`Downloaded field-manual-backup-${today}.json`);
  };

  const onFile = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        update({ checked: parsed.checked || {}, activePacts: parsed.activePacts || [], notes: parsed.notes || {}, theme: parsed.theme || "auto" });
        setMsg("Backup restored.");
      } catch {
        setMsg("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div class="grid-2">
      <div class="panel">
        <strong class="fh">Display &amp; Spoilers</strong>
        <div style="display:flex;gap:8px;margin-top:10px;">
          {(["auto", "dark", "light"] as const).map(t => (
            <button key={t} type="button" class={st.theme === t ? "btn btn-accent" : "btn"} onClick={() => update({ theme: t })}>{t}</button>
          ))}
        </div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:13px;">
          <input type="checkbox" checked={st.revealSpoilers} onChange={e => update({ revealSpoilers: (e.target as HTMLInputElement).checked })} />
          Reveal all story spoilers
        </label>
      </div>

      <div class="panel">
        <strong class="fh">Progress Backup</strong>
        <p class="fm" style="font-size:11px;color:var(--muted);">Daily Snapshot: {st.dailySnapshot?.date || "None"}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-accent" onClick={downloadJson}>Download .json</button>
          <label class="btn" style="cursor:pointer;">Import .json<input type="file" accept=".json" onChange={onFile} style="display:none;" /></label>
          <button type="button" class="btn" onClick={() => window.print()}>Print / PDF</button>
        </div>
        {msg && <p class="fm" style="font-size:11px;color:var(--done);margin-top:8px;">{msg}</p>}
      </div>
    </div>
  );
}
