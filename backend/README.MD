# Backend – Sistema de Pedidos por Mesa (Multi-Restaurante)

Backend para pedidos por mesa con división de consumo por ítem (split), multi-restaurante y eventos de dominio para métricas futuras.

## ✅ Requisitos
- Node.js 20+
- PostgreSQL 15+ (local o Docker)

## 🐘 Levantar PostgreSQL con Docker

```bash
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tab_db -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:15

```

## Conectarse a Prostgres
docker exec -it postgres psql -U postgres -d tab_db



## Configurar variables de entorno

Crear/editar backend/.env

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tab_db?schema=public"

## Prisma (migraciones + seed)
```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```
## Ejecutar en desarrollo
npm run dev

Servidor: http://localhost:3001

 ## Ejecutar verificación de API
npx ts-node --transpile-only src/verify-api.ts