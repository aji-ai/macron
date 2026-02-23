# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**macron** is an Electron + React + TypeScript desktop app for managing macOS crontab jobs via a GUI. It wraps the `crontab` npm package with an Ant Design UI.

## Commands

```bash
# Development
yarn dev              # Start dev server with hot reload
yarn start            # Run production build with Electron

# Building
yarn build            # Build main and renderer processes
yarn build-dll        # Build Webpack DLL (required before first yarn dev)

# Testing
yarn test             # Run Jest unit tests
yarn test-watch       # Watch mode
yarn test-e2e         # Run TestCafe E2E tests
yarn test-all         # Full suite: lint + typecheck + build + tests + E2E

# Code Quality
yarn lint             # ESLint on JS/TS files
yarn lint-fix         # Auto-fix ESLint issues
yarn lint-styles      # Stylelint on SCSS/CSS
yarn ts               # TypeScript type checking

# Packaging
yarn package          # Build for current platform (macOS DMG)
yarn package-all      # Build for all platforms
```

## Architecture

**Two-process Electron model:**

- `app/main.dev.ts` — Main process: creates BrowserWindow (750×550, non-resizable), sets up TouchBar "Create Job" button, manages app lifecycle
- `app/index.tsx` — Renderer entry point, mounts React app

**React component tree:**

- `App.tsx` — Root component; loads cron jobs via the `crontab` package, holds all job state, handles CRUD operations, listens for TouchBar IPC events
- `Sidebar.tsx` — Lists all cron jobs, handles job selection
- `Editor.tsx` — Detailed job editor shown when a job is selected
- `CronBuilder.tsx` — Form component inside Editor for editing cron schedule syntax and command
- `Placeholder.tsx` — Empty state when no job is selected

**Utilities (`app/utils/`):**

- `events.js` — Custom event emitter bridging main↔renderer IPC
- `store.js` — Persistent settings via `electron-store`
- `helpers.js` — Clipboard, dock visibility, emoji rendering
- `theme.js` — System dark/light mode detection

**Build configs** live in `configs/` (Webpack) and `internals/` (scripts, mocks).

## Key Conventions

- TypeScript strict mode is enabled; `noUnusedLocals` and `noUnusedParameters` are enforced
- Husky + lint-staged run ESLint and Prettier automatically on pre-commit
- SCSS modules are used for component-scoped styles alongside `app/app.global.css` for globals
- Electron Builder outputs to `release/`; app ID is `com.owenmelbourne.macron`
- Auto-update is configured via `electron-updater` pointing to GitHub releases
