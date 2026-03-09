# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the app and shared modules: `components/`, `pages/`, `hooks/`, `utils/`, `types/`, and content/data loaders.
- Backend entrypoint is `server.ts`; API routes live in `src/routes/`, middleware in `src/middleware/`, and PostgreSQL access in `src/db/`.
- Markdown posts are stored in `src/content/tech/` and `src/content/life/` with frontmatter metadata.
- Static assets are in `public/` (images, photo wall, avatars). Photo metadata is stored in `src/data/images-metadata.json` and is primarily maintained by the admin upload/delete flow in `src/routes/photos.ts`.
- Build outputs are `dist/` and `dist-server/`; treat them as generated artifacts.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite frontend dev server.
- `npm run start`: run `server.ts` directly for backend development.
- `npm run build`: TypeScript project build + frontend production bundle.
- `npm run build:server`: compile backend to `dist-server/`.
- `npm run serve`: run compiled backend (`dist-server/server.js`).
- `npm run lint`: run ESLint across the repo.
- `npm run db:init`: initialize PostgreSQL tables.
- `npm run generate-metadata`: legacy/manual backfill tool for rebuilding photo wall thumbnails + metadata from source images; not the primary production workflow.

## Coding Style & Naming Conventions
- Use TypeScript with ESM imports and keep modules focused (single responsibility).
- Follow existing formatting: 2-space indentation, semicolons, and clear type annotations at boundaries.
- Use `PascalCase` for React components/pages (`PhotoCommentSection.tsx`), `camelCase` for functions/variables, and `useXxx` for hooks.
- Keep route/module names resource-oriented and consistent (`posts.ts`, `photos.ts`, `auth.ts`).
- Run `npm run lint` before opening a PR.

## Testing Guidelines
- No automated test framework is currently configured in `package.json`.
- Minimum validation for each change: `npm run lint` + manual verification of affected UI/API flows.
- If behavior changes, include reproducible verification steps in the PR description.
- If adding tests, use `*.test.ts`/`*.test.tsx` naming and colocate with the feature or under `src/__tests__/`.

## Commit & Pull Request Guidelines
- Prefer conventional-style commit prefixes already used in history: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Keep commit subjects short and imperative; optional scope is encouraged (example: `fix(auth): harden token validation`).
- PRs should include: purpose, changed paths, manual test evidence, screenshots/GIFs for UI changes, and linked issues/tasks.

## Security & Configuration Tips
- Do not commit secrets; copy `.env.example` to `.env` locally.
- In production, set a strong `JWT_SECRET` and prefer `ADMIN_PASSWORD_HASH` over plaintext `ADMIN_PASSWORD`.
- Review route/input validation carefully when touching file or auth-related endpoints.
