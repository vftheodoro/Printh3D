begin;

alter table public.coupons
  drop constraint if exists coupons_tipo_desconto_check;
alter table public.promotions
  drop constraint if exists promotions_tipo_desconto_check;

update public.coupons
set tipo_desconto = case tipo_desconto
  when 'percent' then 'percentual'
  when 'fixed' then 'fixo'
  else tipo_desconto
end;

update public.promotions
set tipo_desconto = case tipo_desconto
  when 'percent' then 'percentual'
  when 'fixed' then 'fixo'
  else tipo_desconto
end;

alter table public.coupons
  add constraint coupons_tipo_desconto_check
  check (tipo_desconto in ('percentual', 'fixo'));
alter table public.promotions
  add constraint promotions_tipo_desconto_check
  check (tipo_desconto in ('percentual', 'fixo'));

commit;
