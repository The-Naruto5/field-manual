export const STORAGE_KEY = "field_manual_v2";

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

export function saveManualState(s: ManualState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}
