-- A los 30 días de aprobada se borra el archivo, no el registro.
-- image_archived_at marca que la captura ya no está en Storage.

alter table public.review_submissions
  add column image_archived_at timestamptz;
