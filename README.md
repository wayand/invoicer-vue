# Invoicer-Vue

This is the frontend of the [invoicer.wayand.dk](https://invoicer.wayand.dk) website, providing a seamless user interface for managing invoices.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Claude Code

The repo ships a shared [Claude Code](https://claude.com/claude-code) setup:

- `CLAUDE.md`: project overview, npm commands, layout and working rules.
- `.claude/rules/`: short Do/Don't lists that load only for matching files (JS/Vue code, dependencies) plus always-on git and security rules.
- `.claude/skills/`: `/check` (the CI build plus lint), `/commit <work-item-id>` and `/pr-description`.
- `.claude/settings.json`: shared permissions (what is allowed, asks first, or is denied) and attribution off.

Personal settings go in `.claude/settings.local.json` and `CLAUDE.local.md`. Both are git-ignored.
