import { useEffect, useState } from "preact/hooks";
import { loadManualState, saveManualState, type ManualState } from "../lib/storage";

interface Step {
  id: string;
  area: string;
  tags: string[];
  text: string;
  detail?: string;
  warn?: string;
  variants?: { beginner?: string };
  grind?: { min_level: number; why: string; where?: string; how?: string };
  gate?: { title: string; items: Array<{ id: string; label: string }> };
}

interface Props {
  gameId: string;
  pathId: string;
  chapterId: string;
  prevUrl?: string;
  nextUrl?: string;
  glossary: Record<string, string>;
  steps: Step[];
}

function splitDetailLines(raw: string): { intro?: string; items: Array<{ num: string; text: string }> } {
  const str = raw.trim();
  if (/(?:^|\s)1\)\s/.test(str) && /\s2\)\s/.test(str)) {
    const idx = str.search(/(?:^|\s)1\)\s/);
    const intro = idx > 0 ? str.slice(0, idx).trim() : undefined;
    const parts = str.slice(idx).trim().split(/\s+(?=\d+\)\s)/);
    return {
      intro,
      items: parts.map(p => {
        const m = p.match(/^(\d+\))\s+([\s\S]*)$/);
        return m ? { num: m[1], text: m[2] } : { num: "•", text: p };
      })
    };
  }
  const sentences = str.split(/(?<=[.!?])\s+(?=[A-Z\[0-9])/).filter(Boolean);
  return { items: sentences.map(s => ({ num: "•", text: s })) };
}

