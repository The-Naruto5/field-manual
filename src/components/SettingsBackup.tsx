import { useEffect, useState } from "preact/hooks";
import {
  SYNC_AUTH_KEY,
  collectFullBackup,
  getSavedSyncAuth,
  loadManualState,
  restoreFullBackup,
  saveManualState,
  type ManualState
} from "../lib/storage";

export default function SettingsBackup() {
  const [st, setSt] = useState<ManualState>(loadManualState);
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signedInUser, setSignedInUser] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const auth = getSavedSyncAuth();
    if (auth) {
      setSignedInUser(auth.username);
      setUsername(auth.username);
      setPassword(auth.password);
    }
  }, []);

  const update = (patch: Partial<ManualState>) => {
    const next = { ...st, ...patch };
    setSt(next);
    saveManualState(next);
    if (patch.theme) {
      if (patch.theme === "auto") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", patch.theme);
    }
  };

  const callSync = async (action: "register" | "login" | "push") => {
    setBusy(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          username: username.trim(),
          password,
          payload: action === "login" ? undefined : collectFullBackup()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSyncMsg(data.error || "Sync failed.");
        return;
      }
      localStorage.setItem(SYNC_AUTH_KEY, JSON.stringify({ username: username.trim().toLowerCase(), password }));
      setSignedInUser(username.trim().toLowerCase());

      if (action === "login" && data.payload) {
        const restored = restoreFullBackup(data.payload);
        setSt(restored);
        setSyncMsg("Signed in and synced progress from cloud!");
      } else if (action === "register") {
        setSyncMsg("Account created and current progress uploaded! Auto-sync is now ON.");
      } else {
        setSyncMsg("Progress pushed to cloud.");
      }
    } catch {
      setSyncMsg("Network error contacting /api/sync.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(SYNC_AUTH_KEY);
    setSignedInUser(null);
    setPassword("");
    setSyncMsg("Signed out (local progress kept on this device).");
  };

  const downloadJson = () => {
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(collectFullBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field-manual-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg(`Downloaded unified backup field-manual-backup-${today}.json`);
  };

  const onFile = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const restored = restoreFullBackup(parsed);
        setSt(restored);
        setMsg("Unified backup restored.");
      } catch {
        setMsg("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style="display:grid;gap:14px;">
      <div class="panel" style="border-left:3px solid var(--accent);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <strong class="fh" style="font-size:17px;">Cloud Sync (Username &amp; Password)</strong>
          {signedInUser && <span class="fm" style="font-size:11px;color:var(--done);">Auto-Sync ON: {signedInUser}</span>}
        </div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 10px;">
          Sync checks, Pacts, Fusion loadouts, and Persona trackers automatically between your phone and PC.
        </p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <input
            type="text"
            value={username}
            onInput={e => setUsername((e.target as HTMLInputElement).value)}
            placeholder="Username (3–24 chars)"
            autocomplete="username"
            style="flex:1;min-width:160px;background:var(--bg);border:1px solid var(--line);color:var(--text);padding:7px 10px;border-radius:var(--r);"
          />
          <input
            type="password"
            value={password}
            onInput={e => setPassword((e.target as HTMLInputElement).value)}
            placeholder="Password (min 6 chars)"
            autocomplete="current-password"
            style="flex:1;min-width:160px;background:var(--bg);border:1px solid var(--line);color:var(--text);padding:7px 10px;border-radius:var(--r);"
          />
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-accent" disabled={busy} onClick={() => callSync("login")}>Sign In &amp; Pull</button>
          <button type="button" class="btn" disabled={busy} onClick={() => callSync("register")}>Create Account</button>
          {signedInUser && <button type="button" class="btn" disabled={busy} onClick={() => callSync("push")}>Push Now</button>}
          {signedInUser && <button type="button" class="btn" disabled={busy} onClick={signOut}>Sign Out</button>}
        </div>
        {syncMsg && <p class="fm" style="font-size:12px;color:var(--tip);margin:8px 0 0;">{syncMsg}</p>}
      </div>

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
          <strong class="fh">Offline JSON Backup</strong>
          <p class="fm" style="font-size:11px;color:var(--muted);">Daily Snapshot: {st.dailySnapshot?.date || "None"}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn btn-accent" onClick={downloadJson}>Download .json</button>
            <label class="btn" style="cursor:pointer;">Import .json<input type="file" accept=".json" onChange={onFile} style="display:none;" /></label>
            <button type="button" class="btn" onClick={() => window.print()}>Print / PDF</button>
          </div>
          {msg && <p class="fm" style="font-size:11px;color:var(--done);margin-top:8px;">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
