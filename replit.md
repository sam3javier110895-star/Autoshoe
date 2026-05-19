# ShoeFlow Manager

Plataforma de automatización WhatsApp para negocios de calzado/productos. Detecta fotos de referencias, consulta grupos de proveedores, recolecta precios y devuelve la mejor oferta.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — corre el API server (puerto 8080, proxied en /api)
- `pnpm --filter @workspace/app run dev` — corre el frontend Vite
- `pnpm run typecheck` — typecheck completo (libs + artifacts)
- `pnpm --filter @workspace/api-spec run codegen` — regenera hooks React Query + esquemas Zod desde OpenAPI
- `pnpm --filter @workspace/db run push-force` — aplica schema al DB (solo dev, no-interactivo)
- Required env: `DATABASE_URL`, `GROQ_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (puerto 8080, rutas bajo `/api`)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + TanStack Query + shadcn/ui + framer-motion
- AI: Groq API (llama-3.3-70b-versatile) — chat en español
- Validación: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (desde spec OpenAPI)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — esquemas Drizzle ORM (whatsapp.ts, groups.ts, automations.ts, contacts.ts, messages.ts)
- `lib/api-spec/openapi.yaml` — spec OpenAPI (fuente de verdad para codegen)
- `lib/api-client-react/src/generated/` — hooks React Query generados
- `lib/api-zod/src/generated/` — esquemas Zod generados
- `artifacts/api-server/src/routes/` — rutas Express (whatsapp, groups, automations, contacts, messages, dashboard, consultas, ai)
- `artifacts/app/src/pages/` — páginas React (Login, Dashboard, WhatsApp, Grupos, Automatizaciones, Reenvios, Disponibilidad, Contactos, Monitor, IA)
- `artifacts/app/src/components/layout.tsx` — sidebar dark con 9 ítems de navegación
- `artifacts/app/src/index.css` — tema dark WhatsApp (#25D366 primario)

## Architecture decisions

- **Contract-first API**: OpenAPI spec define todo, codegen produce hooks y esquemas Zod — no escritura manual de tipos de API.
- **Auth simple localStorage**: login admin/admin guardado en `sf_auth` (sin JWT/cookies), suficiente para demo operacional.
- **WhatsApp sin Baileys en dev**: integración Baileys requiere entorno persistente. La ruta `/api/whatsapp/sessions/:id/qr` genera QR mock — estructura lista para conectar con Baileys en producción.
- **Groq AI en español**: el asistente IA usa `llama-3.3-70b-versatile` con contexto de negocio de calzado, responde en español.
- **Tema siempre dark**: `index.css` define variables CSS dark sin media query, consistente con estética WhatsApp Business.

## Product

- **Dashboard**: métricas en tiempo real (sesiones, grupos, automatizaciones, consultas activas)
- **WhatsApp**: gestión de sesiones multi-número con QR de vinculación
- **Grupos**: catálogo de grupos con categorías (proveedores, clientes, distribuidores)
- **Automatizaciones**: reglas trigger/acción para reenvío y consulta de precios
- **Reenvíos**: historial de mensajes reenviados con estado de entrega
- **Disponibilidad**: respuestas de proveedores con precios y estado (disponible/agotado)
- **Contactos**: directorio de contactos y proveedores
- **Monitor**: actividad en tiempo real de todas las automatizaciones
- **IA**: chat con asistente Groq integrado para consultas del negocio

## User preferences

- Idioma: español (UI, mensajes de error, comentarios)
- Login: admin/admin (localStorage `sf_auth`)
- Tema: siempre dark, color primario #25D366 (WhatsApp green)

## Gotchas

- Siempre ejecutar codegen después de cambiar `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` requiere TTY — usar `push-force` en CI/scripts
- Si hay conflicto de tablas en DB, usar SQL directo via `executeSql` (drizzle-kit push pide TTY para resolver conflictos)
- El API server se monta en `/api` — todas las rutas internas deben ser relativas (sin hardcodear puerto)
- Baileys usa `import()` dinámico — no incluir como import estático o falla typecheck

## Pointers

- Ver `pnpm-workspace` skill para estructura del workspace, TypeScript y detalles de packages
