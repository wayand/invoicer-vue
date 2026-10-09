# Invoicer Vue

Vue 3 + Vite single-page frontend for invoicer.wayand.dk (Vuex, vue-router, axios, Bootstrap/Mazer SCSS). It talks to the Flask backend in the separate `invoicer-api` repo. This is a JavaScript project, so the Python tooling (`uv`, ruff, pytest) does not apply here.

## Commands

```bash
npm ci                                                     # install exactly from package-lock.json (CI)
npm run dev                                                # dev server
npm run build                                              # production build, the only CI gate
npx eslint --ext .js,.vue --ignore-path .gitignore src     # lint without rewriting files
npm run lint                                               # lint with --fix (modifies files; use deliberately)
```

There is no test suite or test runner yet. Lint currently reports existing errors (mostly `vue/multi-word-component-names`). Don't add new ones.

## Layout

- `src/main.js`, `src/App.vue`, `index.html`, `vite.config.js`
- `src/views/` pages, `src/components/` reusable UI (by domain: `invoice/`, `contact/`, `layout/`, ...)
- `src/router/`, `src/store/` (Vuex, one module per domain in `store/modules/`)
- `src/services/` one axios service per API area, shared client in `http.js`; `src/composables/`, `src/utilities/`
- `src/assets/scss/` theme styles; `public/` static files
- `.env.local` holds `VITE_API_URL` (git-ignored); `dist/` is build output (git-ignored)

## Working rules

- Run `/check` before saying a task is done, and report what failed.
- Keep changes focused. No drive-by refactors, reformatting or unrelated dependency upgrades.
- API calls go through `src/services/`, not directly from components.
- Config via `import.meta.env.VITE_*`. Never hardcode API URLs or secrets. Anything in `VITE_*` ships to the browser.
- Don't touch shared config (`package.json` deps, `vite.config.js`, `.github/`, `dockerfile`, `deploy.sh`, `.claude/`) unless asked.
- Pushing to `master` deploys to production through GitHub Actions. Work on a branch and ask before committing or pushing; see `.claude/rules/git-and-security.md`.
- The working tree may contain the user's uncommitted work. Never reset, restore, stash or clean it.

## Personal overrides

`CLAUDE.local.md` and `.claude/settings.local.json` are git-ignored.
