# Codex of Shadows

Codex of Shadows is a local-first AI Keeper companion for Call of Cthulhu one-shots. It lets you spin up scenarios, craft investigators, and run a lightweight chat-style session with an AI Keeper that can stream from any OpenAI-compatible endpoint when provided with an API key (or fall back to a built-in prompt when offline).

## Features
- Guided scenario wizard that asks for era, tone, and setting, with optional LLM-based premise generation.
- Investigator builder that suggests traits, skills, and backgrounds via the same LLM pipeline when available.
- Session setup view that pairs a scenario with an investigator and kicks off a new play session.
- Chat-style play screen that streams Keeper narration, allows editing the last player message, and keeps investigator and session details in view.
- Local-first data model stored in `localStorage`, seeded with a handful of predefined scenario seeds.

## Tech stack
- [Next.js 14](https://nextjs.org/) with the App Router and TypeScript.
- Tailwind CSS for styling.
- Radix UI icons and small custom UI primitives.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## LLM configuration
The Keeper, scenario wizard, and investigator wizard stream from an OpenAI-compatible chat endpoint when an API key is available. The app reads the model, base URL, and API key from the persisted `settings.llm` object inside the `coc_keeper_app_data_v1` entry in `localStorage`. If no key is present, the UI still works with short built-in fallbacks.

## Scripts
- `npm run dev` – start the development server.
- `npm run build` – create a production build.
- `npm run start` – run the production server.
- `npm run lint` – lint the codebase with ESLint.
