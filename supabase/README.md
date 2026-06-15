# Migrations da Printh3D

As migrations desta pasta preservam os registros existentes e devem ser
aplicadas primeiro em um projeto de validação.

## Processo obrigatório

1. Gerar um backup pelo menu `Admin > Manutenção`.
2. Restaurar o backup em um projeto Supabase de validação.
3. Executar `npx supabase db lint --linked`.
4. Aplicar as migrations com `npx supabase db push --linked`.
5. Validar login, RBAC, vendas, estoque, cupons, lixeira e catálogo público.
6. Testar a restauração do backup antes de promover a migration para produção.

Não aplique a migration diretamente em produção sem confirmar o schema atual,
as políticas RLS e o plano de reversão.
