---
name: react-leaflet + React 19 compatibility
description: Which react-leaflet version to install when the app uses React 19
---

`react-leaflet@4.x` declares a peer dependency on React 18 and will produce pnpm peer-dependency warnings and can trigger Vite dependency pre-bundling/resolution errors ("Failed to resolve import react-leaflet") when the project uses React 19.

**Why:** react-leaflet@4's `@react-leaflet/core` peer range is `^18.0.0`; pnpm's strict linking combined with Vite's dependency scanner can fail to resolve the package in a React 19 project.

**How to apply:** When adding map functionality (react-leaflet + leaflet) to a React 19 project, install `react-leaflet@5` (and `@types/leaflet` as a dev dependency) instead of the default latest-major resolution, then restart the dev server.
