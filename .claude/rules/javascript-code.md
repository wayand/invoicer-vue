---
paths:
  - "src/**/*.js"
  - "src/**/*.vue"
---

# JavaScript / Vue code

## Do
- Use Vue 3 `<script setup>` or the style already used in the file. Match its conventions.
- Give components multi-word names (`ClientList`, not `Clients`).
- Call the backend through `src/services/` and keep shared state in `src/store/modules/`.
- Read config from `import.meta.env.VITE_*`.
- Handle request errors (user-visible message, no silent `catch {}`).
- Keep ESLint clean for the files you touch.

## Don't
- Don't hardcode API URLs, tokens, passwords or absolute paths.
- Don't leave `console.log`, `debugger` or commented-out code behind.
- Don't use `v-html` with data from the API or user input, or `eval` / `new Function`.
- Don't store tokens anywhere new. Follow the existing auth handling (`jwtHelper.js`, `AuthService.js`).
- Don't import from `dist/` or `node_modules` paths directly.
