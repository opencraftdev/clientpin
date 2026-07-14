# Contributing to ClientPin

Thanks for your interest in ClientPin. Contributions of all kinds are welcome:
bug reports, fixes, docs, and features.

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Repository layout

| Path | What it is |
|------|------------|
| `panel/` | The web app (Next.js App Router, `@supabase/ssr`). Owner dashboard, onboarding, public project pages, landing. |
| `extension/` | The Chrome (Chromium) extension used to tag elements on live sites. |
| `supabase/` | Database schema, RLS policies, RPCs, and tests as SQL migrations. |

> Note: `panel/AGENTS.md` documents Next.js version-specific conventions. This
> is not the Next.js you may remember, so read it before changing app code.

## Getting started

Prerequisites: **Node 20+**, **npm**, and access to a **Supabase** project (or
the [Supabase CLI](https://supabase.com/docs/guides/cli) for a local stack).

```bash
# 1. Install web-app dependencies
cd panel
npm install

# 2. Configure environment (create panel/.env.local)
#    Required (see panel/lib/supabase):
#      NEXT_PUBLIC_SUPABASE_URL=...
#      NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Run the dev server (http://localhost:3000)
npm run dev
```

Database changes live in `supabase/migrations/` as ordered SQL files with
matching tests under `supabase/tests/`.

## Before you open a pull request

From `panel/`, make sure these pass:

```bash
npx tsc --noEmit   # type check
npm run lint       # eslint
npm test           # vitest
```

Keep pull requests focused on a single change, and update or add tests when you
change behavior.

## Branches and commits

- Branch off `main` with a descriptive name, e.g. `fix/onboarding-validation`
  or `feat/project-search`.
- We use [Conventional Commits](https://www.conventionalcommits.org/) for
  messages, e.g. `feat(web): add project search`.
- Fill in the pull request template so reviewers have context.

## Reporting bugs and requesting features

Please use the issue templates (bug report / feature request). For security
issues, do **not** open a public issue: see [SECURITY.md](SECURITY.md).

## License of contributions

ClientPin is licensed under the **GNU AGPL-3.0** (see [LICENSE](LICENSE)). By
submitting a contribution, you agree that it is licensed under the same terms.
