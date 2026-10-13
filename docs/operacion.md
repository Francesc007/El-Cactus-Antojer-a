# Operación y backups

## Entornos

- Preview/staging: proyecto Supabase de desarrollo + Vercel Preview.
- Producción: proyecto Supabase separado + Vercel Production.

## Backups

1. En Supabase: Database > Backups. Activa PITR si el plan lo permite.
2. Exporta un dump semanal adicional antes de cambios de schema.
3. Conserva migraciones en `supabase/migrations/` como fuente de verdad.

## Recuperación de acceso

1. Si el owner pierde acceso, usa Authentication > Users o `resetPasswordForEmail`.
2. Para promover staff a owner:

```sql
update public.profiles
set role = 'owner', is_active = true
where email = 'correo@negocio.com';
```

## Alertas

- Revisa `notification_outbox` y `notification_attempts` si WhatsApp falla.
- Configura `SENTRY_DSN` para errores de servidor.
- El webhook de Meta apunta a `/api/notifications/whatsapp/webhook` y usa `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

## Dominio

- HTTPS obligatorio.
- `NEXT_PUBLIC_APP_URL` debe ser la URL canónica de producción.

## Reseñas (capturas)

Antes de publicar el código de reseñas, aplica en Supabase la migración `supabase/migrations/20261013000000_review_submissions.sql`. Crea la tabla, las funciones, la bandera de Google y el bucket privado `review-evidence`.

El dueño revisa las capturas en Panel > Clientes > Reseñas. Aprobar no otorga sellos todavía. Si se rechaza una de Google Maps, el cliente puede volver a enviarla.
