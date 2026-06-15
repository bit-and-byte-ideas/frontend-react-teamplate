# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Vite + React 19 + TypeScript, scaffolded from `create-vite`'s `react-ts` template. Package manager is **pnpm** (managed via Corepack — `corepack enable pnpm` if missing).

## Commands

- `pnpm dev` — start the Vite dev server with HMR.
- `pnpm build` — type-check the project (`tsc -b`) and produce a production bundle in `dist/`. The `tsc -b` step is gating: type errors fail the build.
- `pnpm lint` — run ESLint across the repo using the flat-config in `eslint.config.js`.
- `pnpm preview` — serve the built `dist/` locally to sanity-check the production output.

No test runner is configured yet. If adding one, Vitest is the natural pairing with Vite; update this file when scripts land.

## TypeScript layout

Uses TS project references — the root `tsconfig.json` is just a solution file and references two real configs:

- `tsconfig.app.json` — covers `src/` (browser code). Bundler-mode resolution, `verbatimModuleSyntax`, `noUnusedLocals`/`noUnusedParameters`, and `erasableSyntaxOnly` are all on, which means: type-only imports must use `import type`, unused symbols fail the build, and TS-only syntax that can't be erased (enums, namespaces, parameter properties) is rejected. Prefer plain unions/objects over `enum`.
- `tsconfig.node.json` — covers tooling files (`vite.config.ts`).

When changing TS config, edit the appropriate referenced file, not the root.

## ESLint

Flat config (`eslint.config.js`) extends `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` flat recommended, and `eslint-plugin-react-refresh`'s `vite` preset. `dist` is globally ignored. Rules are **not** type-aware by default; if turning on `recommendedTypeChecked`, wire `parserOptions.project` to both tsconfigs as shown in `README.md`.

## React Compiler

Not enabled. See `README.md` if/when adding it.

## Commit hygiene

- **Conventional Commits** are enforced. `commitlint.config.js` extends `@commitlint/config-conventional`, so commit headers must look like `feat: ...`, `fix(scope): ...`, `chore: ...`, etc.
- **pre-commit framework** (`.pre-commit-config.yaml`) wires three local hooks:
  - `commit-msg` stage → `pnpm exec commitlint --edit` validates the message.
  - `pre-commit` stage → `pnpm exec eslint --fix` on staged JS/TS files, then `pnpm exec tsc -b` for a full type-check.
- New contributors must run `pre-commit install --hook-type pre-commit --hook-type commit-msg` once after cloning.
- **Do not bypass with `--no-verify`.** A Claude PreToolUse hook (`.claude/hooks/block-no-verify.sh`, wired in `.claude/settings.json`) rejects `git commit --no-verify` and `-n` to keep the gates honest. Fix the underlying hook failure instead.
