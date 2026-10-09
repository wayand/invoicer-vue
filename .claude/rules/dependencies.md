---
paths:
  - "package.json"
  - "package-lock.json"
---

# Dependencies

## Do
- Change dependencies only with `npm install <pkg>`, `npm install -D <pkg>` or `npm uninstall <pkg>` (these ask for approval).
- Commit `package.json` and `package-lock.json` together.
- Keep each dependency change in its own focused commit.
- Check that `npm ci && npm run build` works after any change, as CI does.

## Don't
- Don't hand-edit `package-lock.json`.
- Don't use `yarn`, `pnpm` or `npm install --force` / `--legacy-peer-deps`.
- Don't upgrade packages the task doesn't need (`npm update`, `npm audit fix`).
- Don't move ESLint config out of `package.json` (`eslintConfig`) or add a second ESLint config file.
