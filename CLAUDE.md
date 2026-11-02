# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Vite + React 19 + TypeScript, scaffolded from `create-vite`'s `react-ts` template. Package manager is **pnpm** (managed via Corepack — `corepack enable pnpm` if missing).

## Commands

- `pnpm dev` — start the Vite dev server with HMR.
- `pnpm build` — type-check the project (`tsc -b`) and produce a production bundle in `dist/`. The `tsc -b` step is gating: type errors fail the build.
- `pnpm lint` — run ESLint across the repo using the flat-config in `eslint.config.js`.
- `pnpm typecheck` — `tsc -b` only (the type-check half of `build`).
- `pnpm test` — run the Vitest unit suite once. `pnpm test:watch` for watch mode.
- `pnpm preview` — serve the built `dist/` locally to sanity-check the production output.

These scripts are the single source of truth: the local pre-commit hooks and the CI workflow both invoke them, so a green commit and a green CI run can't disagree. Change behavior by editing the script in `package.json`, not by duplicating flags in a hook or workflow.

## Testing

Vitest with the jsdom environment and Testing Library. Config lives in `vite.config.ts` under the `test` key (`globals: true`, `setupFiles: ['./src/setupTests.ts']`); `src/setupTests.ts` registers `@testing-library/jest-dom` matchers. Co-locate tests as `*.test.ts(x)` next to the code. Test files live under `src/`, so `tsc -b` type-checks them, but Vite tree-shakes them out of the production bundle.

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
- **pre-commit framework** (`.pre-commit-config.yaml`) wires local hooks:
  - `commit-msg` stage → `pnpm exec commitlint --edit` validates the message.
  - `pre-commit` stage → `eslint --fix` on staged JS/TS files (auto-fixing), then `pnpm typecheck` and `pnpm test` (whole-repo, matching CI).
- Lint is the one intentional pre-commit/CI divergence: locally it auto-fixes staged files; CI runs whole-repo `pnpm lint` as the backstop. Both use the same `eslint.config.js`, so the fixed code a commit produces is exactly what CI re-checks. typecheck and test are identical commands on both sides.
- New contributors must run `pre-commit install --hook-type pre-commit --hook-type commit-msg` once after cloning.
- **Do not bypass with `--no-verify`.** A Claude PreToolUse hook (`.claude/hooks/block-no-verify.sh`, wired in `.claude/settings.json`) rejects `git commit --no-verify` and `-n` to keep the gates honest. Fix the underlying hook failure instead.

## CI and deployment

`.github/workflows/ci.yml` runs on push/PR to `main`: `pnpm lint`, `pnpm build`, `pnpm test` — the same scripts the pre-commit hooks use. pnpm is pinned via the `packageManager` field in `package.json`, which both `corepack` locally and `pnpm/action-setup` in CI honor.

The site deploys to **Azure Static Web Apps** (static `dist/` upload, `skip_app_build: true`):

- `.github/workflows/deploy-app-dev.yml` deploys on every push to `main` (and manually). It runs `scripts/add-noindex-header.mjs` so the dev site is never indexed.
- `.github/workflows/deploy-app-prod.yml` deploys when a GitHub release is published, or manually for an existing `v*` release tag. Never add a branch/SHA trigger to it.
- Both jobs declare `environment: dev` / `environment: prod`. Per environment they read the **secret** `AZURE_STATIC_WEB_APPS_API_TOKEN` (the Static Web App's deployment token — dev and prod differ, so it is never a repository-level secret) and the **variable** `SITE_URL` (public URL; shown on the deployment and passed to the build as `VITE_SITE_URL`). The environments, secrets and variables are created per repository — see the "Creating a new website" guide in the Confluence Guidance Documents.
- Azure resources, DNS and custom domains live in `bit-and-byte-ideas/platform-foundation`, not in this repo.
- `public/staticwebapp.config.json` holds the security headers (strict CSP: no inline scripts or styles, same-origin only), cache headers and the real-404 mapping. Extend `script-src`/`connect-src`/`img-src`/`frame-src` deliberately when adding a third-party origin. An app that adds client-side routing must also add a `navigationFallback`.
- Workflow actions are pinned to commit SHAs (Dependabot, `.github/dependabot.yml`, bumps SHA and version comment). Keep `permissions: contents: read` and `persist-credentials: false`.
