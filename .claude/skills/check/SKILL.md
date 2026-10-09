---
name: check
description: Run the same steps as the CI pipeline (install, production build) plus a non-fixing ESLint pass, in order, and report pass/fail. Use before saying work is done, before committing, or when asked to verify.
allowed-tools: Bash(npm run build *), Bash(npm ci), Bash(npx eslint *)
---

# Check

Mirror `.github/workflows/deploy.yml` (job `build-and-deploy`, minus the deploy steps). Run in this order and keep going after a failure so the report is complete:

1. `npm ci`: only if `node_modules/` is missing or the user asks. It wipes and reinstalls `node_modules`, so otherwise report this step as skipped.
2. `npm run build`: the only gate CI enforces.
3. `npx eslint --ext .js,.vue --ignore-path .gitignore src`: not part of CI. Never use `npm run lint` here, because it runs `--fix` and rewrites files.

There is no test suite. Say so in the report and don't imply tests ran.

## Report

One line per step: `PASS`, `FAIL` or `SKIPPED`. The repo already has pre-existing ESLint errors, so compare against the baseline: list only errors in files changed on this branch (`git diff --name-only master`) as failures, and mention the remaining count as pre-existing. End with an overall verdict. Don't claim success if a step failed.
