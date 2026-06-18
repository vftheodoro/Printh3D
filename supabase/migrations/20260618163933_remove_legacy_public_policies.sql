begin;

drop policy if exists "Public can view all categories" on public.categories;
drop policy if exists "Public can view active products" on public.products;

commit;
