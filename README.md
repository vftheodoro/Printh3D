# Printh3D Pro

Sistema web de gestão para operação comercial de impressão 3D, com autenticação, cadastro completo de produtos, categorias, vendas, promoções/cupons, controle de estoque, upload de arquivos por produto e backup/importação de dados.

## 1) Visão geral

O projeto é um front-end em HTML/CSS/JavaScript puro (sem backend obrigatório) com persistência local via IndexedDB.

Principais objetivos:
- Centralizar operação comercial da gráfica 3D.
- Padronizar cadastro técnico/comercial de produtos.
- Facilitar promoções, cupons e campanhas em redes sociais.
- Manter dados locais com exportação/importação de backup.

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
  - descrições para Instagram/Facebook/WhatsApp/TikTok/geral
  - status ativo/inativo

### Arquivos por produto
- Upload de imagens, modelos 3D e documentos.
- Galeria e download de arquivos.
- Exportação ZIP por produto (ficha + mídias + modelos).

### Vendas e financeiro
- Registro de venda por produto.
- Aplicação de desconto/cupom.
- Cálculo de lucro por venda.
- Filtros por data e vendedor.

### Promoções e cupons
- Promoções por produto com vigência.
- Cupons com validade, limite de uso e restrição por categoria.

### Dashboard
- KPIs de vendas/lucro/margem/top produto/volume de vendas.
- KPI de promoções ativas e alertas de estoque baixo.
- Gráfico de vendas x lucro e distribuição por categoria.

### Backup e importação
- Exportação de backup completo em ZIP.
- Exportação de planilha em XLSX.
- Importação de ZIP de backup completo.
- Importação de planilha para compatibilidade.

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
- js/app.js: orquestração da UI
- docs/: documentação completa

## 5) Como executar

Opção simples:
1. Abra login.html no navegador.
2. Faça login.

Opção recomendada (ambiente local):
1. Rode um servidor estático local (ex.: extensão Live Server no VS Code).
2. Acesse login.html via http://localhost...

## 6) Acesso padrão

- Email: admin@printh3d.com
- Senha: admin123

## 7) Política de dados e GitHub

Este sistema salva dados operacionais no IndexedDB do navegador, não em arquivos do repositório.

Para evitar versionamento acidental de backups/exportações:
- Foi adicionado um arquivo .gitignore com regras para arquivos de backup (.zip/.xlsx etc).
- Recomenda-se salvar backups em pastas locais como backups/ ou exports/.

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
- Para trocar de máquina ou navegador, exporte backup e importe no novo ambiente.
- Em produção corporativa, recomenda-se backend com controle de acesso centralizado e auditoria.
