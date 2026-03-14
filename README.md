# 🚀 Printh 3D Pro — Impressão 3D de Alta Performance

![Printh3D Banner](public/assets/imagens/materials_hero.png)

A **Printh 3D** agora é uma plataforma completa e profissional para gestão e venda de serviços de impressão 3D. O projeto foi migrado para **Next.js 16** com **Supabase**, unificando o site institucional com o sistema de gestão **Printh3D Pro**.

---

## ✨ Características Principais

- **🎨 Design Premium**: Interface moderna com estética dark mode e glassmorphism.
- **🔐 Admin Pro**: Sistema de gestão completo em `/admin` com controle de estoque, vendas e clientes.
- **📊 Dashboard Inteligente**: Monitoramento de vendas, lucros e gastos em tempo real com gráficos interativos.
- **🖩 Calculadora Industrial**: Cálculo preciso de custos de filamento, hora-máquina, energia e impostos.
- **📦 Catálogo Dinâmico**: Gerenciamento de produtos em tempo real via banco de dados na nuvem.
- **♻️ Sistema de Lixeira**: Proteção contra exclusão acidental de dados importantes.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Backend / DB**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Security**: [Jose](https://github.com/panva/jose) (JWT) & [BcryptJS](https://github.com/dcodeIO/bcrypt.js)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (v18+)
- Conta no [Supabase](https://supabase.com/)

### Instalação
1. Clone o repositório:
```bash
git clone https://github.com/vftheodoro/Printh3D_Site.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente em `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_JWT_SECRET=...
```

4. Inicie o servidor:
```bash
npm run dev
```

---

## 📂 Estrutura do Projeto

```text
src/
├── app/              # Rotas e Páginas (Next.js App Router)
│   ├── admin/        # Sistema Administrativo Pro
│   ├── api/          # Endpoints da API (CRUD, Auth, Migration)
│   ├── produtos/     # Catálogo Público Dinâmico
│   └── ...           # Outras páginas institucionais
├── components/       # Componentes React
├── lib/              # Supabase Client, Auth Helpers e Lógica de Produtos
└── public/           # Assets estáticos
```

---

## 👨‍💻 Desenvolvido por

**Victor Theodoro**
- [LinkedIn](https://www.linkedin.com/in/victor-theodoro-braz-teixeira-603125206/)

---

*Transformando bits em átomos com precisão industrial e design impecável.* 🛠️✨
