export const STORAGE_KEY = "field_manual_v2";
export const SYNC_AUTH_KEY = "fm_sync_auth";

export interface ManualState {
  theme: "auto" | "dark" | "light";
  revealSpoilers: boolean;
  activePath: "full" | "story" | "beginner" | "grind";
  epRoute: "all" | "nate" | "ellen";
  checked: Record<string, boolean>;
  undoStack: Array<{ key: string; prev: boolean }>;
  activePacts: string[];
  notes: Record<string, string>;
  dailySnapshot: { date: string; checked: Record<string, boolean> } | null;
}

export interface FullBackupPayload {
  version: 2;
  updatedAt: number;
  state: ManualState;
  extra: Record<string, string>;
}

export const defaultState: ManualState = {
  theme: "auto",
  revealSpoilers: false,
  activePath: "beginner",
  epRoute: "all",
  checked: {},
  undoStack: [],
  activePacts: [],
  notes: {},
  dailySnapshot: null
};

export function loadManualState(): ManualState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const merged: ManualState = {
      ...defaultState,
      ...parsed,
      checked: parsed.checked || {},
      undoStack: Array.isArray(parsed.undoStack) ? parsed.undoStack : [],
      activePacts: Array.isArray(parsed.activePacts) ? parsed.activePacts.slice(0, 3) : [],
      notes: parsed.notes || {}
    };
    const today = new Date().toISOString().slice(0, 10);
    if (!merged.dailySnapshot || merged.dailySnapshot.date !== today) {
      merged.dailySnapshot = { date: today, checked: { ...merged.checked } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return { ...defaultState };
  }
}

export function collectFullBackup(): FullBackupPayload {
  const extra: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("fm_party_") || k.startsWith("fm_personas_"))) {
        const v = localStorage.getItem(k);
        if (v !== null) extra[k] = v;
      }
    }
  } catch {}
  return { version: 2, updatedAt: Date.now(), state: loadManualState(), extra };
}

export function restoreFullBackup(input: unknown): ManualState {
  const obj = (input && typeof input === "object") ? (input as Record<string, unknown>) : {};
  const incomingState = (obj.version === 2 && obj.state && typeof obj.state === "object")
    ? (obj.state as Partial<ManualState>)
    : (obj as Partial<ManualState>);

  const merged: ManualState = {
    ...defaultState,
    ...loadManualState(),
    ...incomingState,
    checked: incomingState.checked || {},
    activePacts: Array.isArray(incomingState.activePacts) ? incomingState.activePacts.slice(0, 3) : [],
    notes: incomingState.notes || {}
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    if (obj.version === 2 && obj.extra && typeof obj.extra === "object") {
      Object.entries(obj.extra as Record<string, string>).forEach(([k, v]) => {
        if ((k.startsWith("fm_party_") || k.startsWith("fm_personas_")) && typeof v === "string") {
          localStorage.setItem(k, v);
        }
      });
    }
  } catch {}
  return merged;
}

export function getSavedSyncAuth(): { username: string; password: string } | null {
  try {
    const raw = localStorage.getItem(SYNC_AUTH_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.username && p?.password ? p : null;
  } catch {
    return null;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleCloudPush(): void {
  const auth = getSavedSyncAuth();
  if (!auth) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "push", username: auth.username, password: auth.password, payload: collectFullBackup() })
    }).catch(() => {});
  }, 1500);
}

export function saveManualState(s: ManualState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    scheduleCloudPush();
  } catch {}
}
