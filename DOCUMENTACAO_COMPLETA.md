# Documentação Completa — Printh 3D (Next.js Version)

## 1. Visão Geral
A **Printh 3D** é uma plataforma digital premium voltada para serviços de impressão 3D (manufatura aditiva). O projeto foi totalmente refatorado para uma arquitetura moderna utilizando **Next.js**, focando em performance, estética impecável (Premium Dark Mode) e conversão de vendas.

---

## 2. Stack Tecnológica
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **Gráficos 3D**: React Three Fiber / Three.js (no Simulador de Orçamento)
- **Deployment**: Otimizado para Vercel

---

## 3. Arquitetura de Pastas
```text
src/
├── app/                  # Roteamento e Estrutura de Páginas
│   ├── contato/          # Página de Contato e Redes Sociais
│   ├── materias/         # Central de Informações e Materiais
│   ├── orcamento/        # Simulador 3D de Orçamentos
│   ├── produtos/         # Catálogo e Detalhes de Produtos
│   ├── layout.tsx        # Layout Global (Fonts, Metadata, Nav/Footer)
│   └── page.tsx          # Home Page (Hero, Features, FAQ)
├── components/           # Componentes Reutilizáveis
│   ├── home/             # Componentes específicos da Home
│   ├── layout/           # Componentes globais (Navbar, Footer, Floats)
│   ├── orcamento/        # Componentes do simulador (3D Cube)
│   └── products/         # Componentes do catálogo (Cards, Filters)
├── lib/                  # Lógica, Dados e Tipagens
│   └── products.ts       # Base de dados de produtos e filtros
└── public/               # Assets Estáticos
    └── assets/
        ├── imagens/      # Fotos de produtos e processos (IA Generated)
        └── logos/        # Logotipos oficiais (Printh3D, Shopee)
```

---

## 4. Principais Seções e Funcionalidades

### 4.1 Home Page
- **Hero Section**: Animação de partículas dinâmica, efeito de vidro (glassmorphism) e branding forte.
- **Processo (Features)**: Apresentação visual das etapas de produção com imagens cinematográficas reais de impressão 3D.
- **Destaques**: Exibição rápida dos principais itens do catálogo.
- **FAQ**: Seção de dúvidas frequentes com interface sanfona (accordion).

### 4.2 Simulador de Orçamento (3D)
- **Visualização Interativa**: Um cubo 3D renderizado em tempo real que reflete as dimensões inseridas pelo usuário.
- **Cálculo Automático**: Algoritmo que considera volume, preenchimento (infill), complexidade e material para gerar uma faixa de preço estimada.
- **Conversão**: Gera uma mensagem estruturada para o WhatsApp com todos os detalhes técnicos do pedido.

### 4.3 Catálogo de Produtos
- **Filtros Dinâmicos**: Busca por nome e filtragem por categorias (Colecionáveis, Decoração, Industrial).
- **Integração Shopee**: Card destacado com branding oficial da Shopee para clientes que preferem a segurança do marketplace.
- **Detalhes**: Páginas dedicadas para cada produto com descrição completa e materiais disponíveis.

### 4.4 Central de Materiais ("Como Funciona")
- **Educação do Cliente**: Explicações detalhadas sobre PLA, ABS, PETG e TPU.
- **Diferenciação**: Mostra aplicações reais e objetos do dia a dia feitos com cada material para facilitar a escolha do usuário.
- **Imagens Reais**: Fotos de alta performance geradas para ilustrar cada tipo de filamento.

### 4.5 Contato e Redes Sociais
- **Social Branding**: Cards estilizados com as cores oficiais de Instagram, TikTok, Facebook e Shopee.
- **Canais Diretos**: WhatsApp e E-mail integrados com fácil acesso.
- **Floating CTA**: Botão flutuante do WhatsApp presente em todas as páginas para suporte imediato.

---

## 5. Design System
- **Tema**: Dark Mode Premium (Slate-950 / Black).
- **Cores**:
  - Azul Printh3D: `blue-500` / `blue-600`
  - Acentos: Teal, Emerald (sutis em ícones)
  - Erro/Status: Red-500
- **Tipografia**: **Outfit** (via Google Fonts), escolhida por sua legibilidade e ar tecnológico.
- **Visual**: Uso extensivo de `backdrop-blur`, bordas semitransparentes (`white/5`) e sombras projetadas (glows).

---

## 6. Configurações e Manutenção

### 6.1 Cadastro de Produtos
Para adicionar ou editar produtos, edite o arquivo `src/lib/products.ts`. Certifique-se de associar imagens existentes na pasta `public/assets/imagens`.

### 6.2 SEO e Metadados
Os metadados globais (Título, Favicon, Descrição) são configurados em `src/app/layout.tsx`. O favicon oficial é o logo da Printh 3D.

---

## 7. Próximos Passos (Roadmap)
- [ ] Implementar sistema de upload de arquivos STL diretamente no simulador.
- [ ] Adicionar sistema de checkout real (Stripe/Mercado Pago) se necessário.
- [ ] Dashboard administrativo para gerenciamento de catálogo via CMS (Sanity/Strapi).
- [ ] Galeria de fotos enviadas por clientes (Social Proof).

---

*Documentação atualizada em 12 de Março de 2026.*
