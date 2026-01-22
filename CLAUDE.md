# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Generate photo wall metadata (converts HEIC, creates thumbnails, extracts EXIF)
npm run generate-metadata
```

## Project Architecture

This is a React + TypeScript + Vite blog deployed on Vercel with serverless API functions.

### Core Data Flow

**Posts Configuration**: All blog posts are centrally defined in `src/data/posts.ts`. This file imports Markdown content and exports a `posts` array containing metadata (id, title, year, date, type, categories, coverImage, etc.). The frontend filters and renders posts based on this configuration.

**Content Loading**: Markdown files are imported directly via Vite's custom markdown loader plugin (see `vite.config.ts`). The loader transforms `.md` files into exported string modules.

**Theme System**: The app uses a factory function pattern for theming. `src/utils/theme.ts` exports `getAppTheme()`, `getGalleryTheme()`, and `getNavTheme()` functions that return Tailwind class objects based on a `darkMode` boolean. This avoids CSS-in-JS complexity while maintaining theme consistency.

**Comment System**: Two near-identical comment components exist:
- `src/components/CommentSection.tsx` - light theme (for blog posts)
- `src/components/PhotoCommentSection.tsx` - dark theme (for photo wall)

Both use `/api/comments` serverless function with Vercel Postgres storage. Comments support nested replies via recursive rendering.

### Component Architecture

**Modular Component Pattern**: Complex features are split into sub-component directories:
- `src/components/BlogPost/` - Contains `BlogHeader`, `BlogContent`, `TableOfContents`
- `src/components/PhotoWall/` - Contains `PhotoGrid`, `Lightbox`, `Sidebar`

**State Management**: The app uses React Hooks + localStorage for persistence. No global state library (Redux/Zustand) is used. Theme preference persists via `safeGetItem/safeSetItem` utilities.

**Lazy Loading**: The homepage implements progressive loading:
- Year-based grouping with pagination (`postsPerYear` state)
- "Load more" for additional posts within a year
- "Load more years" for historical content

### API Structure

Serverless functions in `api/` directory:
- `api/comments.ts` - CRUD for comments with rate limiting (in-memory Map)
- `api/pageview.ts` - Track article view counts

**Important**: Vite config excludes the `api/` directory from client-side processing via custom plugin (`excludeApiDir`). These functions run on Vercel Edge Runtime.

### Photo Wall System

The photo wall (`src/pages/GalleryPage.tsx`) uses a multi-stage image pipeline:
1. Place originals in `public/photowall/origin/` (supports HEIC)
2. Run `npm run generate-metadata` to:
   - Convert HEIC to JPEG
   - Extract EXIF creation date
   - Generate full/medium/tiny thumbnails
   - Create `public/photowall/images-metadata.json`

The frontend implements progressive loading: displays tiny blurred placeholder → loads medium thumbnail → loads full image on demand.

### Important Utilities

**localStorage Safety**: Always use `safeGetItem()` and `safeSetItem()` from `src/utils/storage.ts` instead of native localStorage API. These handle SSR (`typeof window === 'undefined'`) and catch quota/policy errors.

**Date Parsing**: `src/utils/date.ts` provides `parseMonthFromDate()` and `parseDate()` for consistent date formatting.

## Code Patterns to Follow

1. **Type Safety**: No `any` types. All interfaces defined in `src/types/` or inline.

2. **Component Props**: Always define explicit interfaces for component props:
   ```tsx
   interface ComponentProps {
     postId: string;
     onAction: () => void;
   }
   ```

3. **Theme Consistency**: Use theme factory functions from `utils/theme.ts` rather than hardcoding colors:
   ```tsx
   const theme = getAppTheme(darkMode);
   // Use theme.page, theme.overlay, etc.
   ```

4. **Import Paths**: Markdown content is imported from `src/content/tech/` or `src/content/life/` and registered in `src/data/posts.ts`.

## Known Issues to Address

- **Comment Component Duplication**: `CommentSection.tsx` and `PhotoCommentSection.tsx` are 90% identical except for theme styles. Consider unifying with a theme prop.
- **Rate Limit Storage**: `api/comments.ts` uses in-memory Map which resets on server restart. Consider Redis/Vercel KV for production.
- **localStorage Inconsistency**: Some files use native API instead of `safeGetItem/safeSetItem` utilities (e.g., `PhotoCommentSection.tsx` L123, L159).
