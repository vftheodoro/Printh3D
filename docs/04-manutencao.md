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
9. app.js

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

## 5. Troubleshooting

## Login não funciona
- Verificar se login.html carrega database.js.
- Verificar se Storage.init() concluiu antes do submit.
- Verificar credenciais padrão e hash.

## Ícones não aparecem
- Garantir chamada de lucide.createIcons() após renderizações dinâmicas.

## Dados sumiram
- Confirmar navegador/perfil usado.
- Restaurar via backup ZIP/XLSX.

## 6. Checklist antes de publicar

- Validar CRUD de categorias, produtos, vendas, promoções e cupons.
- Testar backup/restore.
- Confirmar .gitignore cobrindo arquivos de dados.
- Revisar README e docs.

## 7. Próximos passos recomendados

- Testes automatizados (unitário e fluxo).
- Pipeline de lint/build.
- Camada backend opcional para multiusuário real.
- Controle de permissões mais granular.
