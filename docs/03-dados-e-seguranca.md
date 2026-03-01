# 03 - Dados e segurança

## 1. Onde os dados ficam

Os dados operacionais ficam no IndexedDB do navegador, banco local chamado:
- printh3d_pro

Stores principais:
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

## 2. Privacidade e GitHub

Por padrão, o IndexedDB não é versionado no Git.

Risco real de vazamento para GitHub:
- Exportações manuais de backup (ZIP/XLSX) salvas dentro da pasta do projeto.

Mitigação aplicada:
- .gitignore com bloqueio de padrões de backup/exportação.
- .gitignore com bloqueio de arquivos de segredo (.env, .pem, .key, tokens).
- exclusão lógica com retenção na lixeira por 30 dias (evita perda acidental).

Dados sensíveis típicos neste contexto:
- dados de clientes (nome, contato, cidade)
- histórico financeiro (vendas, valores devidos, gastos)
- backups completos (ZIP/XLSX)
- segredos locais de ambiente/chaves

## 3. Autenticação

- Senhas armazenadas com hash SHA-256.
- Sessão em sessionStorage.
- Perfis de acesso ADMIN e VENDEDOR.

Limitações em ambiente sem backend:
- Segurança depende do contexto local do navegador.
- Não há trilha de auditoria centralizada.

## 4. Backup seguro

Boas práticas:
- Salvar backups fora do repositório.
- Não enviar backups por canais inseguros.
- Criptografar arquivos de backup em ambientes sensíveis.
- Evitar salvar backups dentro da pasta versionada do projeto.

## 5. Limpeza de arquivos já versionados

Se dados já estiverem rastreados no Git:
1. Remova do índice sem apagar local:
   - git rm --cached ARQUIVO
2. Commit da remoção:
   - git commit -m "remove arquivos de dados do versionamento"
3. Confirme que o .gitignore cobre o padrão.

Para revisar antes de publicar:
- `git status`
- `git diff --name-only`
- confirmar ausência de arquivos `.env*`, `*.pem`, `*.key`, backups e dumps

## 6. Recomendações para produção

- Migrar autenticação para backend.
- Implementar controle de sessão por token.
- Aplicar criptografia em repouso para dados sensíveis.
- Registrar logs de auditoria e política de retenção.
- Definir política explícita de descarte/anonimização de dados de clientes.
