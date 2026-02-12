---
description: Documentar cambios
---

Instrucciones obligatorias para antigravity
# Instrucciones obligatorias para Antigravity (Backend + Documentación)
## Objetivo
Cada cambio en el backend debe quedar reflejado también en la documentación del proyecto, para mantener el repositorio consistente y fácil de usar para el equipo.
---
## Reglas generales (OBLIGATORIAS)
1) **No implementes cambios sin actualizar la documentación correspondiente.**
2) **Cada vez que modifiques el backend (endpoints, estructura, DB, scripts, comandos, variables de entorno), debés actualizar:**
   - `docs/backend-architecture.md`
   - `backend/README.md`
3) La documentación debe quedar escrita en **español**.
4) Siempre que agregues o cambies un endpoint, también debés:
   - Documentarlo en la sección de API Endpoints del README
 5) No agregues features fuera del MVP, salvo que se pida explícitamente.
## Archivos que SIEMPRE se actualizan cuando corresponde
### ✅ 1. `docs/backend-architecture.md`
Actualizar este archivo cuando cambies:
- Modelo de datos (tablas, relaciones, campos, enums)
- Decisiones de diseño (Session, multi-tenant, auth, etc.)
- Nuevos módulos/capas (services, controllers, middleware)
- Eventos de dominio y payloads
- Estrategias de escalabilidad (caching, índices, etc.)
📌 Este documento debe mantener:
- Descripción del problema y alcance técnico
- Diagrama/tabla de entidades
- Endpoints principales
- Eventos registrados

---

### ✅ 2. `backend/README.md`
Actualizar este archivo cuando cambies:
- Comandos para levantar el backend
- Variables de entorno
- Scripts de Prisma
- Puertos / URL base
- Dependencias o requisitos (Docker, Postgres, Node version)
- Seed o forma de correr migrations
📌 Este README debe incluir mínimo:
- Requisitos (Node + Postgres)
- Configuración `.env`
- Comandos para:
  - instalar
  - migrar
  - seed
  - correr en dev
- Base URL de API
- Tabla de endpoints MVP

---
## Formato del README (estructura estándar)
El archivo `backend/README.md` siempre debe tener este orden:
1. Descripción
2. Requisitos
3. Levantar base de datos (Docker opcional)
4. Variables de entorno (.env)
5. Migraciones / Prisma
6. Seed (si aplica)
7. Ejecutar backend
8. Endpoints principales del MVP
9. Notas de desarrollo (opcional)

---

## Reglas de consistencia
- Los endpoints deben estar siempre bajo `/api/v1/...`
- Todas las entidades deben incluir `restaurant_id` cuando aplique (multi-tenant)
- Cada entidad debe tener timestamps (`createdAt`, opcional `updatedAt`)
- Mantener coherencia de nombres:
  - `Restaurant`, `Table`, `Session`, `Consumer`, `Order`, `OrderItem`, `DomainEvent`
- Mantener el “split por ítem” como lógica central usando tabla N:M
---
## Entrega obligatoria al final de cada cambio
Cada vez que completes una modificación, tu salida debe incluir:
✅ 1) Lista de archivos modificados  
✅ 2) Resumen de qué cambió y por qué  
✅ 3) Confirmación de que `docs/backend-architecture.md` y `backend/README.md` fueron actualizados
Ejemplo:
- Archivos modificados: `src/routes/order.routes.ts`, `docs/backend-architecture.md`, `backend/README.md`
- Cambios: Se agregó endpoint X para ...
- Documentación: Actualizada ✅
---
## Importante
Si detectás inconsistencias entre backend y documentación existente:
- Corregí la documentación para que represente el estado real del backend.
- No inventes funcionalidades no implementadas.
