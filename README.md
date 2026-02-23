# Macroni

> macOS crontab manager for agent automation tasks — a modern fork of [Macron](https://github.com/OwenMelbz/macron) by [Owen Melbourne](https://github.com/OwenMelbz).

Built with Electron + React + TypeScript + Tailwind CSS v4. Features a frosted-glass sidebar, natural language schedule entry, and a live cron preview.

## Credits

This project is derived from **Macron** (© Owen Melbourne), originally created as a simple GUI for managing macOS crontab jobs. The original source is at [github.com/OwenMelbz/macron](https://github.com/OwenMelbz/macron).

## Development

```bash
npm run dev          # hot-reload dev mode
npm run build        # typecheck + build
npm run build:mac    # package as macOS DMG
```

## Privacy Policy & Terms of Use

No data is stored or tracked. Everything is local to the device. Cron jobs are written directly to your system crontab via the standard `crontab` command.
