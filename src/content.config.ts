import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const stepSchema = z.object({
  id: z.string(),
  area: z.string(),
  tags: z.array(z.enum(["story", "side", "missable", "grind", "collectible", "tip", "boss"])),
  text: z.string(),
  detail: z.string().optional(),
  warn: z.string().optional(),
  source: z.string().url().optional(),
  variants: z.object({ beginner: z.string().optional() }).optional(),
  grind: z.object({
    min_level: z.number(),
    why: z.string(),
    where: z.string().optional(),
    how: z.string().optional()
  }).optional(),
  gate: z.object({
    title: z.string(),
    items: z.array(z.object({ id: z.string(), label: z.string() }))
  }).optional()
});

export const collections = {
  games: defineCollection({
    loader: glob({ pattern: "*/game.json", base: "./src/content/games" }),
    schema: z.object({
      id: z.string(),
      title: z.string(),
      platform: z.string(),
      accent: z.string(),
      summary: z.string(),
      sources: z.array(z.object({ label: z.string(), url: z.string().url() }))
    })
  }),
  chapters: defineCollection({
    loader: glob({ pattern: "*/chapters/*.md", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      id: z.string(),
      num: z.string(),
      order: z.number(),
      title: z.string(),
      summary: z.string(),
      url: z.string().url().optional(),
      steps: z.array(stepSchema)
    })
  }),
  bosses: defineCollection({
    loader: glob({ pattern: "*/bosses.json", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      items: z.array(z.object({
        ch: z.string(), name: z.string(), loc: z.string(), lv: z.string(), hp: z.string().optional(), weak: z.array(z.string()), tactic: z.string()
      }))
    })
  }),
  demons: defineCollection({
    loader: glob({ pattern: "*/demons.json", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      items: z.array(z.object({
        name: z.string(), lv: z.number(), arcana: z.string(), dungeons: z.array(z.string()), weak: z.array(z.string()), avoid: z.array(z.string()), eager: z.string(), happy: z.string(), cards: z.string()
      })),
      qa: z.array(z.object({ q: z.string(), type: z.string(), answer: z.string(), effect: z.string() })).optional(),
      personalities: z.array(z.object({ trait: z.string(), style: z.string(), avoid: z.string() })).optional()
    })
  }),
  personas: defineCollection({
    loader: glob({ pattern: "*/personas.json", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      items: z.array(z.object({ name: z.string(), arcana: z.string(), lv: z.number(), role: z.string(), note: z.string() }))
    })
  }),
  fusions: defineCollection({
    loader: glob({ pattern: "*/fusions.json", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      items: z.array(z.object({ stage: z.string(), name: z.string(), seq: z.string(), el: z.array(z.string()), effect: z.string() }))
    })
  }),
  quests: defineCollection({
    loader: glob({ pattern: "*/quests.json", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      sideQuests: z.array(z.object({ id: z.string(), type: z.string(), name: z.string(), window: z.string(), reward: z.string(), missable: z.boolean() })),
      ultimateWeapons: z.array(z.object({ id: z.string(), char: z.string(), weapon: z.string(), req: z.string() })),
      rumormongers: z.array(z.object({ name: z.string(), loc: z.string(), district: z.string() })),
      materialCards: z.array(z.object({ id: z.string(), card: z.string(), persona: z.string(), arcana: z.string(), lv: z.number(), how: z.string(), route: z.enum(["all", "nate", "ellen"]).optional() })).optional()
    })
  }),
  glossary: defineCollection({
    loader: glob({ pattern: "*/glossary.json", base: "./src/content/games" }),
    schema: z.object({ game: z.string(), terms: z.record(z.string()) })
  }),
  areas: defineCollection({
    loader: glob({ pattern: "*/areas.json", base: "./src/content/games" }),
    schema: z.object({
      game: z.string(),
      items: z.array(z.object({ id: z.string(), name: z.string(), legend: z.string(), svg: z.string() }))
    })
  })
};
