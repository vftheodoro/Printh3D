# Printh3D Pro

Sistema web de gestão para operação comercial de impressão 3D, com autenticação, catálogo técnico/comercial, vendas flexíveis, gestão de clientes, gestão de gastos, promoções/cupons, controle de estoque, upload de arquivos por produto, lixeira com retenção e backup/importação de dados.

## 1) Visão geral

O projeto é um front-end em HTML/CSS/JavaScript puro (sem backend obrigatório) com persistência local via IndexedDB e espelhamento opcional em Pasta Raiz do projeto (arquivos legíveis e recuperáveis manualmente).

Principais objetivos:
- Centralizar operação comercial da gráfica 3D.
- Padronizar cadastro técnico/comercial de produtos.
- Facilitar promoções, cupons e campanhas em redes sociais/marketplaces.
- Controlar receitas, gastos e valores pendentes de recebimento.
- Manter histórico com recuperação de itens excluídos por 30 dias.
- Manter dados locais com exportação/importação de backup.
- Permitir recuperação manual completa por arquivos na raiz selecionada.

## 2) Funcionalidades

### Autenticação e usuários
- Login com sessão em navegador.
- Perfis ADMIN e VENDEDOR.
- CRUD de usuários (ADMIN).

### Catálogo e categorias
- CRUD de categorias com prefixo SKU, ícone e cor.
- Geração automática de SKU por categoria.
- Cadastro de produto com:
  - dados técnicos (peso, tempo, material, dimensões)
  - preço e custo
  - estoque e estoque mínimo
  - tags
  - descrição social geral para todas as redes
  - status ativo/inativo

### Resumo de produto
- Clique no produto para abrir resumo completo.
- Exibe dados técnicos/comerciais e estoque.
- Exibe arquivos vinculados com miniatura e download individual.
- Acesso rápido para editar produto e exportar ZIP.

### Arquivos por produto
- Upload de imagens, modelos 3D e documentos.
- Galeria e download de arquivos.
- Exportação ZIP por produto (ficha + mídias + modelos).

### Vendas e financeiro
- Registro flexível de venda por catálogo ou item personalizado.
- Quantidade, valor unitário e custo unitário livres.
- Canal da venda: TikTok, Shopee, Instagram, WhatsApp ou Outro.
- Cidade da venda com sugestão automática de cidades já usadas.
- Tipo de pagamento, valor pago e valor devido (pendências).
- Aplicação de desconto/cupom (catálogo).
- Cálculo automático de valor final e lucro por venda.
- Filtros por data e vendedor.

### Clientes
- Cadastro automático de cliente a partir das vendas.
- CRUD manual de clientes (nome, Instagram, WhatsApp, cidade, email, observações).
- Filtros de clientes por:
  - ranking (mais compram / menos compram)
  - situação financeira (devem / em dia)
  - tipo de pagamento utilizado

### Gastos
- Aba dedicada para registrar gastos operacionais.
- Categorias abrangentes (filamento, argolas, tintas, peças, transporte, etc).
- Registro com quantidade, valor unitário e total, fornecedor, pagamento, data e observações.
- Filtros por período, categoria e pagamento.

### Promoções e cupons
- Promoções por produto com vigência.
- Cupons com validade, limite de uso e restrição por categoria.

### Dashboard
- KPIs de vendas/lucro/margem/top produto/volume de vendas.
- KPI de promoções ativas e alertas de estoque baixo.
- KPI de gastos do mês.
- KPI de resultado líquido do mês (lucro - gastos).
- KPI de valores a receber (pendências).
- Gráfico de vendas x lucro e distribuição por categoria.

### Lixeira (retenção de 30 dias)
- Exclusões são movidas para a lixeira antes da remoção definitiva.
- Permite restaurar item excluído.
- Permite exclusão definitiva manual.
- Itens expiram automaticamente após 30 dias.

### Backup e importação
- Exportação de backup completo em ZIP.
- Exportação de planilha em XLSX.
- Importação de ZIP de backup completo.
- Importação de planilha para compatibilidade.

### Pasta Raiz (espelho físico de dados)
- Onboarding automático para ADMIN quando o sistema não identifica Pasta Raiz conectada.
- Explica o funcionamento e oferece 2 opções:
  - Sincronizar pasta existente (restaura dados se encontrar backup válido)
  - Criar pasta do zero (gera estrutura e sincroniza o estado atual)
