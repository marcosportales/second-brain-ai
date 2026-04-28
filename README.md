# Second Brain AI

MVP fullstack en Next.js para:
- autenticación de usuarios,
- subida de documentos (PDF, DOCX, TXT, MD),
- indexación con embeddings,
- chat con RAG + streaming,
- citas de fuentes.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Auth.js (credentials)
- PostgreSQL + pgvector
- Drizzle ORM
- Vercel AI SDK + OpenAI

## Variables de entorno
Copiar `.env.example` a `.env` y completar:

```bash
cp .env.example .env
```

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

## Flujo MVP
1. Crear cuenta en `/login`.
2. Subir documento en `/documents` (se indexa al subir).
3. Ir a `/chat` y preguntar sobre el contenido.
4. Ver respuestas con streaming e historial persistido.

## Endpoints clave
- `POST /api/auth/register`
- `POST /api/chat`
- `GET /api/chats`
- `GET /api/chats/:id/messages`
- `POST /api/documents/upload`
- `POST /api/documents/:id/index`
- `GET /api/documents`

## Docker full stack
```bash
docker compose up --build
```

## Notas de coste/operación
- `OPENAI_EMBEDDING_MODEL=text-embedding-3-small` por defecto (coste bajo).
- `RAG_TOP_K` configurable para controlar latencia y tokens.
- Logging estructurado en `lib/observability/logger.ts`.
