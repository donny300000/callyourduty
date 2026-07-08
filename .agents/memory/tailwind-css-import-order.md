---
name: Tailwind v4 CSS @import ordering
description: All @import statements in a Tailwind v4 index.css must come first, before any other rules
---

CSS spec requires `@import` rules to precede all other statements (except `@charset`/empty `@layer`). In Tailwind v4 projects, design subagents sometimes append a Google Fonts `@import url(...)` near the bottom of `index.css` (after `@theme`/`:root` blocks). This breaks the Vite/PostCSS build with: `[vite:css][postcss] @import must precede all other statements`.

**Why:** Design work often edits `index.css` incrementally and appends new @import lines wherever the edit happens to land, rather than at the top of the file.

**How to apply:** When adding or reviewing a Google Fonts (or any) `@import url(...)` in `index.css`, always place it as the very first line(s) of the file, before `@import "tailwindcss"` and other imports.
