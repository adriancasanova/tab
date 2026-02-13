# Guía de Flujo y Testing de la App

Este documento detalla los pasos y datos necesarios para probar los distintos flujos de la aplicación (Login, Registro, Escaneo QR).

## 1. Login de Dueño / Administrador

Para acceder al panel de administración del restaurante.

- **URL**: `/login`
- **Credenciales de Prueba (Seed Data)**:
  - **Email**: `demo@gastrosplit.com`
  - **Contraseña**: `demo123`

> **Nota**: Este usuario ya tiene creado un restaurante de prueba llamado "GastroSplit Demo".

## 2. Registro de Nuevo Dueño

Para simular el alta de un nuevo cliente (dueño de restaurante).

- **URL**: `/register`
- **Flujo**:
  1. Completar el formulario con datos reales o ficticios.
  2. Al finalizar, serás redirigido para crear tu primer restaurante.
  3. Ingresa el nombre y el "slug" (identificador único en la URL) de tu restaurante.
  4. Una vez creado, accederás al Dashboard de Administración.

## 3. Simulación de Cliente (Escaneo de QR)

Para probar la experiencia de un comensal que llega al restaurante y escanea el código QR de su mesa.

**Datos del Restaurante de Prueba:**
- **Slug**: `demo-restaurant`
- **Mesas habilitadas**: 1 a 10

### Flujo de Prueba:

1. **Simular Escaneo**:
   - Navega a la siguiente URL (reemplaza `localhost:5173` por tu host si es distinto):
   - `http://localhost:5173/demo-restaurant/table/1`
   - * (Puedes cambiar el `1` por cualquier número del 1 al 10)*.

2. **Pantalla de Bienvenida / Registro Rápido**:
   - Verás una pantalla solicitando tu **Nombre**.
   - Ingresa un nombre (ej: "Pepe").
   - Dale a "Comenzar".

3. **Menú Digital**:
   - Serás redirigido automáticamente a la vista del menú para esa mesa.
   - **URL Resultante**: `/demo-restaurant/table/1/users`
   - Aquí podrás ver categorías y productos (cargados por defecto en el seed).

## 4. Dashboard de Administración

Para ver las mesas activas y pedidos (si los hubiera).

- **URL**: `/demo-restaurant/admin` (Requiere estar logueado como el dueño `demo@gastrosplit.com`)
- **Funcionalidades a testear**:
  - Ver el estado de las mesas.
  - Habilitar/Deshabilitar mesas.
  - Gestionar categorías y productos.

---
**Resumen de URLs Clave:**

| Acción | URL Relativa |
|--------|--------------|
| Login Dueño | `/login` |
| Registro Dueño | `/register` |
| **QR Mesa 1 (Demo)** | `/demo-restaurant/table/1` |
| Admin Dashboard | `/demo-restaurant/admin` |
