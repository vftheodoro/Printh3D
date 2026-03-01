# 01 - Arquitetura do sistema

## 1. Arquitetura geral

Printh3D Pro é uma SPA em JavaScript modular baseada em IIFE.

Camadas:
1. Interface: index.html, login.html, css/style.css.
2. Orquestração: js/app.js (navegação e eventos).
3. Domínio: categories, promotions, calculator, dashboard, filemanager, auth.
4. Persistência: js/database.js (IndexedDB) e js/storage.js (cache/compatibilidade).

## 2. Fluxo de inicialização

Tela de login:
1. Carrega bibliotecas (sha256, xlsx, lucide) e módulos (database, storage, auth).
2. Executa Storage.init().
3. Seed de dados padrão se necessário.
4. Libera formulário de autenticação.

Tela principal:
1. App.init() chama Storage.init().
2. Valida sessão via Auth.checkAuth().
3. Configura navegação, listeners e seção inicial (dashboard).

## 3. Módulos principais

## database.js
- Inicializa IndexedDB e object stores.
- CRUD genérico.
- Consultas de produto e SKU.
- Gestão de lixeira (soft delete com retenção de 30 dias).
- Backup/restore ZIP e exportação XLSX.

## storage.js
- Cache in-memory para APIs legadas síncronas.
- Ponte entre módulos antigos e IndexedDB.
- Camada de deleção lógica com envio para lixeira.

## auth.js
- Login com hash SHA-256.
- Sessão via sessionStorage.
- Guards de autenticação/autorização.

## categories.js
- Regras de negócio de categorias.
- Validação de unicidade de nome/prefixo.

## promotions.js
- Promoções por produto.
- Cupons com regras de validade, uso e categoria.

## filemanager.js
- Upload de binários por produto.
- Galeria, miniaturas e ZIP por produto.

## calculator.js
- Cálculo de custos e preço sugerido.

## dashboard.js
- KPIs e gráficos.
- Alertas de estoque.
- KPIs financeiros expandidos (gastos, resultado líquido e valores a receber).

## app.js
- Controlador principal da interface.
- Renderização de listas, modais e ações do usuário.
- Módulos funcionais de vendas, clientes, gastos e lixeira.

## 4. Stores de dados (IndexedDB)

Stores ativas:
- users
- settings
- categories
- products
- product_files
- promotions
- coupons
- sales
- clients
- expenses
- trash

Observações de modelagem:
- `sales` armazena metadados de canal, cidade, tipo/status de pagamento e valores devidos.
- `clients` pode ser atualizado automaticamente a partir de vendas.
- `expenses` permite despesas operacionais gerais (insumos, logística, etc).
- `trash` guarda payload do item excluído e data de expiração (+30 dias).

## 5. Dependências externas

- Chart.js: visualização de indicadores.
- Lucide: ícones.
- JSZip: exportações ZIP.
- SheetJS/XLSX: import/export Excel.
- js-sha256: hash de senha.

## 6. Fluxos críticos

### Exclusão com retenção
1. Ação de excluir chama `Storage.deleteRow` ou `Database.deleteById`.
2. Item é copiado para `trash` com `deleted_at` e `expires_at`.
3. Registro original é removido da store principal.
4. Tela de lixeira permite restaurar ou excluir definitivamente.
5. Na inicialização, itens expirados são removidos automaticamente.

### Venda com atualização de cliente
1. Usuário registra venda com dados comerciais e de cliente.
2. Sistema faz upsert em `clients` por nome/contato.
3. Venda é gravada em `sales` com referência de cliente e financeiro.

### Dashboard financeiro
1. Lê `sales` do mês para receita/lucro.
2. Lê `expenses` do mês para gastos.
3. Calcula resultado líquido e total a receber.

## 7. Escalabilidade

Caminho recomendado para evolução:
- Extrair regras críticas para backend.
- Trocar sessão local por autenticação com token.
- Adotar API REST/GraphQL para dados compartilhados.
- Versionamento de schema de banco com migrações explícitas.
