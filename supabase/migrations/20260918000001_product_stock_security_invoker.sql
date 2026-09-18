-- Advisor: Security Definer View on public.product_stock.
-- Recreate as SECURITY INVOKER so it uses the caller's RLS on products/stock_movements.

drop view if exists public.product_stock;

create view public.product_stock
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.unit,
  p.min_stock,
  p.created_at,
  p.updated_at,
  coalesce(sum(
    case
      when m.type = 'in' then m.quantity
      when m.type = 'out' then -m.quantity
      else 0
    end
  ), 0)::numeric(12, 2) as stock
from public.products p
left join public.stock_movements m on m.product_id = p.id
group by p.id;

revoke all on public.product_stock from public, anon;
grant select on public.product_stock to authenticated, service_role;
