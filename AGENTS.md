# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app; key folders include `components/`, `pages/`, `hooks/`, `utils/`, and `types/`.
- `src/content/` holds Markdown posts; register metadata in `src/data/posts.ts`.
- `public/` hosts static assets such as `images/`, `resources/`, and `photowall/`.
- `api/` contains Vercel serverless functions (comments and pageviews).
- `scripts/` contains utility scripts like `process-photos.cjs`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server.
- `npm run build` runs TypeScript build checks and bundles for production.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint across the codebase.
- `npm run generate-metadata` processes Photo Wall images and metadata.
- `npm run deploy` publishes `dist/` via `gh-pages` (optional).

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation; keep imports grouped and tidy.
- React components use PascalCase filenames (e.g., `Album.tsx`); hooks use `useX` naming.
- Styling is Tailwind CSS; use `clsx` and `tailwind-merge` for class composition.
- Linting is configured in `eslint.config.js`; run `npm run lint` before pushing.

## Testing Guidelines
- No automated test runner is currently configured.
- Treat `npm run lint` and `npm run build` as the primary quality gates.
- For UI changes, validate behavior in both `npm run dev` and `npm run preview`.

## Commit & Pull Request Guidelines
- Git history follows Conventional Commit-style prefixes: `feat`, `fix`, `refactor`, `docs`, optionally with a scope (e.g., `feat(gallery): ...`).
- Keep commit subjects short; add a body for non-trivial changes.
- PRs should include a concise summary, screenshots for UI changes, and note updates to `src/content/` or `public/` assets.

## Configuration & Secrets
- Comments and pageviews use `POSTGRES_URL` (Vercel Postgres). Do not commit secrets; configure via hosting or local environment variables.
