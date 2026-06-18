# Migrations da Printh3D

As migrations desta pasta preservam os registros existentes. O projeto remoto
`worebdpqxlyhyijmakpd` está sincronizado até
`20260618164505_add_missing_foreign_key_indexes`.

## Storage

- Imagens públicas: `SUPABASE_STORAGE_BUCKET`, com fallback para
  `printh3d-files`.
- Modelos, documentos e arquivos de venda:
  `SUPABASE_PRIVATE_STORAGE_BUCKET`, com fallback para `printh3d-private`.
- Arquivos privados são entregues pelo admin somente por URLs assinadas de
  curta duração.

## Processo obrigatório

1. Gerar um backup pelo menu `Admin > Manutenção`.
2. Restaurar o backup em um projeto Supabase de validação.
3. Executar `npx supabase db lint --linked`.
4. Aplicar as migrations com `npx supabase db push --linked`.
5. Validar login, RBAC, vendas, estoque, cupons, lixeira e catálogo público.
6. Testar a restauração do backup antes de promover migrations para produção.

Não aplique migrations futuras diretamente em produção sem confirmar o schema,
as políticas RLS e o plano de reversão.
