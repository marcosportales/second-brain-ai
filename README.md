# Second Brain AI

Second Brain AI es una app fullstack en Next.js (App Router) para crear un asistente personal sobre documentos del usuario.

El producto permite:
- autenticación con credenciales,
- subida y gestión de documentos (PDF, DOCX, TXT, MD),
- indexación de contenido con embeddings,
- chat con recuperación semántica (RAG) y streaming,
- respuestas con citas de fragmentos fuente.

## Qué problema resuelve

Centraliza conocimiento personal/profesional en una base consultable por lenguaje natural.  
Cada usuario solo puede acceder a sus propios chats y documentos.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Auth.js (credentials)
- PostgreSQL + pgvector
- Drizzle ORM
- Vercel AI SDK + OpenAI

## Arquitectura (visión general)

Estructura principal:
- `app/`: rutas UI y API (App Router).
- `components/`: componentes cliente por dominio (`auth`, `chat`, `documents`).
- `lib/`: lógica de negocio e infraestructura.
  - `lib/auth`: sesión, hashing y config de auth.
  - `lib/db`: cliente Drizzle y esquema.
  - `lib/ingestion`: parseo, chunking e indexación.
  - `lib/rag`: recuperación y construcción de prompt.
  - `lib/ai`: cliente/modelos AI y generación de título.
  - `lib/security`: rate limit.
  - `lib/http` y `lib/errors`: utilidades de errores de rutas.

## Flujo funcional

1. El usuario inicia sesión o se registra.
2. Sube un documento en `/documents`.
3. El backend parsea el archivo, lo fragmenta y calcula embeddings.
4. Se persisten chunks y embeddings en PostgreSQL/pgvector.
5. En `/chat`, cada pregunta recupera chunks relevantes (`RAG_TOP_K`).
6. Se construye el prompt con contexto y se streammea la respuesta.
7. Mensajes y metadatos (estado, citas, tokens) quedan persistidos.

## Variables de entorno
Copiar `.env.example` a `.env` y completar los valores:

```bash
cp .env.example .env
```

Variables validadas por la app:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AI_PROVIDER` (`openai` u `ollama`)
- `OPENAI_API_KEY` (obligatoria si `AI_PROVIDER=openai`)
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `OLLAMA_BASE_URL`
- `OLLAMA_CHAT_MODEL`
- `OLLAMA_EMBEDDING_MODEL`
- `RAG_TOP_K`
- `MAX_UPLOAD_SIZE_MB`

## Setup local
1. Levantar Postgres con pgvector:
```bash
docker compose up -d db
```
2. Instalar dependencias:
```bash
pnpm install
```
3. Migrar base de datos:
```bash
pnpm db:migrate
```
4. Ejecutar app:
```bash
pnpm dev
```

## Scripts disponibles
- `pnpm dev`: entorno local.
- `pnpm build`: build de producción.
- `pnpm start`: servir build.
- `pnpm lint`: linting.
- `pnpm db:generate`: generar migraciones con Drizzle.
- `pnpm db:migrate`: aplicar migraciones.

## Flujo de uso (MVP)
1. Crear cuenta en `/login`.
2. Subir documento en `/documents` (se indexa al subir).
3. Ir a `/chat` y preguntar sobre el contenido.
4. Ver respuestas con streaming e historial persistido.

## Endpoints clave
- `POST /api/auth/register`
- `POST /api/chat`
- `GET /api/chats`
- `DELETE /api/chats/:id`
- `GET /api/chats/:id/messages`
- `GET /api/documents`
- `DELETE /api/documents/:id`
- `POST /api/documents/upload`
- `POST /api/documents/:id/index`

## Docker full stack
```bash
docker compose up --build
```

## Notas de coste/operación
- `OPENAI_EMBEDDING_MODEL=text-embedding-3-small` por defecto (coste bajo).
- `RAG_TOP_K` configurable para controlar latencia y tokens.
- Logging estructurado en `lib/observability/logger.ts`.
- Rate limit en memoria por proceso (útil para local/MVP; no distribuido).
