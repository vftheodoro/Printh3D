begin;

alter table public.product_files
  add column if not exists storage_bucket text,
  add column if not exists storage_object_path text,
  add column if not exists is_public boolean not null default false;

alter table public.sale_files
  add column if not exists tipo text not null default 'document',
  add column if not exists tamanho_bytes bigint not null default 0,
  add column if not exists storage_bucket text,
  add column if not exists storage_object_path text,
  add column if not exists is_public boolean not null default false;

update public.product_files
set
  storage_bucket = coalesce(
    storage_bucket,
    substring(storage_path from '/object/public/([^/]+)/')
  ),
  storage_object_path = coalesce(
    storage_object_path,
    regexp_replace(storage_path, '^.*/object/public/[^/]+/', '')
  ),
  is_public = tipo = 'image'
where storage_bucket is null
   or storage_object_path is null
   or is_public is distinct from (tipo = 'image');

update public.product_files
set
  storage_bucket = 'printh3d-private',
  storage_path = storage_object_path,
  is_public = false
where tipo <> 'image';

update public.sale_files
set
  storage_bucket = 'printh3d-private',
  storage_object_path = coalesce(
    storage_object_path,
    regexp_replace(storage_path, '^.*/object/public/[^/]+/', '')
  ),
  storage_path = coalesce(
    storage_object_path,
    regexp_replace(storage_path, '^.*/object/public/[^/]+/', '')
  ),
  is_public = false
where storage_bucket is null or storage_object_path is null or is_public;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_files_size_non_negative'
  ) then
    alter table public.product_files
      add constraint product_files_size_non_negative
      check (coalesce(tamanho_bytes, 0) >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'sale_files_size_non_negative'
  ) then
    alter table public.sale_files
      add constraint sale_files_size_non_negative
      check (tamanho_bytes >= 0);
  end if;
end
$$;

drop policy if exists public_active_product_files on public.product_files;
create policy public_active_product_files
  on public.product_files
  for select
  to anon, authenticated
  using (
    tipo = 'image'
    and is_public = true
    and exists (
      select 1
      from public.products
      where products.id = product_files.product_id
        and products.ativo = true
    )
  );

grant all on table public.admin_users to service_role;
grant all on table public.categories to service_role;
grant all on table public.products to service_role;
grant all on table public.product_files to service_role;
grant all on table public.sales to service_role;
grant all on table public.sale_files to service_role;
grant all on table public.clients to service_role;
grant all on table public.expenses to service_role;
grant all on table public.promotions to service_role;
grant all on table public.coupons to service_role;
grant all on table public.settings to service_role;
grant all on table public.trash to service_role;
grant all on table public.admin_login_attempts to service_role;
grant select, insert on table public.audit_logs to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.admin_save_sale(
  p_payload jsonb,
  p_sale_id integer default null
)
returns public.sales
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_sale public.sales%rowtype;
  saved_sale public.sales%rowtype;
  selected_product public.products%rowtype;
  selected_coupon public.coupons%rowtype;
  quantity integer := greatest(coalesce((p_payload->>'quantidade')::integer, 1), 1);
  product_id_value integer := nullif(p_payload->>'product_id', '')::integer;
  coupon_id_value integer := nullif(p_payload->>'cupom_id', '')::integer;
  requested_value numeric(12, 2) := greatest(coalesce((p_payload->>'valor_venda')::numeric, 0), 0);
  unit_price numeric(12, 2) := greatest(coalesce((p_payload->>'preco_unitario')::numeric, 0), 0);
  unit_cost numeric(12, 2) := greatest(coalesce((p_payload->>'custo_unitario')::numeric, 0), 0);
  base_value numeric(12, 2);
  discount_value numeric(12, 2) := 0;
  discount_percent numeric(8, 2) := 0;
  final_value numeric(12, 2);
  due_value numeric(12, 2);
