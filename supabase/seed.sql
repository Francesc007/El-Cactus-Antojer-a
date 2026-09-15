insert into public.business_settings (id, total_capacity, default_duration_minutes)
values (1, 50, 120)
on conflict (id) do update
set
  total_capacity = excluded.total_capacity,
  default_duration_minutes = excluded.default_duration_minutes;

insert into public.operating_hours (day_of_week, open_time, close_time, label, is_closed)
values
  (0, '14:00', '21:00', 'Domingo', false),
  (1, '00:00', '00:01', 'Lunes', true),
  (2, '00:00', '00:01', 'Martes', true),
  (3, '00:00', '00:01', 'Miércoles', true),
  (4, '00:00', '00:01', 'Jueves', true),
  (5, '16:00', '22:00', 'Viernes', false),
  (6, '16:00', '22:00', 'Sábado', false)
on conflict (day_of_week) do update
set
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  label = excluded.label,
  is_closed = excluded.is_closed;

insert into public.products (id, name, unit, min_stock)
values
  ('11111111-1111-4111-8111-111111111001', 'Pechuga de pollo', 'kg', 5),
  ('11111111-1111-4111-8111-111111111002', 'Aceite vegetal', 'lt', 3),
  ('11111111-1111-4111-8111-111111111003', 'Servilletas', 'paquete', 10),
  ('11111111-1111-4111-8111-111111111004', 'Tortillas de maíz', 'kg', 8),
  ('11111111-1111-4111-8111-111111111005', 'Cebolla blanca', 'kg', 4),
  ('11111111-1111-4111-8111-111111111006', 'Tomate rojo', 'kg', 6),
  ('11111111-1111-4111-8111-111111111007', 'Queso Oaxaca', 'kg', 3),
  ('11111111-1111-4111-8111-111111111008', 'Refrescos 600ml', 'pieza', 24),
  ('11111111-1111-4111-8111-111111111009', 'Aguacate', 'kg', 5),
  ('11111111-1111-4111-8111-111111111010', 'Harina de trigo', 'kg', 10)
on conflict (id) do nothing;

insert into public.stock_movements (product_id, type, quantity, date, note)
values
  ('11111111-1111-4111-8111-111111111001', 'in', 25, current_date - 12, 'Seed'),
  ('11111111-1111-4111-8111-111111111001', 'out', 5, current_date - 10, 'Preparación semanal'),
  ('11111111-1111-4111-8111-111111111001', 'out', 8, current_date - 7, null),
  ('11111111-1111-4111-8111-111111111001', 'out', 6, current_date - 4, null),
  ('11111111-1111-4111-8111-111111111001', 'out', 3, current_date - 1, null),
  ('11111111-1111-4111-8111-111111111002', 'in', 10, current_date - 14, 'Seed'),
  ('11111111-1111-4111-8111-111111111002', 'out', 2, current_date - 8, null),
  ('11111111-1111-4111-8111-111111111002', 'out', 3, current_date - 5, null),
  ('11111111-1111-4111-8111-111111111002', 'out', 1, current_date - 2, null),
  ('11111111-1111-4111-8111-111111111003', 'in', 15, current_date - 11, 'Seed'),
  ('11111111-1111-4111-8111-111111111003', 'out', 8, current_date - 6, null),
  ('11111111-1111-4111-8111-111111111003', 'out', 5, current_date - 3, null),
  ('11111111-1111-4111-8111-111111111004', 'in', 20, current_date - 9, 'Seed'),
  ('11111111-1111-4111-8111-111111111004', 'out', 6, current_date - 5, null),
  ('11111111-1111-4111-8111-111111111004', 'out', 4, current_date - 1, null),
  ('11111111-1111-4111-8111-111111111005', 'in', 8, current_date - 10, 'Seed'),
  ('11111111-1111-4111-8111-111111111005', 'out', 3, current_date - 6, null),
  ('11111111-1111-4111-8111-111111111005', 'out', 4, current_date - 2, null),
  ('11111111-1111-4111-8111-111111111006', 'in', 12, current_date - 8, 'Seed'),
  ('11111111-1111-4111-8111-111111111006', 'out', 4, current_date - 3, null),
  ('11111111-1111-4111-8111-111111111007', 'in', 6, current_date - 7, 'Seed'),
  ('11111111-1111-4111-8111-111111111007', 'out', 4, current_date - 2, 'Enchiladas'),
  ('11111111-1111-4111-8111-111111111008', 'in', 48, current_date - 13, 'Seed'),
  ('11111111-1111-4111-8111-111111111008', 'out', 20, current_date - 4, null),
  ('11111111-1111-4111-8111-111111111009', 'in', 10, current_date - 6, 'Seed'),
  ('11111111-1111-4111-8111-111111111009', 'out', 7, current_date - 1, null),
  ('11111111-1111-4111-8111-111111111010', 'in', 25, current_date - 15, 'Seed'),
  ('11111111-1111-4111-8111-111111111010', 'out', 10, current_date - 5, null);
