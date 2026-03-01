# 04 - Manutenção e desenvolvimento

## 1. Convenções do projeto

- JavaScript modular em IIFE.
- Estilo visual centralizado em css/style.css.
- Evitar dependência de backend para fluxos básicos.

## 2. Ordem de scripts (index)

A ordem correta de carregamento é crítica:
1. database.js
2. storage.js
3. auth.js
4. calculator.js
5. categories.js
6. promotions.js
7. filemanager.js
8. dashboard.js
9. root-storage.js
10. app.js

Observação:
- Novas funcionalidades (clientes, gastos, lixeira e Pasta Raiz) estão no fluxo coberto por `database.js`, `storage.js`, `root-storage.js` e `app.js`.

## 3. Ordem de scripts (login)

1. database.js
2. storage.js
3. auth.js

## 4. Adicionar novo campo em produto

Passos mínimos:
1. Ajustar schema lógico em database.js (objeto product salvo).
2. Ajustar criação/edição em app.js.
3. Ajustar visual em index.html e css/style.css.
4. Ajustar exportações (ZIP/XLSX) se necessário.

## 5. Adicionar novo domínio (ex.: gastos)

Passos recomendados:
1. Criar store em `database.js` (índices + export/import).
2. Incluir no cache em `storage.js`.
3. Criar seção no `index.html`.
4. Implementar render/modal/CRUD em `app.js`.
5. Atualizar KPIs em `dashboard.js` quando impactar indicadores.
6. Atualizar README e docs.

## 6. Troubleshooting

## Login não funciona
- Verificar se login.html carrega database.js.
- Verificar se Storage.init() concluiu antes do submit.
- Verificar credenciais padrão e hash.

## Ícones não aparecem
- Garantir chamada de lucide.createIcons() após renderizações dinâmicas.

## Dados sumiram
- Confirmar navegador/perfil usado.
- Restaurar via backup ZIP/XLSX.
- Se houver Pasta Raiz conectada, usar "Restaurar da Pasta" em Configurações.

## Onboarding da Pasta Raiz aparece sempre
- Verificar se o navegador manteve permissão para a pasta selecionada.
- Reautorizar a pasta pelo assistente inicial quando necessário.
- Confirmar se `printh3d_data/` existe e se há permissão de leitura/escrita.

## Item excluído por engano
- Acessar aba Lixeira.
- Restaurar item dentro de até 30 dias.

## 7. Checklist antes de publicar

- Validar CRUD de categorias, produtos, vendas, clientes, gastos, promoções e cupons.
- Validar fluxo de lixeira (restaurar/excluir definitivo).
- Testar backup/restore.
- Testar conexão/sincronização/restauração de Pasta Raiz.
- Confirmar .gitignore cobrindo arquivos de dados.
- Confirmar bloqueio de segredos (`.env*`, chaves e certificados).
- Rodar `git status` e revisar mudanças antes de commit.
- Revisar README e docs.

## 8. Próximos passos recomendados

- Testes automatizados (unitário e fluxo).
- Pipeline de lint/build.
- Camada backend opcional para multiusuário real.
- Controle de permissões mais granular.
