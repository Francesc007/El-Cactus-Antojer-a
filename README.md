# El Cactus Antojería

Plataforma de reservas e inventario para El Cactus Antojería.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth)
- Vercel para hosting

## Arranque local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `.env.local` con las claves de tu proyecto Supabase.

## Base de datos

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En SQL Editor, ejecuta `supabase/migrations/20260915000000_initial_schema.sql`.
3. En desarrollo, ejecuta también `supabase/seed.sql`.
4. Crea el primer usuario en Authentication > Users.
   - El primer perfil se convierte en `owner` activo.
   - Los siguientes quedan como `staff` inactivos hasta activarlos en `profiles`.

## Variables de entorno

Ver `.env.example`. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` ni tokens de WhatsApp al cliente.

## Producción

1. Conecta el repo a Vercel.
2. Define variables de Preview (staging) y Production.
3. Ejecuta la migración en el proyecto de producción **sin** seed de demo.
4. Confirma dominio HTTPS, backups de Supabase y el usuario owner.
5. Prueba en staging: reserva pública, doble reserva simultánea, login, cambio de estado, movimiento de inventario.

### Checklist de salida

- Reservas e inventario persisten entre dispositivos.
- `/panel` exige sesión activa.
- WhatsApp usa `wa.me` registrado en outbox; Cloud API se activa después con `NOTIFICATION_PROVIDER=whatsapp_cloud`.
- CI verde: `lint`, `typecheck`, `test`, `build`.

## Scripts

- `npm run dev`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e` (requiere `npx playwright install chromium`)
- `npm run build`

## Privacidad

El aviso público está en `/privacidad`. Las reservas requieren consentimiento explícito del teléfono.

## PWA

El service worker de `public/sw.js` no se registra en el primer lanzamiento para no cachear datos operativos.
