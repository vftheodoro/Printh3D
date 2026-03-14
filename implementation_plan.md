# Printh3D Pro — Admin System Integration to Next.js + Supabase

Migrate the existing Printh3D Pro HTML/JS admin system into the Next.js main site under `/admin`, replacing IndexedDB with Supabase, while preserving the exact visual style and all features.

## User Review Required

> [!IMPORTANT]
> **Supabase Credentials Needed:**
> 1. **Supabase Project URL** (e.g., `https://xxxxx.supabase.co`)
> 2. **Supabase Anon Key** (public key)
> 3. **Supabase Service Role Key** (secret, server-side only)
>
> Create a free project at [supabase.com](https://supabase.com) if you haven't already.

> [!IMPORTANT]
> **Admin Password:** What password should the admin account use? Default login will be `admin@printh3d.com`. Password will be hashed with bcrypt.

> [!CAUTION]
> **This is a very large migration (~6,000+ lines of JS + 2,576 lines of CSS + 1,043 lines of HTML).** The original system has 11 sections, 12 IndexedDB stores, and ~222KB of app logic. I'll rebuild it incrementally in phases. Each phase will be testable independently.

---

## System Analyzed (Complete Summary)

The Printh3D Pro system is a full-featured SPA built with pure HTML/CSS/JS using IndexedDB. It includes:

| Section | Features |
|---------|----------|
| **Dashboard** | 13 KPI cards, 4 Chart.js charts (bar, doughnut, line, expenses), recent sales, stock alerts, smart insights |
| **Categories** | CRUD with SKU prefixes, icons (32 Lucide icons), colors (14 options) |
| **Products** | Full CRUD, table + grid toggle, search/filter, file uploads (images/3D models/docs), cover images, variations, SKU generation, detailed cost calculator integration |
| **Sales** | Registration with product/custom items, multi-payment tracking, client auto-creation, installments, due amounts, cupom application, date/vendor filters |
| **Expenses** | CRUD with categories, payment methods, quantity/unit price, date/category/payment filters |
| **Clients** | CRUD with auto-registration from sales, ranking filters, debt tracking, purchase history |
| **Promotions** | Per-product promos (percentual/fixed), coupons with codes, limits, category restrictions, validity dates |
| **Calculator** | 4-step cost calculator (piece data → production costs → additional costs → final result), save as product, register as sale |
| **Settings** | Calculation parameters (margin, filament cost, machine cost, kWh, depreciation, failure rate), root folder sync |
| **Users** | Admin/VENDEDOR roles, CRUD |
| **Trash** | 30-day retention, restore/permanent delete |

**Tech Stack:** IndexedDB (12 stores), SHA-256 auth, Chart.js, Lucide Icons, JSZip, SheetJS/XLSX, File System Access API

**Theme:** Ultra-dark (#050508 body, #0a0a14 cards), cyan accent (#00BCFF), Inter font, 10px border-radius, subtle blue glow effects

---

## Proposed Changes

### Phase 1: Foundation & Auth

#### [NEW] `.env.local.example`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_JWT_SECRET=
```

#### [MODIFY] [package.json](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/package.json)
Add: `@supabase/supabase-js`, `bcryptjs`, `@types/bcryptjs`, `jose`

#### [NEW] [src/lib/supabase.ts](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/lib/supabase.ts)
Public + server Supabase clients.

#### [NEW] [src/lib/admin-auth.ts](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/lib/admin-auth.ts)
JWT helpers (create/verify tokens), bcrypt password verification, rate limiting (5 attempts / 15 min / IP).

#### [NEW] [src/middleware.ts](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/middleware.ts)
Protects `/admin/*` routes (except `/admin/login`), validates JWT from httpOnly cookie.

#### Supabase Schema (12 tables matching IndexedDB stores)
```sql
-- Core tables
CREATE TABLE admin_users (id SERIAL PRIMARY KEY, nome TEXT, email TEXT UNIQUE, senha_hash TEXT, tipo TEXT DEFAULT 'ADMIN');
CREATE TABLE settings (id INT PRIMARY KEY DEFAULT 1, margem_padrao NUMERIC, custo_kg NUMERIC, custo_hora_maquina NUMERIC, custo_kwh NUMERIC, consumo_maquina_w NUMERIC, percentual_falha NUMERIC, depreciacao_percentual NUMERIC);
CREATE TABLE categories (id SERIAL PRIMARY KEY, nome TEXT UNIQUE, prefixo TEXT UNIQUE, cor TEXT, descricao TEXT, icone TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ);
CREATE TABLE products (id SERIAL PRIMARY KEY, codigo_sku TEXT UNIQUE, category_id INT REFERENCES categories(id), nome TEXT, descricao TEXT, peso_g NUMERIC, tempo_min NUMERIC, tempo_h NUMERIC, dimensoes JSONB, material TEXT, cor TEXT, resolucao_camada NUMERIC, custo_total NUMERIC, preco_venda NUMERIC, preco_promocional NUMERIC, margem NUMERIC, quantidade_estoque INT DEFAULT 0, estoque_minimo INT DEFAULT 0, tags TEXT[], descricoes_social JSONB, ativo BOOLEAN DEFAULT true, calculation_mode TEXT, custo_detalhado JSONB, custos_adicionais JSONB, is_variation BOOLEAN DEFAULT false, parent_product_id INT, variation_label TEXT, cover_file_id INT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ);
CREATE TABLE product_files (id SERIAL PRIMARY KEY, product_id INT REFERENCES products(id), nome_arquivo TEXT, tipo TEXT, mime_type TEXT, tamanho_bytes INT, storage_path TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE promotions (id SERIAL PRIMARY KEY, product_id INT REFERENCES products(id), tipo_desconto TEXT, valor_desconto NUMERIC, preco_promocional NUMERIC, data_inicio TIMESTAMPTZ, data_fim TIMESTAMPTZ, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE coupons (id SERIAL PRIMARY KEY, codigo TEXT UNIQUE, tipo_desconto TEXT, valor_desconto NUMERIC, data_validade DATE, limite_usos INT DEFAULT 0, usos_realizados INT DEFAULT 0, categorias INT[], ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE sales (id SERIAL PRIMARY KEY, product_id INT, vendedor_id INT, item_nome TEXT, cliente TEXT, cliente_id INT, canal TEXT, cidade TEXT, valor_venda NUMERIC, valor_devido NUMERIC, lucro NUMERIC, desconto_percentual NUMERIC, cupom_id INT, tipo_pagamento TEXT, parcelas INT, data_venda TIMESTAMPTZ, observacoes TEXT);
CREATE TABLE sale_files (id SERIAL PRIMARY KEY, sale_id INT REFERENCES sales(id), nome_arquivo TEXT, mime_type TEXT, storage_path TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE clients (id SERIAL PRIMARY KEY, nome TEXT, instagram TEXT, whatsapp TEXT, cidade TEXT, email TEXT, observacoes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ);
CREATE TABLE expenses (id SERIAL PRIMARY KEY, descricao TEXT, categoria TEXT, fornecedor TEXT, tipo_pagamento TEXT, quantidade INT DEFAULT 1, valor_unitario NUMERIC, valor_total NUMERIC, data_gasto DATE, observacoes TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE trash (id SERIAL PRIMARY KEY, source_store TEXT, source_id INT, item_name TEXT, payload JSONB, deleted_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ);

-- RLS: public reads active products only
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active" ON products FOR SELECT USING (ativo = true);
```

> [!NOTE]
> Product files will use **Supabase Storage** (bucket `product-files`) instead of IndexedDB blobs. The `storage_path` column replaces the `blob` field.

---

### Phase 2: Admin Login Page

#### [NEW] [src/app/admin/login/page.tsx](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/app/admin/login/page.tsx)
Faithful reproduction of [login.html](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/Sistema/login.html) — centered card, Printh3D logo, email + password fields with eye toggle, shake animation on error, import database button.

#### [NEW] [src/app/api/admin/login/route.ts](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/app/api/admin/login/route.ts) / [logout/route.ts](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/app/api/admin/logout/route.ts)
JWT-based auth with httpOnly cookies.

---

### Phase 3: Admin Layout (Sidebar + Shell)

#### [NEW] [src/app/admin/layout.tsx](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/app/admin/layout.tsx)
Exact reproduction of the sidebar with all 11 navigation items, brand logo, user info, backup/export/import buttons. Responsive with hamburger menu.

#### [NEW] [src/app/admin/admin.css](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/src/app/admin/admin.css)
Port of the original [css/style.css](file:///c:/Users/fatec-dsm1/Desktop/Printh3D_Site/Sistema/css/style.css) (2,576 lines) — all CSS variables, card styles, table styles, form styles, button variants, modal styles, toast notifications, KPI grid, chart containers, calculator layout, file gallery, upload zone, and responsive breakpoints.

---

### Phase 4: Core Sections (iterative)

Each section becomes a Next.js page under `/admin/`:

| Route | Original Section |
|-------|-----------------|
| `/admin` | Dashboard (13 KPIs + 4 charts + recent sales + alerts + insights) |
| `/admin/categorias` | Categories CRUD (card grid with icons/colors) |
| `/admin/produtos` | Products CRUD (table/grid toggle, search, filters, file management) |
| `/admin/vendas` | Sales CRUD (flexible registration, payment tracking, filters) |
| `/admin/gastos` | Expenses CRUD (category/payment/date filters) |
| `/admin/clientes` | Clients CRUD (ranking, debt tracking, purchase history) |
| `/admin/promocoes` | Promotions + Coupons (two sub-tabs) |
| `/admin/calculadora` | Cost Calculator (4-step layout with real-time calculations) |
| `/admin/configuracoes` | Settings (calculation params) |
| `/admin/usuarios` | Users CRUD (admin-only) |
| `/admin/lixeira` | Trash (30-day retention, restore/delete) |

All CRUD operations use **Supabase API routes** under `src/app/api/admin/`.

---

### Phase 5: Data Migration & Backup

#### [NEW] `src/app/api/admin/migrate/route.ts`
- Imports old IndexedDB data (uploaded as ZIP/XLSX) into Supabase
- Button in admin settings page

#### [NEW] `src/app/api/admin/backup/route.ts`
- Exports all Supabase data as downloadable JSON
- Button in admin sidebar

---

### Phase 6: Public Site Integration

#### [MODIFY] `src/lib/products.ts`
Add Supabase fetch functions with fallback to hardcoded data.

#### [MODIFY] Catalog & Product Detail pages
- [x] Update catalog + product detail pages

---

### Phase 9: Real Data Migration & Final Sync

#### [MODIFY] `src/lib/products.ts`
- Removed `FALLBACK_PRODUCTS` array.
- Cleaned up fetch logic to rely solely on Supabase.
- Improved mapping for social descriptions and default images.

#### [DATA] Migration of `printh3d_data/data`
- Implement a script or use the existing Migrate API to upload `categories.json` and `products.json`.
- Ensure category IDs match so product relations are preserved.
- Verify migration via Admin Dashboard.

---

## File Structure (New Files)

```
src/
├── middleware.ts
├── lib/
│   ├── supabase.ts
│   ├── admin-auth.ts
│   └── products.ts (modified)
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Sidebar + shell
│   │   ├── admin.css           # Full admin theme port
│   │   ├── login/page.tsx      # Login page
│   │   ├── page.tsx            # Dashboard
│   │   ├── categorias/page.tsx
│   │   ├── produtos/page.tsx
│   │   ├── vendas/page.tsx
│   │   ├── gastos/page.tsx
│   │   ├── clientes/page.tsx
│   │   ├── promocoes/page.tsx
│   │   ├── calculadora/page.tsx
│   │   ├── configuracoes/page.tsx
│   │   ├── usuarios/page.tsx
│   │   └── lixeira/page.tsx
│   └── api/admin/
│       ├── login/route.ts
│       ├── logout/route.ts
│       ├── products/route.ts & [id]/route.ts
│       ├── categories/route.ts & [id]/route.ts
│       ├── sales/route.ts & [id]/route.ts
│       ├── expenses/route.ts & [id]/route.ts
│       ├── clients/route.ts & [id]/route.ts
│       ├── promotions/route.ts & [id]/route.ts
│       ├── coupons/route.ts & [id]/route.ts
│       ├── users/route.ts & [id]/route.ts
│       ├── settings/route.ts
│       ├── trash/route.ts & [id]/route.ts
│       ├── calculator/route.ts
│       ├── dashboard/route.ts
│       ├── migrate/route.ts
│       └── backup/route.ts
```

---

## Verification Plan

### Automated (Browser)
1. Auth: redirect unauthenticated → login → wrong creds → error → correct creds → dashboard
2. Dashboard: verify KPI cards render, charts are visible
3. Categories CRUD: create → list → edit → delete
4. Products CRUD: create with file upload → list → search → filter → edit → delete
5. Sales: register sale → verify client auto-created → filter by date
6. Calculator: input values → verify cost breakdown → save as product
7. Migration: upload old data → verify import
8. Backup: download → verify JSON contents
9. Public site: products page loads from Supabase

### Manual
1. `npm run build` succeeds (Vercel-ready)
2. Admin password change works
3. Mobile responsiveness of admin sidebar
