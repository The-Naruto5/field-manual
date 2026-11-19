import { useEffect, useState } from "preact/hooks";
import { loadManualState } from "../lib/storage";

interface StepRef { chId: string; stepId: string; }

export default function ResumeButton({ gameId, stepList }: { gameId: string; stepList: StepRef[] }) {
  const [target, setTarget] = useState<{ url: string; label: string; pct: number } | null>(null);

  useEffect(() => {
    const st = loadManualState();
    const pathId = st.activePath || "beginner";
    const done = stepList.filter(x => Boolean(st.checked[`${gameId}:${x.stepId}`])).length;
    const pct = stepList.length ? Math.round((done / stepList.length) * 100) : 0;
    const first = stepList.find(x => !st.checked[`${gameId}:${x.stepId}`]) || stepList[0];
    if (first) {
      setTarget({
        url: `/g/${gameId}/${pathId}/${first.chId}#step-${first.stepId}`,
        label: done > 0 ? `Resume (${pct}% done)` : "Start Ch. 01",
        pct
      });
    }
  }, [gameId]);

  if (!target) return null;
  return <a class="btn btn-accent" href={target.url}>{target.label} &rarr;</a>;
}
