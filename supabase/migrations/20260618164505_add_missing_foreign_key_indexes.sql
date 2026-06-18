begin;

create index if not exists product_files_product_idx
  on public.product_files (product_id);
create index if not exists promotions_product_idx
  on public.promotions (product_id);
create index if not exists sale_files_sale_idx
  on public.sale_files (sale_id);
create index if not exists sales_seller_idx
  on public.sales (vendedor_id)
  where vendedor_id is not null;

commit;
