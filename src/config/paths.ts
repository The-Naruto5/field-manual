export type PathId = "full" | "story" | "beginner" | "grind";

export interface PathRule {
  id: PathId;
  name: string;
  time: string;
  suits: string;
  include: string[];
  hide?: string[];
  variant?: "beginner";
  grind?: "minimum";
}

export const PATHS: Record<PathId, PathRule> = {
  full: {
    id: "full",
    name: "Full Complete",
    time: "~45h",
    suits: "Completionists chasing every missable, Prime/Ultimate Persona, Rumor, and Legendary Weapon.",
    include: ["*"]
  },
  story: {
    id: "story",
    name: "Story",
    time: "~28h",
    suits: "Players focused on the main narrative and mandatory bosses without side-quest detours.",
    include: ["story", "boss"],
    hide: ["side", "grind", "tip"]
  },
  beginner: {
    id: "beginner",
    name: "Beginner",
    time: "~35h",
    suits: "First-time players wanting plain-language explanations, Spoiler Shield on by default, and missable warnings.",
    include: ["story", "boss", "tip", "missable"],
    variant: "beginner"
  },
  grind: {
    id: "grind",
    name: "Easy Grind",
    time: "~30h",
    suits: "Players wanting exact Where/How leveling checkpoints, Estoma/Contact SP loops, and Story Pause Gates.",
    include: ["story", "boss", "missable", "grind"],
    grind: "minimum"
  }
};

export function stepMatchesPath(tags: string[], pathId: PathId): boolean {
  const rule = PATHS[pathId];
  if (rule.include.includes("*")) return true;
  if (rule.hide && tags.some(t => rule.hide!.includes(t)) && !tags.some(t => ["story", "boss"].includes(t))) {
    return false;
  }
  return tags.some(t => rule.include.includes(t));
}
