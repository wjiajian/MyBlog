# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (Vite frontend only)
npm run dev

# Build for production (frontend + backend)
npm run build

# Build server only
npm run build:server

# Start production server (self-hosted)
npm run serve

# Start development server with backend (ts-node)
npm run start

# Run linter
npm run lint

# Initialize PostgreSQL database tables
npm run db:init

# Generate photo wall metadata (converts HEIC, creates thumbnails, extracts EXIF)
npm run generate-metadata
```

## Project Architecture

This is a React + TypeScript + Vite blog with an Express backend for self-hosted deployment (formerly Vercel serverless).

### Core Data Flow

**Posts Configuration**: `src/data/posts.ts` uses Vite's `import.meta.glob` to automatically scan and parse all Markdown files in `src/content/tech/` and `src/content/life/`. Frontmatter is parsed with `gray-matter`. The `posts` array is sorted by year and date, descending. No manual registration is required.

**Content Loading**: Markdown files are imported via a custom Vite plugin (`markdownLoader` in `vite.config.ts`) that transforms `.md` files into exported string modules.

**Theme System**: Factory functions in `src/utils/theme.ts` return Tailwind class objects based on `darkMode` boolean: `getAppTheme()`, `getGalleryTheme()`, `getNavTheme()`. This avoids CSS-in-JS complexity while maintaining consistency.

**Comment System**: Two separate comment components exist:
- `src/components/CommentSection.tsx` - light theme (for blog posts)
- `src/components/PhotoCommentSection.tsx` - dark theme (for photo wall)

Both use `/api/comments` Express route with PostgreSQL storage. Comments support nested replies via recursive rendering.

### Backend Architecture

**Server Entry**: `server.ts` is an Express server that:
- Serves static files from `dist/` (frontend build output)
- Provides `/api/pageview` and `/api/comments` endpoints
- Implements SPA fallback route for client-side routing

**Database**: PostgreSQL connection pool in `src/db/index.ts` using the `pg` library. Tables: `pageviews`, `comments`. Initialize with `npm run db:init`.

**Dual TypeScript Configs**:
- `tsconfig.json` - Frontend (Vite)
- `tsconfig.server.json` - Backend (Node.js), outputs to `dist-server/`

### Component Architecture

**Modular Component Pattern**: Complex features split into sub-component directories:
- `src/components/BlogPost/` - `BlogHeader`, `BlogContent`, `TableOfContents`
- `src/components/PhotoWall/` - `PhotoGrid`, `Lightbox`, `Sidebar`

**State Management**: React Hooks + localStorage only. No global state library. Theme preference persists via `safeGetItem/safeSetItem` utilities.

**Lazy Loading**: Homepage implements progressive loading:
- Year-based grouping with pagination (`postsPerYear` state)
- "Load more" for additional posts within a year
- "Load more years" for historical content

### Photo Wall System

The photo wall (`src/pages/GalleryPage.tsx`) uses a multi-stage image pipeline:
1. Place originals in `public/photowall/origin/` (supports HEIC)
2. Run `npm run generate-metadata` to:
   - Convert HEIC to JPEG
   - Extract EXIF creation date
   - Generate full/medium/tiny thumbnails
   - Create `src/data/images-metadata.json`

Frontend implements progressive loading: tiny blurred placeholder → medium thumbnail → full image on demand.

## Code Patterns to Follow

1. **Type Safety**: No `any` types. All interfaces defined in `src/types/` or inline.

2. **Component Props**: Always define explicit interfaces:
   ```tsx
   interface ComponentProps {
     postId: string;
     onAction: () => void;
   }
   ```

3. **Theme Consistency**: Use theme factory functions from `utils/theme.ts`:
   ```tsx
   const theme = getAppTheme(darkMode);
   // Use theme.page, theme.overlay, etc.
   ```

4. **localStorage Safety**: Always use `safeGetItem()` and `safeSetItem()` from `src/utils/storage.ts` instead of native API. These handle SSR (`typeof window === 'undefined'`) and catch quota/policy errors.

5. **Date Parsing**: Use `parseMonthFromDate()` and `parseDate()` from `src/utils/date.ts` for consistent date formatting.

## Known Issues to Address

- **Comment Component Duplication**: `CommentSection.tsx` and `PhotoCommentSection.tsx` are 90% identical except for theme styles. Consider unifying with a theme prop.
- **localStorage Inconsistency**: Some files use native API instead of `safeGetItem/safeSetItem` utilities (check for direct `localStorage` calls before using).
