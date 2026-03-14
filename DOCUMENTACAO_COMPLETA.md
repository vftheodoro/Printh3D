# Documentação Completa — Printh 3D Pro (Next.js + Supabase)

## 1. Visão Geral
A **Printh 3D** é uma plataforma digital premium voltada para serviços de impressão 3D (manufatura aditiva). O projeto evoluiu de uma SPA estática para uma aplicação Full-Stack moderna utilizando **Next.js 16** e **Supabase**, integrando um sistema administrativo (Admin Pro) robusto para gestão total do negócio.

---

## 2. Stack Tecnológica
- **Framework**: Next.js 16 (App Router)
- **Backend-as-a-Service**: Supabase (PostgreSQL, Auth, Storage)
- **Segurança**: JWT (`jose`), Cookies `httpOnly`, Hashing `bcryptjs`
- **Estilização**: CSS Vanilla (Admin) / Tailwind CSS (Site Público)
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **Gráficos**: Chart.js

---

## 3. Arquitetura do Sistema

### 3.1 Site Público
Voltado para vendas e divulgação, focado em SEO e performance.
- **Catálogo Dinâmico**: Busca produtos e categorias diretamente do Supabase via Server Components.
- **Fallback de Dados**: Sistema de segurança que carrega produtos estáticos caso o banco de dados esteja inacessível.
- **SEO**: Metadados dinâmicos para cada página de produto.

### 3.2 Sistema Administrativo (/admin)
Replica exata do sistema original "Printh3D Pro", agora integrado ao banco de dados na nuvem.
- **Dashboard**: 13 KPIs e 4 gráficos de desempenho integrados.
- **Gestão (CRUD)**: Categorias, Produtos, Vendas, Gastos, Clientes, Promoções e Usuários.
- **Calculadora Pro**: Simulador de custos de 4 etapas que permite salvar resultados como novos produtos.
- **Lixeira**: Sistema de soft-delete para recuperação de dados excluídos acidentalmente.
- **Migração & Backup**: Ferramentas para importar dados do sistema antigo (IndexedDB) e exportar backups em JSON.

---

## 4. Segurança e Autenticação
- **Autenticação Customizada**: Não utiliza o Supabase Auth padrão para facilitar o bypass de e-mail e manter compatibilidade com o login do sistema antigo.
- **JWT**: Tokens gerados no servidor e armazenados em cookies `httpOnly` para evitar ataques XSS.
- **Middleware**: Interceptação de todas as rotas `/admin/*` para garantir que apenas usuários autenticados acessem o painel.
- **Rate Limiting**: Proteção básica de tentativas de login por IP.

---

## 5. Banco de Dados (Supabase)
O esquema do banco de dados consiste em 12 tabelas principais, espelhando os "stores" do IndexedDB original:
- `admin_users`, `categories`, `products`, `product_files`, `sales`, `sale_files`, `clients`, `expenses`, `promotions`, `coupons`, `settings`, `trash`.

---

## 6. Configuração e Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com os seguintes dados:
```env
NEXT_PUBLIC_SUPABASE_URL=seu-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
ADMIN_JWT_SECRET=segredo-gerado-aleatoriamente
```

---

## 7. Manutenção de Conteúdo
- **Imagens**: O site público utiliza `public/assets/imagens`. O sistema admin permite gerenciamento via Supabase Storage.
- **Site**: Para alterações na Home ou Materiais, os componentes estão em `src/app/`.
- **Produtos**: O gerenciamento deve ser feito agora INTEGRALMENTE via painel administrativo em `/admin`.

---

## 8. Guia de Deploy
1. Subir o repositório para o GitHub.
2. Conectar à Vercel.
3. Importar as Variáveis de Ambiente.
4. Executar o script SQL no editor do Supabase Dashboard.
5. Fazer login em `/admin/login`.

---
*Documentação atualizada em 14 de Março de 2026 após migração bem-sucedida.*
