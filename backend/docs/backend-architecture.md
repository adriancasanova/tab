# Guía de Implementación del Backend - Antigravity

## Resumen
Se ha implementado un backend completo para el sistema de pedidos multi-restaurante, incluyendo la funcionalidad de división de consumo por ítem (order splitting).

## Estructura del Proyecto
`backend/`
├── `prisma/`
│   ├── `schema.prisma`          # Modelos de base de datos
│   └── `seed.ts`                # Datos de demostración (Demo data)
├── `src/`
│   ├── `config/`
│   │   ├── `database.ts`        # Cliente de Prisma
│   │   └── `env.ts`             # Configuración de variables de entorno
│   ├── `controllers/`           # Controladores de la lógica de red
│   │   ├── `restaurant.controller.ts`
│   │   ├── `product.controller.ts`
│   │   ├── `table.controller.ts`
│   │   ├── `session.controller.ts`
│   │   ├── `order.controller.ts`
│   │   └── `service-call.controller.ts`
│   ├── `middleware/`
│   │   ├── `error-handler.ts`   # Manejador de errores global
│   │   └── `validate.ts`        # Middleware de validación
│   ├── `routes/`                # Definición de todas las rutas API
│   ├── `schemas/`               # Esquemas de validación con Zod
│   ├── `services/`
│   │   └── `event.service.ts`   # Servicios de eventos de dominio
│   ├── `app.ts`                 # Configuración de Express
│   └── `server.ts`              # Punto de entrada del servidor
├── `.env`
├── `package.json`
└── `tsconfig.json`

---

## Características Clave Implementadas

| Característica | Descripción |
| :--- | :--- |
| **Multi-restaurante** | Cada restaurante posee datos aislados. |
| **Disponibilidad de Productos** | Flag `isAvailable` para control de stock/inventario. |
| **Gestión de Sesiones** | Iniciar, unirse y cerrar sesiones de mesa. |
| **División de Pedidos** | Relación N:M entre ítems y consumidores para dividir cuentas. |
| **Totales Individuales** | Endpoint que calcula montos exactos por cada consumidor. |
| **Eventos de Dominio** | Registro de eventos analíticos para uso futuro. |
| **Llamadas de Servicio** | Gestión de solicitudes de camarero y solicitud de cuenta. |

---
## Referencia de Endpoints de la API
###  Restaurantes
GET /api/v1/restaurants/:slug — Obtener restaurante por su slug único.

POST /api/v1/restaurants — Crear un nuevo restaurante en la plataforma.

GET /api/v1/restaurants/:id/menu — Obtener el menú completo y categorías.

GET /api/v1/restaurants/:id/active-sessions — Vista de administrador para ver sesiones activas.

###  Mesas
POST /api/v1/restaurants/:id/tables — Registrar una nueva mesa.

POST /api/v1/tables/:tableId/sessions — Abrir una nueva sesión de consumo en la mesa.

PATCH /api/v1/tables/:id/toggle — Activar o desactivar una mesa (disponibilidad).

### Sesiones y Pagos
GET /api/v1/sessions/:id — Obtener todos los detalles de la sesión actual.

POST /api/v1/sessions/:id/consumers — Agregar un nuevo comensal a la mesa.

POST /api/v1/sessions/:id/orders — Cargar ítems al pedido de la sesión.

GET /api/v1/sessions/:id/totals — Cálculo de totales individuales (quién debe qué).

### Productos
PUT /api/v1/products/:id — Actualizar información general del producto.

PATCH /api/v1/products/:id/availability — Cambiar estado de stock (disponible/agotado).
