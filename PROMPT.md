# ShoeFlow Manager — Descripción del Proyecto

## ¿Qué es?

**ShoeFlow Manager** es una plataforma de automatización operativa para negocios de calzado que trabajan con WhatsApp. Permite gestionar múltiples sesiones de WhatsApp, detectar fotos de referencias de zapatos en grupos de clientes, consultar automáticamente a grupos de proveedores, recolectar precios, confirmar disponibilidad y publicar el mejor precio en grupos de ventas — todo sin intervención manual.

## Problema que resuelve

En negocios de calzado colombianos, el flujo típico es:
1. Un cliente envía foto de un zapato en un grupo
2. El dueño del negocio reenvía manualmente la foto a 5-10 grupos de proveedores
3. Espera respuestas con precio y disponibilidad
4. Pregunta si el precio es fijo
5. Copia el número del proveedor que confirmó y lo pega en el grupo del cliente

**ShoeFlow automatiza todo este flujo.**

## Flujo principal del agente

```
Grupo A (clientes) → foto detectada
        ↓ (reenvío cada 15s, lote de 3 fotos)
Grupos B, C, D, E, F (proveedores)
        ↓ (respuesta con precio)
Agente pregunta: "¿Es segura/fija?"
        ↓ (confirmación: "sí", "fija", "dale"...)
Grupo G (publicación)
→ publica: número del proveedor + precio confirmado
```

## Funcionalidades principales

| Módulo | Descripción |
|--------|-------------|
| **WhatsApp** | Gestión multi-sesión con QR, sincronización de grupos |
| **Grupos** | Catálogo de grupos por categoría (proveedores, clientes, distribuidores) |
| **Flujos Agente** | Automatizaciones de 3 fases: reenvío → confirmación → publicación |
| **Automatizaciones** | Reglas trigger/acción para casos simples |
| **Reenvíos** | Historial de mensajes reenviados con estado |
| **Disponibilidad** | Respuestas de proveedores con precios y confirmación |
| **Contactos** | Directorio de proveedores y contactos clave |
| **Monitor** | Actividad en tiempo real de todas las automatizaciones |
| **IA** | Chat en español con Groq (llama-3.3-70b) para consultas del negocio |

## Stack tecnológico

- **Backend**: Node.js 24 + Express 5 + TypeScript
- **Base de datos**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + TanStack Query + shadcn/ui + Framer Motion
- **IA**: Groq API (llama-3.3-70b-versatile) en español
- **API**: Contract-first con OpenAPI spec + Orval codegen
- **Monorepo**: pnpm workspaces

## Cómo correrlo

### Requisitos
- Node.js 24+
- pnpm 9+
- PostgreSQL (ya provisionado en Replit)
- Variables de entorno: `DATABASE_URL`, `GROQ_API_KEY`, `SESSION_SECRET`

### En Replit (recomendado)
Los workflows ya están configurados. Solo presiona **Run**.

### Local
```bash
# Instalar dependencias
pnpm install

# Regenerar tipos desde OpenAPI (si cambias el spec)
pnpm --filter @workspace/api-spec run codegen

# Aplicar esquema de base de datos
pnpm --filter @workspace/db run push-force

# Correr API server (puerto 5000/8080)
pnpm --filter @workspace/api-server run dev

# Correr frontend (en otra terminal)
pnpm --filter @workspace/app run dev
```

### Login
- **Usuario**: `admin`
- **Contraseña**: `admin`

## Cómo usar el flujo principal

1. **WhatsApp** → Crear sesión → Conectar con QR → **Sincronizar Grupos**
2. Los grupos del número sincronizado aparecen en la base de datos
3. **Flujos Agente** → Nuevo Flujo → Configurar 3 fases:
   - Fase 1: seleccionar Grupo A (origen), grupos B-F (proveedores), intervalo y lote
   - Fase 2: configurar pregunta de confirmación y palabras clave ("sí", "fija", "dale")
   - Fase 3: seleccionar Grupo G (publicación) y plantilla del mensaje
4. **Probar** el flujo con la simulación antes de activarlo
5. **Activar** el flujo — el agente opera automáticamente

## Arquitectura de decisiones clave

- **Contract-first API**: el spec OpenAPI es la fuente de verdad; los hooks React Query y schemas Zod se generan automáticamente
- **WhatsApp multi-sesión**: cada número de WhatsApp es una sesión independiente con sus propios grupos
- **Flujos de 3 fases**: encadenamiento consulta → diálogo de confirmación → publicación, configurable por el usuario
- **IA contextualizada**: el asistente Groq conoce el negocio de calzado y responde en español
- **Tema dark permanente**: paleta WhatsApp (#25D366) sin modo claro

## Estructura del proyecto

```
artifacts/
  api-server/       # Backend Express (rutas, lógica de negocio)
  app/              # Frontend React (páginas, componentes)
lib/
  db/               # Esquemas Drizzle ORM + conexión PostgreSQL
  api-spec/         # OpenAPI YAML (fuente de verdad)
  api-client-react/ # Hooks React Query generados (no editar)
  api-zod/          # Schemas Zod generados (no editar)
```
