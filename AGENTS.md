# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains application code. Frontend UI lives in `src/components/` and `src/pages/`, shared logic in `src/hooks/`, `src/utils/`, and `src/types/`.
- Markdown content is organized under `src/content/tech/` and `src/content/life/`; loading/parsing is handled in `src/data/posts.ts`.
- Backend entry is `server.ts`, with API routes in `src/routes/`, middleware in `src/middleware/`, and PostgreSQL access in `src/db/`.
- Static files live in `public/` (`images/`, `resources/`, `photowall/`). Build outputs are `dist/` and `dist-server/` (generated files).

## Build, Test, and Development Commands
- `npm run dev` — start Vite frontend dev server.
- `npm run start` — run Express server with `ts-node` for backend development.
- `npm run build` — compile TypeScript and build frontend bundle.
- `npm run build:server` — compile server code to `dist-server/`.
- `npm run serve` — run production server from built output.
- `npm run lint` — run ESLint across the repository.
- `npm run db:init` — initialize PostgreSQL tables.
- `npm run generate-metadata` — process photo assets and regenerate `src/data/images-metadata.json`.

## Coding Style & Naming Conventions
- Use TypeScript/TSX with strict typing (`strict`, `noUnusedLocals`, `noUnusedParameters` enabled).
- Prefer 2-space indentation and keep formatting consistent with surrounding code.
- Name React components/files in `PascalCase` (for example, `PhotoCommentSection.tsx`), hooks as `useXxx`, and utilities in `camelCase`.
- Keep modules focused: route logic in `src/routes/`, database logic in `src/db/`, and shared types in `src/types/`.
- Run `npm run lint` before submitting changes.

## Testing Guidelines
- There is currently no dedicated `npm test` script or committed test suite.
- Required validation for contributions: `npm run lint` and `npm run build`.
- For feature work, smoke-test key paths locally: homepage, post detail rendering, comments API, and `/admin` authentication flow.

## Commit & Pull Request Guidelines
- Follow Conventional Commit-style prefixes used in history: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Keep commits atomic and scoped to one concern.
- PRs should include: change summary, impacted paths, local verification commands, and screenshots/GIFs for UI updates.
- Link related issues and note any environment-variable or database setup changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for local setup; never commit secrets.
- Preserve existing auth and path-validation safeguards when touching server routes.
