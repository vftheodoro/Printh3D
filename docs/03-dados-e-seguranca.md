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

## 2. Privacidade e GitHub

Por padrão, o IndexedDB não é versionado no Git.

Risco real de vazamento para GitHub:
- Exportações manuais de backup (ZIP/XLSX) salvas dentro da pasta do projeto.

Mitigação aplicada:
- .gitignore com bloqueio de padrões de backup/exportação.

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

## 5. Limpeza de arquivos já versionados

Se dados já estiverem rastreados no Git:
1. Remova do índice sem apagar local:
   - git rm --cached ARQUIVO
2. Commit da remoção:
   - git commit -m "remove arquivos de dados do versionamento"
3. Confirme que o .gitignore cobre o padrão.

## 6. Recomendações para produção

- Migrar autenticação para backend.
- Implementar controle de sessão por token.
- Aplicar criptografia em repouso para dados sensíveis.
- Registrar logs de auditoria e política de retenção.