export default function StepChecklist({ gameId, pathId, chapterId, prevUrl, nextUrl, glossary, steps }: Props) {
  const [st, setSt] = useState<ManualState>(loadManualState);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [glossTerm, setGlossTerm] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number>(-1);

  useEffect(() => {
    const loaded = loadManualState();
    loaded.activePath = pathId as ManualState["activePath"];
    if (pathId === "beginner") loaded.revealSpoilers = false;
    setSt(loaded);

    const onSynced = () => setSt(loadManualState());
    window.addEventListener("fm:synced", onSynced);
    return () => window.removeEventListener("fm:synced", onSynced);
  }, [pathId]);

  const keyFor = (id: string) => `${gameId}:${id}`;
  const isDone = (id: string) => Boolean(st.checked[keyFor(id)]);

  const toggle = (id: string) => {
    const k = keyFor(id);
    const prev = Boolean(st.checked[k]);
    const next: ManualState = {
      ...st,
      checked: { ...st.checked, [k]: !prev },
      undoStack: [...st.undoStack.slice(-9), { key: k, prev }]
    };
    setSt(next);
    saveManualState(next);
  };

  const setNote = (id: string, val: string) => {
    const k = keyFor(id);
    const next: ManualState = { ...st, notes: { ...st.notes, [k]: val } };
    setSt(next);
    saveManualState(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = ((document.activeElement as HTMLElement | null)?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setFocusIdx(prev => {
          const next = Math.min(steps.length - 1, prev + 1);
          document.getElementById(`step-${steps[next]?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setFocusIdx(prev => {
          const next = Math.max(0, prev <= 0 ? 0 : prev - 1);
          document.getElementById(`step-${steps[next]?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      } else if (e.key === " " && focusIdx >= 0 && focusIdx < steps.length) {
        e.preventDefault();
        toggle(steps[focusIdx].id);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusIdx, steps, st]);

  const markAbove = (idx: number) => {
    const checked = { ...st.checked };
    for (let i = 0; i <= idx; i++) checked[keyFor(steps[i].id)] = true;
    const next = { ...st, checked };
    setSt(next);
    saveManualState(next);
  };

  const resetChapter = () => {
    if (!window.confirm(`Reset all checks in ${chapterId}?`)) return;
    const checked = { ...st.checked };
    steps.forEach(s => {
      checked[keyFor(s.id)] = false;
      s.gate?.items.forEach(gi => { checked[keyFor(gi.id)] = false; });
    });
    const next = { ...st, checked };
    setSt(next);
    saveManualState(next);
  };

  const undo = () => {
    if (!st.undoStack.length) return;
    const stack = [...st.undoStack];
    const last = stack.pop()!;
    const next = { ...st, checked: { ...st.checked, [last.key]: last.prev }, undoStack: stack };
    setSt(next);
    saveManualState(next);
  };

  const jumpNextUnchecked = () => {
    const idx = steps.findIndex(s => !isDone(s.id));
    if (idx >= 0) {
      setFocusIdx(idx);
      document.getElementById(`step-${steps[idx].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const renderInline = (raw: string, sid: string) => {
    const parts = raw.split(/(\[spoiler\][\s\S]*?\[\/spoiler\])/g);
    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    return parts.map((part, idx) => {
      const m = part.match(/^\[spoiler\]([\s\S]*)\[\/spoiler\]$/);
      if (m) {
        const spKey = `${sid}-${idx}`;
        const shown = st.revealSpoilers || revealedSpoilers[spKey];
        return (
          <span
            key={spKey}
            class={shown ? "spoiler revealed" : "spoiler"}
            title="Click to reveal spoiler"
            onClick={() => setRevealedSpoilers(p => ({ ...p, [spKey]: !p[spKey] }))}
          >
            {m[1]}
          </span>
        );
      }
      if (!terms.length) return part;
      const re = new RegExp(`\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "g");
      const sub = part.split(re);
      return sub.map((chunk, ci) =>
        glossary[chunk] ? (
          <span key={`${idx}-${ci}`} class="gloss-term" onClick={() => setGlossTerm(chunk)}>{chunk}</span>
        ) : chunk
      );
    });
  };

  const doneCount = steps.filter(s => isDone(s.id)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div class={st.revealSpoilers ? "reveal-all" : ""}>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
        <span class="fm" style="font-size:12px;color:var(--muted);">Chapter Progress: {doneCount}/{steps.length} ({pct}%)</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button type="button" class="btn" onClick={jumpNextUnchecked}>Next Unchecked</button>
          <button type="button" class="btn" onClick={undo} disabled={!st.undoStack.length}>Undo</button>
          <button type="button" class={st.revealSpoilers ? "btn btn-accent" : "btn"} onClick={() => {
            const next = { ...st, revealSpoilers: !st.revealSpoilers };
            setSt(next); saveManualState(next);
          }}>{st.revealSpoilers ? "Spoilers: Shown" : "Spoilers: Hidden"}</button>
          <button type="button" class="btn" onClick={resetChapter}>Reset Chapter</button>
        </div>
      </div>

      {glossTerm && glossary[glossTerm] && (
        <div class="panel" style="margin-bottom:12px;border-left:3px solid var(--tip);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
          <div>
            <strong class="fh" style="color:var(--tip);">{glossTerm}</strong>
            <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">{glossary[glossTerm]}</p>
          </div>
          <button type="button" class="btn" onClick={() => setGlossTerm(null)}>Close</button>
        </div>
      )}

      <div style="display:grid;gap:10px;">
        {steps.map((s, idx) => {
          const done = isDone(s.id);
          const noteVal = st.notes[keyFor(s.id)] || "";
          const hasNote = noteVal.trim().length > 0;
          const body = pathId === "beginner" && s.variants?.beginner ? s.variants.beginner : s.text;
          const parsed = s.detail ? splitDetailLines(s.detail) : null;
          return (
            <div
              key={s.id}
              id={`step-${s.id}`}
              class={`panel ${focusIdx === idx ? "step-focused" : ""}`}
              style={done ? "opacity:0.65;border-left:3px solid var(--done);" : ""}
              onClick={() => setFocusIdx(idx)}
            >
              <div style="display:flex;gap:10px;align-items:flex-start;">
                <input type="checkbox" checked={done} onChange={() => toggle(s.id)} style="margin-top:4px;cursor:pointer;" />
                <div style="flex:1;">
                  <div style="font-size:15px;font-weight:500;">{renderInline(body, s.id)}</div>
                  {s.warn && <div style="margin-top:4px;font-size:12px;color:var(--warn);">Warning: {s.warn}</div>}
                  {s.grind && (
                    <div style="margin-top:6px;padding:8px 10px;background:var(--raised);border-left:3px solid var(--tip);font-size:12px;">
                      <div><strong>Grind Min Lv. {s.grind.min_level}:</strong> {s.grind.why}</div>
                      {s.grind.where && <div style="margin-top:3px;"><strong>Where:</strong> {s.grind.where}</div>}
                      {s.grind.how && <div style="margin-top:3px;"><strong>How:</strong> {s.grind.how}</div>}
                    </div>
                  )}
                  {s.gate && (
                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg);border:1px solid var(--line);border-left:3px solid var(--done);border-radius:var(--r);">
                      <div class="fh" style="font-size:12px;color:var(--done);margin-bottom:4px;">{s.gate.title}</div>
                      <div style="display:grid;gap:4px;">
                        {s.gate.items.map(gi => (
                          <label key={gi.id} style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;">
                            <input type="checkbox" checked={isDone(gi.id)} onChange={() => toggle(gi.id)} />
                            <span style={isDone(gi.id) ? "text-decoration:line-through;color:var(--muted);" : ""}>{gi.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                    {s.detail && (
                      <button type="button" class="btn" onClick={() => setExpanded(p => ({ ...p, [s.id]: !p[s.id] }))}>
                        {expanded[s.id] ? "Hide Details" : "Step-by-Step Details"}
                      </button>
                    )}
                    <button
                      type="button"
                      class={hasNote ? "btn btn-accent" : "btn"}
                      onClick={() => setOpenNotes(p => ({ ...p, [s.id]: !p[s.id] }))}
                    >
                      {hasNote ? "Note ✓" : "+ Note"}
                    </button>
                    <button type="button" class="btn" onClick={() => markAbove(idx)}>Mark all above</button>
                  </div>
                  {expanded[s.id] && parsed && (
                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r);display:grid;gap:6px;font-size:13px;">
                      {parsed.intro && <div style="color:var(--muted);">{renderInline(parsed.intro, `${s.id}-intro`)}</div>}
                      {parsed.items.map((it, i) => (
                        <div key={i} style="display:grid;grid-template-columns:24px 1fr;gap:6px;align-items:baseline;">
                          <span class="fm" style="font-size:12px;font-weight:700;color:var(--tip);">{it.num}</span>
                          <span>{renderInline(it.text, `${s.id}-d${i}`)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(openNotes[s.id] || hasNote) && (
                    <div style="margin-top:8px;">
                      <textarea
                        rows={2}
                        value={noteVal}
                        onInput={e => setNote(s.id, (e.target as HTMLTextAreaElement).value)}
                        placeholder="Personal note for this step (auto-syncs to cloud)..."
                        style="width:100%;background:var(--bg);border:1px solid var(--line);color:var(--text);border-radius:var(--r);padding:6px 8px;font-family:var(--font-body);font-size:12px;"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:18px;gap:8px;">
        {prevUrl ? <a class="btn" href={prevUrl}>&larr; Previous Chapter</a> : <span />}
        {nextUrl ? <a class="btn btn-accent" href={nextUrl}>Next Chapter &rarr;</a> : <span />}
      </div>
    </div>
  );
}
