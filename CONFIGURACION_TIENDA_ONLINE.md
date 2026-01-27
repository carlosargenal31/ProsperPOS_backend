# Configuración de Tienda en Línea - Pedidos sin Stock

## Resumen

Se ha implementado una nueva funcionalidad en la configuración de tienda en línea que permite a los administradores activar/desactivar la opción de **"Permitir pedidos sin importar el stock disponible"**.

Esta característica permite que los clientes puedan realizar pedidos de productos incluso cuando no hay stock disponible, ideal para negocios que manejan pedidos bajo demanda o tienen un proceso de reabastecimiento rápido.

## ¿Qué se implementó?

### Backend

1. **Base de Datos**
   - Nueva columna `allow_order_without_stock` en la tabla `companies`
   - Tipo: TINYINT(1) DEFAULT 0
   - Ubicación: Después de `logo_url`

2. **Servicios y Controladores**
   - `CompanyService.getEcommerceConfig()` - Obtiene la configuración de e-commerce
   - `CompanyService.updateEcommerceConfig()` - Actualiza la configuración
   - Endpoints en `company.routes.js`:
     - GET `/api/v1/companies/ecommerce/config`
     - PUT `/api/v1/companies/ecommerce/config`

3. **Validación de Stock en E-commerce**
   - Modificado `ecommerce-products.controller.js` para respetar esta configuración
   - Afecta a:
     - `getCatalog()` - Listado de productos
     - `getProductDetails()` - Detalles de producto
     - `getFeaturedProducts()` - Productos destacados

### Frontend

1. **Componente de Configuración**
   - Archivo: `template/src/views/pages/tienda-online/configuracion.vue`
   - Interfaz con switch activable/desactivable
   - Actualización en tiempo real
   - Mensajes de éxito/error
   - Indicador visual del estado actual

## Cómo usar

### Paso 1: Ejecutar la Migración

```bash
cd backend
node add-ecommerce-config-to-companies.js
```

Este script agregará la columna `allow_order_without_stock` a la tabla `companies`.

### Paso 2: Acceder a la Configuración

1. Inicia sesión en el sistema POS
2. Ve a **Gestión de Tienda en Línea**
3. Selecciona la opción **"Configuración"** en el menú lateral
4. Encontrarás la sección **"Configuración de Inventario"**

### Paso 3: Activar/Desactivar la Función

- **Switch activado**: Los clientes pueden pedir productos sin importar el stock
  - Todos los productos con "Mostrar en tienda en línea" estarán disponibles
  - No se mostrará "Agotado"
  - El botón "Agregar al carrito" siempre estará habilitado

- **Switch desactivado** (por defecto): Solo productos con stock pueden pedirse
  - Si stock = 0, se muestra "Agotado"
  - El botón "Agregar al carrito" estará deshabilitado

## Comportamiento Técnico

### Cuando está ACTIVADO (allow_order_without_stock = 1)

```javascript
// En la respuesta de productos:
{
  "products": [{
    "id": 1,
    "name": "Producto A",
    "stock_available": 0,
    "allow_order_without_stock": true,
    "in_stock": true  // ← Siempre true
  }],
  "config": {
    "allow_order_without_stock": true
  }
}
```

### Cuando está DESACTIVADO (allow_order_without_stock = 0)

```javascript
// En la respuesta de productos:
{
  "products": [{
    "id": 1,
    "name": "Producto A",
    "stock_available": 0,
    "allow_order_without_stock": false,
    "in_stock": false  // ← Basado en stock_available
  }],
  "config": {
    "allow_order_without_stock": false
  }
}
```

## Archivos Modificados

### Backend
- ✅ `backend/add-ecommerce-config-to-companies.js` (nuevo)
- ✅ `backend/src/services/company.service.js`
- ✅ `backend/src/controllers/company.controller.js`
- ✅ `backend/src/routes/company.routes.js`
- ✅ `backend/src/controllers/ecommerce-products.controller.js`

### Frontend
- ✅ `template/src/views/pages/tienda-online/configuracion.vue`

## Endpoints API

### Obtener Configuración
```http
GET /api/v1/companies/ecommerce/config
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "allow_order_without_stock": 0,
    "name": "Mi Empresa",
    "commercial_name": "Nombre Comercial"
  },
  "message": "Configuración de e-commerce obtenida exitosamente"
}
```

### Actualizar Configuración
```http
PUT /api/v1/companies/ecommerce/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "allow_order_without_stock": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "message": "Configuración de tienda actualizada exitosamente",
    "allow_order_without_stock": 1
  },
  "message": "Configuración de tienda actualizada exitosamente"
}
```

## Consideraciones Importantes

### ⚠️ Advertencias

1. **Gestión Manual de Pedidos**: Con esta opción activada, debes gestionar manualmente los pedidos que excedan tu inventario real.

2. **Actualización de Stock**: Aunque los clientes puedan pedir sin stock, el sistema seguirá mostrando la cantidad disponible real en el detalle del producto.

3. **Responsabilidad**: Es responsabilidad del negocio asegurar que pueden cumplir con los pedidos realizados sin stock.

### ✅ Ventajas

- Evita perder ventas por productos temporalmente agotados
- Ideal para negocios con reabastecimiento rápido
- Permite ventas bajo pedido
- Flexibilidad en la gestión de inventario

### ❌ Desventajas

- Riesgo de sobreventa si no se gestiona correctamente
- Puede generar expectativas incorrectas en clientes
- Requiere comunicación clara sobre tiempos de entrega

## Futuras Mejoras Sugeridas

1. **Configuración por Producto**: Permitir activar/desactivar esta opción por producto individual
2. **Notificaciones**: Alertas cuando se reciban pedidos sin stock
3. **Stock Negativo**: Opción para permitir stock negativo en el sistema
4. **Pre-pedidos**: Sistema de pre-pedidos con fechas estimadas de entrega
5. **Límite de Pedidos**: Configurar un límite de pedidos sin stock

## Soporte

Si encuentras algún problema o necesitas ayuda:
1. Verifica que la migración se ejecutó correctamente
2. Revisa los logs del backend en caso de errores
3. Asegúrate de tener los permisos `settings.access` para modificar la configuración

## Versión
- **Fecha de implementación**: 2026-01-16
- **Versión**: 1.0.0
- **Autor**: Claude Sonnet 4.5