begin
  if p_sale_id is not null then
    select * into existing_sale
    from public.sales
    where id = p_sale_id
    for update;

    if not found then
      raise exception 'Venda não encontrada.';
    end if;

    if existing_sale.product_id is not null then
      update public.products
      set quantidade_estoque =
        quantidade_estoque + greatest(existing_sale.quantidade, 1)
      where id = existing_sale.product_id;
    end if;

    if existing_sale.cupom_id is not null
      and existing_sale.cupom_id is distinct from coupon_id_value then
      update public.coupons
      set usos_realizados = greatest(usos_realizados - 1, 0)
      where id = existing_sale.cupom_id;
    end if;
  end if;

  if product_id_value is not null then
    select * into selected_product
    from public.products
    where id = product_id_value and ativo = true
    for update;

    if not found then
      raise exception 'Produto indisponível.';
    end if;

    if selected_product.quantidade_estoque < quantity then
      raise exception 'Estoque insuficiente para esta venda.';
    end if;

    unit_price := greatest(
      case
        when coalesce(selected_product.preco_promocional, 0) > 0
          then selected_product.preco_promocional
        else coalesce(selected_product.preco_venda, 0)
      end,
      0
    );
    unit_cost := greatest(coalesce(selected_product.custo_total, 0), 0);
    base_value := unit_price * quantity;
  else
    if unit_price <= 0 and requested_value > 0 then
      unit_price := round(requested_value / quantity, 2);
    end if;
    base_value := case
      when requested_value > 0 then requested_value
      else unit_price * quantity
    end;
  end if;

  if coupon_id_value is not null then
    select * into selected_coupon
    from public.coupons
    where id = coupon_id_value
    for update;

    if not found
      or not selected_coupon.ativo
      or (
        selected_coupon.data_validade is not null
        and selected_coupon.data_validade < now()
      )
      or (
        coalesce(selected_coupon.limite_usos, 0) > 0
        and selected_coupon.usos_realizados >= selected_coupon.limite_usos
        and (
          p_sale_id is null
          or existing_sale.cupom_id is distinct from coupon_id_value
        )
      ) then
      raise exception 'Cupom inválido, expirado ou esgotado.';
    end if;

    if selected_coupon.categorias is not null
      and product_id_value is not null
      and not (selected_product.category_id = any(selected_coupon.categorias)) then
      raise exception 'Cupom não permitido para a categoria do produto.';
    end if;

    if selected_coupon.tipo_desconto = 'percentual' then
      discount_percent := least(greatest(selected_coupon.valor_desconto, 0), 100);
      discount_value := base_value * discount_percent / 100;
    else
      discount_value := least(greatest(selected_coupon.valor_desconto, 0), base_value);
      discount_percent := case
        when base_value > 0 then discount_value / base_value * 100
        else 0
      end;
    end if;
  end if;

  final_value := greatest(base_value - discount_value, 0);
  due_value := least(
    greatest(coalesce((p_payload->>'valor_devido')::numeric, 0), 0),
    final_value
  );

  if p_sale_id is null then
    insert into public.sales (
      cliente,
      cliente_id,
      item_nome,
      product_id,
      vendedor_id,
      cupom_id,
      desconto_percentual,
      desconto_valor,
      valor_venda,
      valor_devido,
      tipo_pagamento,
      parcelas,
      data_venda,
      lucro,
      observacoes,
      quantidade,
      preco_unitario,
      custo_unitario
    )
    values (
      coalesce(nullif(trim(p_payload->>'cliente'), ''), 'Desconhecido'),
      nullif(p_payload->>'cliente_id', '')::integer,
      coalesce(
        nullif(trim(p_payload->>'item_nome'), ''),
        nullif(selected_product.nome, ''),
        'Item sem nome'
      ),
      product_id_value,
      nullif(p_payload->>'vendedor_id', '')::integer,
      coupon_id_value,
      round(discount_percent, 2),
      round(discount_value, 2),
      round(final_value, 2),
      round(due_value, 2),
      coalesce(nullif(p_payload->>'tipo_pagamento', ''), 'PIX'),
      greatest(coalesce((p_payload->>'parcelas')::integer, 1), 1),
      coalesce((p_payload->>'data_venda')::timestamptz, now()),
      round(final_value - (unit_cost * quantity), 2),
      nullif(p_payload->>'observacoes', ''),
      quantity,
      unit_price,
      unit_cost
    )
    returning * into saved_sale;
  else
    update public.sales
    set
      cliente = coalesce(nullif(trim(p_payload->>'cliente'), ''), 'Desconhecido'),
      cliente_id = nullif(p_payload->>'cliente_id', '')::integer,
      item_nome = coalesce(
        nullif(trim(p_payload->>'item_nome'), ''),
        nullif(selected_product.nome, ''),
        'Item sem nome'
      ),
      product_id = product_id_value,
      vendedor_id = coalesce(
        nullif(p_payload->>'vendedor_id', '')::integer,
        existing_sale.vendedor_id
      ),
      cupom_id = coupon_id_value,
      desconto_percentual = round(discount_percent, 2),
      desconto_valor = round(discount_value, 2),
      valor_venda = round(final_value, 2),
      valor_devido = round(due_value, 2),
      tipo_pagamento = coalesce(nullif(p_payload->>'tipo_pagamento', ''), 'PIX'),
      parcelas = greatest(coalesce((p_payload->>'parcelas')::integer, 1), 1),
      data_venda = coalesce(
        (p_payload->>'data_venda')::timestamptz,
        existing_sale.data_venda
      ),
      lucro = round(final_value - (unit_cost * quantity), 2),
      observacoes = nullif(p_payload->>'observacoes', ''),
      quantidade = quantity,
      preco_unitario = unit_price,
      custo_unitario = unit_cost
    where id = p_sale_id
    returning * into saved_sale;
  end if;

  if product_id_value is not null then
    update public.products
    set quantidade_estoque = quantidade_estoque - quantity
    where id = product_id_value;
  end if;

  if coupon_id_value is not null
    and (
      p_sale_id is null
      or existing_sale.cupom_id is distinct from coupon_id_value
    ) then
    update public.coupons
    set usos_realizados = usos_realizados + 1
    where id = coupon_id_value;
  end if;

  return saved_sale;
