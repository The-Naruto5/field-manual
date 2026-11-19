# Field Manual — Private Multi-Game Guide (PWA)

Image-free, typographic field manual built with **Astro + Content Collections + Preact islands + Pagefind + Offline PWA**.

## 1. Local Development & Search Build
```bash
npm install
npm run dev      # local development server
npm run build    # static output + Pagefind search index in dist/
npm run preview  # test production build with Ctrl+K Pagefind search + offline Service Worker
```

## 2. Install on Your Phone (Offline PWA)
1. Open the deployed site (or local HTTPS preview) on iOS Safari or Android Chrome.
2. Tap **Share → Add to Home Screen** (iOS) or **Install App** (Android).
3. Every visited chapter, boss table, and demon lookup is cached automatically by `public/sw.js` for 100% offline mid-game use.

## 3. Private Password-Protected Hosting
- **Cloudflare Pages**: Connect this repo (`npm run build`, output `dist`) and enable **Cloudflare Zero Trust → Access** (free for personal use) to lock the domain to your email.
- **Netlify**: Connect this repo (`netlify.toml` is preconfigured) and enable **Site Access Control / Password Protection**.

## Included Games
1. **Persona 2: Innocent Sin (PSP English)** (`/g/persona2-is`): 5 chapters (43 steps, 100% Beginner variants, Story Pause Gates, Grind Where/How), 19 Bosses, 97 negotiable Demons + 3-Pact tracker, Best Personas, Fusion Spells, Quests, Ultimate Weapons, Glossary, 3 SVG maps.
2. **Persona 2: Eternal Punishment (PS1 English / PSP Notes)** (`/g/persona2-ep`): 5 chapters, Nate Nanjo vs. Ellen Kirishima route filter, 22 Bosses, 27 key Demons, 32 tracked Material Cards, 12 Best Personas, 15 Fusion Spells, 8 Rumormongers, Ultimate Weapons, Glossary, 2 SVG maps.
