# Printh 3D — Full-Stack Management Platform

Application for presenting 3D-printing services and supporting operational workflows through a web administration interface. Combines a public catalog with an authenticated management area.

![Printh3D interface](public/assets/imagens/materials_hero.png)

## Project scope

- Public pages, product catalog, and quotation-related flows.
- Administrative views for products, categories, customers, sales, expenses, promotions, and users.
- Product costing and operational reports.
- Data persistence with Supabase (PostgreSQL) and protected administrative endpoints.
- Backup and recovery workflows, including a trash/recovery area.

## Engineering stack

- Next.js App Router, React, TypeScript.
- Supabase / PostgreSQL for application data.
- `jose` and `bcryptjs` for custom administration authentication.
- Tailwind CSS, Framer Motion, Chart.js.
- Vitest and Playwright for automated testing.

## Local setup

Prerequisites: a supported Node.js release, npm, and your own Supabase project with the required schema.

```bash
git clone https://github.com/vftheodoro/Printh3D.git
cd Printh3D
npm ci
```

Configure `.env.local` in the repository root (use your own credentials; never commit this file):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
ADMIN_JWT_SECRET=your_random_secret
```

Apply the schema/migrations from `supabase/` to your own environment before using admin features. Start with:

```bash
npm run dev
```

Visit http://localhost:3000 for the public site; administrative functionality is under `/admin`.

## Validation commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit/component tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright; requires setup) |
| `npm run build` | Production build |

## Architecture & documentation

- `src/app`: public pages, admin routes, and API endpoints.
- `src/lib`: shared domain and service helpers.
- `supabase`: database-related files.
- `tests`: automated tests.
- [`DOCUMENTACAO_COMPLETA.md`](DOCUMENTACAO_COMPLETA.md): detailed architecture and operation notes.

## Security and deployment

Protect the admin area with strong credentials. `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_JWT_SECRET` are strictly server-side secrets: never expose them through `NEXT_PUBLIC_`, the UI, screenshots, or commits. Validate authorization and database policies before deployment. This README documents the repository, not a security certification.

## Maintainer

[Victor Theodoro](https://www.linkedin.com/in/vftheodoro/) · [Portfolio](https://vftheodoro.vercel.app/pt)