- Sincronização automática após alterações de dados (com debounce) quando a pasta está conectada.
- Botões manuais de sincronização/restauração:
  - Sidebar: "Sincronizar Pasta Raiz"
  - Configurações: conectar, sincronizar agora e restaurar da pasta
- Persistência da pasta autorizada no navegador para reconexão automática (quando a permissão continuar válida).

Estrutura criada na pasta selecionada:
- `printh3d_data/manifest.json`
- `printh3d_data/README.txt`
- `printh3d_data/data/*.json` (users, settings, categories, products, promotions, coupons, sales, clients, expenses, trash, product_files_meta)
- `printh3d_data/files/images|models_3d|documents|others`
- `printh3d_data/config/ui_state.json` (filtros/visualização)
- `printh3d_data/config/session_state.json` (estado de sessão exportado)

## 3) Tecnologias

- HTML5 + CSS3
- JavaScript (IIFE modules)
- IndexedDB (persistência local)
- Chart.js (gráficos)
- Lucide Icons (ícones)
- JSZip (ZIP)
- SheetJS/XLSX (Excel)
- js-sha256 (hash de senha)

## 4) Estrutura do projeto

- index.html: aplicação principal
- login.html: autenticação
- css/style.css: estilos globais
- js/database.js: camada IndexedDB
- js/storage.js: camada de compatibilidade/caching
- js/auth.js: autenticação e sessão
- js/categories.js: regras de categorias
- js/promotions.js: promoções e cupons
- js/filemanager.js: arquivos por produto
- js/calculator.js: cálculo de custo/preço
- js/dashboard.js: KPIs e gráficos
- js/root-storage.js: espelho em Pasta Raiz (sync/restore + onboarding support)
- js/app.js: orquestração da UI
- docs/: documentação completa

## 5) Como executar

Opção simples:
1. Abra login.html no navegador.
2. Faça login.
3. Se for ADMIN e não houver Pasta Raiz conectada, siga o assistente inicial para sincronizar pasta existente ou criar uma nova.

Opção recomendada (ambiente local):
1. Rode um servidor estático local (ex.: extensão Live Server no VS Code).
2. Acesse login.html via http://localhost...

## 6) Acesso padrão

- Email: admin@printh3d.com
- Senha: admin123

## 7) Política de dados e GitHub

Este sistema salva dados operacionais no IndexedDB do navegador e pode manter cópia física em Pasta Raiz escolhida pelo usuário.

Para evitar versionamento acidental de backups/exportações e dados espelhados:
- Foi adicionado um arquivo .gitignore com regras para arquivos de backup (.zip/.xlsx etc).
- Recomenda-se NÃO sincronizar a pasta `printh3d_data/` com repositórios públicos.
- Arquivos de segredos (ex.: .env, .pem, .key, tokens) também estão bloqueados no .gitignore.

Dados sensíveis que **não devem** ir para o GitHub:
- backups/exportações operacionais (ZIP/XLSX/JSON de dados)
- arquivos de ambiente e credenciais
- chaves privadas/certificados
- dumps de banco e logs com dados de cliente

Se algum arquivo de dados já foi rastreado no Git antes:
- Remova do índice e mantenha localmente:
  - git rm --cached NOME_DO_ARQUIVO
  - git commit -m "remove dados locais versionados"

## 8) Documentação completa

- docs/01-arquitetura.md
- docs/02-guia-operacao.md
- docs/03-dados-e-seguranca.md
- docs/04-manutencao.md

## 9) Observações importantes

- Como é um app local/browser, cada navegador/perfil mantém seu próprio IndexedDB.
- O acesso à Pasta Raiz depende da permissão do navegador (File System Access API).
- Para trocar de máquina ou navegador, exporte backup e importe no novo ambiente.
- Se usar Pasta Raiz, leve também a pasta `printh3d_data/` para restaurar manualmente o ambiente.
- Em produção corporativa, recomenda-se backend com controle de acesso centralizado e auditoria.

## 10) Checklist rápido antes de subir para GitHub

1. Rode `git status` e confirme que não há backups/exportações no stage.
2. Garanta que `.env*`, chaves e arquivos de dados não aparecem na lista.
3. Se algum arquivo sensível já foi rastreado, use `git rm --cached <arquivo>`.
4. Revise mudanças de documentação em `README.md` e `docs/`.
