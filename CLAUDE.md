# Invoicer Vue

Vue 3 + Vite single-page frontend for invoicer.wayand.dk (Vuex, vue-router, axios, Bootstrap/Mazer SCSS). It talks to the Flask backend in the separate `invoicer-api` repo. This is a JavaScript project, so the Python tooling (`uv`, ruff, pytest) does not apply here.

## Commands

```bash
npm ci                                                     # install exactly from package-lock.json (CI)
npm run dev                                                # dev server
npm test                                                   # unit tests (Vitest, tests/)
npm run build                                              # production build
npx eslint src                                             # lint without rewriting files
npm run lint                                               # lint with --fix (modifies files; use deliberately)
npm run format:check                                       # Prettier check (CI)
npm run format                                             # Prettier write (reformats files)
```

CI (`.github/workflows/deploy.yml`) runs `Lint` (eslint with zero errors plus the Prettier check: keep both clean), `Test` and `Build image` on every pull request; deploys only after all three pass on `master`.

Tests live in `tests/` (Vitest + @vue/test-utils, jsdom), outside `src/`, so eslint does not cover them. Mock the services (`vi.mock('@/services/...')`): importing `@/services/http` pulls in the real router and store. Fix a bug with a test that fails without the fix.

## Layout

- `src/main.js`, `src/App.vue`, `index.html`, `vite.config.mjs`
- `src/views/` pages, `src/components/` reusable UI (by domain: `invoice/`, `contact/`, `layout/`, ...)
- `src/router/`, `src/store/` (Vuex, one module per domain in `store/modules/`)
- `src/services/` one axios service per API area, shared client in `http.js`; `src/composables/`, `src/utilities/`
- `src/assets/scss/` theme styles; `public/` static files
- `tests/` unit tests (`utilities/`, `services/`, `store/`, `components/`), `vitest.config.js`
- `.env.local` holds `VITE_API_URL` (git-ignored); `dist/` is build output (git-ignored)

## Working rules

- Run `/check` before saying a task is done, and report what failed.
- Keep changes focused. No drive-by refactors, reformatting or unrelated dependency upgrades. Format the files you touch with `npm run format` (Prettier, `.prettierrc.json`); CI fails on unformatted code.
- API calls go through `src/services/`, not directly from components.
- Config via `import.meta.env.VITE_*`. Never hardcode API URLs or secrets. Anything in `VITE_*` ships to the browser.
- Don't touch shared config (`package.json` deps, `vite.config.mjs`, `.github/`, `Dockerfile`, `nginx.conf`, `.claude/`) unless asked.
- Pushing to `master` deploys to production through GitHub Actions. Work on a branch and ask before committing or pushing; see `.claude/rules/git-and-security.md`.
- The working tree may contain the user's uncommitted work. Never reset, restore, stash or clean it.

## UI testing (isolated)

`.claude/launch.json` → `invoicer-ui-test` runs Vite on `localhost:8080` with `VITE_API_URL=http://localhost:5001`, overriding `.env.local`. Start the `invoicer-api-ui-test` server from the `invoicer-api` repo first. Always browse via `localhost`, never `127.0.0.1`: `src/services/http.js` falls back to the production API for other hostnames.

## Personal overrides

`CLAUDE.local.md` and `.claude/settings.local.json` are git-ignored.