end;
$$;

create or replace function public.admin_delete_sale_to_trash(p_sale_id integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_sale public.sales%rowtype;
  related_files jsonb;
begin
  select * into selected_sale
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Venda não encontrada.';
  end if;

  select coalesce(jsonb_agg(to_jsonb(file_row)), '[]'::jsonb)
  into related_files
  from public.sale_files file_row
  where file_row.sale_id = p_sale_id;

  insert into public.trash (
    source_store,
    source_id,
    item_name,
    payload,
    expires_at
  )
  values (
    'sales',
    selected_sale.id,
    selected_sale.cliente || ' - ' || selected_sale.item_nome,
    jsonb_build_object(
      'record', to_jsonb(selected_sale),
      'files', related_files
    ),
    now() + interval '30 days'
  );

  if selected_sale.product_id is not null then
    update public.products
    set quantidade_estoque =
      quantidade_estoque + greatest(selected_sale.quantidade, 1)
    where id = selected_sale.product_id;
  end if;

  if selected_sale.cupom_id is not null then
    update public.coupons
    set usos_realizados = greatest(usos_realizados - 1, 0)
    where id = selected_sale.cupom_id;
  end if;

  delete from public.sale_files where sale_id = p_sale_id;
  delete from public.sales where id = p_sale_id;
end;
$$;

create or replace function public.admin_delete_record_to_trash(
  p_source_store text,
  p_source_id integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_product public.products%rowtype;
  selected_expense public.expenses%rowtype;
  related_files jsonb;
begin
  case p_source_store
    when 'products' then
      select * into selected_product
      from public.products
      where id = p_source_id
      for update;

      if not found then
        raise exception 'Produto não encontrado.';
      end if;

      if exists (
        select 1 from public.products
        where parent_product_id = p_source_id
      ) then
        raise exception 'Remova ou altere as variações antes de excluir o produto.';
      end if;

      if exists (
        select 1 from public.sales
        where product_id = p_source_id
      ) then
        raise exception 'Produtos com vendas vinculadas não podem ser excluídos.';
      end if;

      select coalesce(jsonb_agg(to_jsonb(file_row)), '[]'::jsonb)
      into related_files
      from public.product_files file_row
      where file_row.product_id = p_source_id;

      insert into public.trash (
        source_store,
        source_id,
        item_name,
        payload,
        expires_at
      )
      values (
        'products',
        selected_product.id,
        selected_product.nome,
        jsonb_build_object(
          'record', to_jsonb(selected_product),
          'files', related_files
        ),
        now() + interval '30 days'
      );

      update public.products
      set cover_file_id = null
      where id = p_source_id;

      delete from public.product_files where product_id = p_source_id;
      delete from public.products where id = p_source_id;

    when 'expenses' then
      select * into selected_expense
      from public.expenses
      where id = p_source_id
      for update;

      if not found then
        raise exception 'Gasto não encontrado.';
      end if;

      insert into public.trash (
        source_store,
        source_id,
        item_name,
        payload,
        expires_at
      )
      values (
        'expenses',
        selected_expense.id,
        'Gasto: ' || selected_expense.descricao,
        jsonb_build_object('record', to_jsonb(selected_expense)),
        now() + interval '30 days'
      );

      delete from public.expenses where id = p_source_id;

    else
      raise exception 'Origem da lixeira não permitida.';
  end case;
end;
$$;

create or replace function public.admin_restore_trash(p_trash_id integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item public.trash%rowtype;
  record_payload jsonb;
  files_payload jsonb;
  file_payload jsonb;
  product_record public.products%rowtype;
  sale_record public.sales%rowtype;
  expense_record public.expenses%rowtype;
  product_cover_id integer;
begin
  select * into item
  from public.trash
  where id = p_trash_id
  for update;

  if not found then
    raise exception 'Item não encontrado na lixeira.';
  end if;

  record_payload := case
    when item.payload ? 'record' then item.payload->'record'
    else item.payload
  end;
  files_payload := coalesce(item.payload->'files', '[]'::jsonb);

  case item.source_store
    when 'products' then
      product_cover_id := nullif(record_payload->>'cover_file_id', '')::integer;
      record_payload := jsonb_set(
        record_payload,
        '{cover_file_id}',
        'null'::jsonb,
        true
      );
      product_record := jsonb_populate_record(null::public.products, record_payload);
      insert into public.products select product_record.*;

      for file_payload in
        select value from jsonb_array_elements(files_payload)
      loop
        insert into public.product_files
        select (
          jsonb_populate_record(null::public.product_files, file_payload)
        ).*;
      end loop;

      if product_cover_id is not null then
        update public.products
        set cover_file_id = product_cover_id
        where id = product_record.id;
      end if;

    when 'sales' then
      sale_record := jsonb_populate_record(null::public.sales, record_payload);

      if sale_record.product_id is not null then
        perform 1
        from public.products
        where id = sale_record.product_id
          and quantidade_estoque >= greatest(sale_record.quantidade, 1)
        for update;

        if not found then
          raise exception 'Estoque insuficiente para restaurar a venda.';
        end if;

        update public.products
        set quantidade_estoque =
          quantidade_estoque - greatest(sale_record.quantidade, 1)
        where id = sale_record.product_id;
      end if;

      if sale_record.cupom_id is not null then
        perform 1
        from public.coupons
        where id = sale_record.cupom_id
        for update;

        if not found then
          raise exception 'O cupom vinculado à venda não existe mais.';
        end if;

        update public.coupons
        set usos_realizados = usos_realizados + 1
        where id = sale_record.cupom_id;
      end if;

      insert into public.sales select sale_record.*;

      for file_payload in
        select value from jsonb_array_elements(files_payload)
      loop
        insert into public.sale_files
        select (
          jsonb_populate_record(null::public.sale_files, file_payload)
        ).*;
      end loop;

    when 'expenses' then
      expense_record := jsonb_populate_record(null::public.expenses, record_payload);
      insert into public.expenses select expense_record.*;

    else
      raise exception 'Origem da lixeira não permitida.';
  end case;

  delete from public.trash where id = p_trash_id;
end;
$$;

revoke all on function public.admin_save_sale(jsonb, integer)
  from public, anon, authenticated;
revoke all on function public.admin_delete_sale_to_trash(integer)
  from public, anon, authenticated;
revoke all on function public.admin_delete_record_to_trash(text, integer)
  from public, anon, authenticated;
revoke all on function public.admin_restore_trash(integer)
  from public, anon, authenticated;

grant execute on function public.admin_save_sale(jsonb, integer)
  to service_role;
grant execute on function public.admin_delete_sale_to_trash(integer)
  to service_role;
grant execute on function public.admin_delete_record_to_trash(text, integer)
  to service_role;
grant execute on function public.admin_restore_trash(integer)
  to service_role;

commit;
