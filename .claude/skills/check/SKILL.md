---
name: check
description: Run the same checks as the CI pipeline (ESLint, Prettier check, tests, production build) in order and report pass/fail. Use before saying work is done, before committing, or when asked to verify.
allowed-tools: Bash(npm ci), Bash(npx eslint *), Bash(npm run format:check), Bash(npm test), Bash(npm run build *), Bash(docker build *), Bash(docker run --rm invoicer-vue:check nginx -t)
---

# Check

Mirror `.github/workflows/deploy.yml`: the jobs `Lint`, `Test` and `Build image`, minus the deploy. Run the steps in this order and keep going after a failure so the report is complete:

1. `npm ci`: only if `node_modules/` is missing or the user asks. It wipes and reinstalls `node_modules`, so otherwise report this step as skipped.
2. `npx eslint src` (job `Lint`): CI fails on any error, and the codebase is at zero. Never use `npm run lint` here, because it runs `--fix` and rewrites files.
3. `npm run format:check` (job `Lint`): fails on any file Prettier would change. Never run `npm run format` as part of the check, because it rewrites files. If this step fails, tell the user the fix is `npm run format`, and let them decide.
4. `npm test` (job `Test`): Vitest, in `tests/`.
5. `npm run build` (job `Build image`): CI runs this inside the Docker build. Locally it is the stand-in for that job.
6. Only if the change touches `Dockerfile`, `nginx.conf` or `.dockerignore`, and Docker is available: `docker build -t invoicer-vue:check .` and then `docker run --rm invoicer-vue:check nginx -t`, as `Build image` does. Otherwise report this step as skipped.

## Report

One line per step: `PASS`, `FAIL` or `SKIPPED`. Every failure counts, because ESLint, Prettier and the tests are all at zero failures. For a failure, show the first few lines of the real output, never a paraphrase. End with an overall verdict. Don't claim success if a step failed or was skipped without saying so.
