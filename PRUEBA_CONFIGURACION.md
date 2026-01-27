# Guía de Prueba - Configuración de Tienda en Línea

## ✅ Estado de Implementación

La funcionalidad ha sido implementada completamente:
- ✅ Base de datos migrada (columna `allow_order_without_stock` agregada)
- ✅ Backend con endpoints funcionales
- ✅ Frontend con interfaz completa

## 🧪 Cómo Probar la Funcionalidad

### Opción 1: Prueba desde el Frontend (Recomendada)

1. **Iniciar el Backend** (si no está corriendo)
   ```bash
   cd backend
   npm start
   ```
   - Debería estar corriendo en `http://localhost:3000`

2. **Iniciar el Frontend**
   ```bash
   cd template
   npm run dev
   ```
   - Frontend POS: `http://localhost:3001`
   - E-commerce: `http://localhost:3002`

3. **Acceder al Sistema**
   - Abre tu navegador en `http://localhost:3001`
   - Inicia sesión con tus credenciales

4. **Ir a Configuración de Tienda**
   - En el menú lateral, busca **"Gestión de Tienda en Línea"**
   - Haz clic en **"Configuración"**

5. **Probar la Funcionalidad**
   - Deberías ver una interfaz con:
     - Un switch grande para "Permitir Pedidos sin Importar Stock"
     - Descripción de la funcionalidad
     - Advertencia sobre gestión manual
     - Estado actual de la configuración

6. **Activar/Desactivar**
   - Haz clic en el switch para activar
   - Debería aparecer mensaje de éxito: "Configuración actualizada exitosamente"
   - El estado actual debe cambiar a "Activado"
   - Haz clic nuevamente para desactivar
   - Debe cambiar a "Desactivado"

7. **Verificar en la Tienda Online**
   - Ve a "Ver Tienda Online"
   - Revisa los productos:
     - **Con configuración ACTIVADA**: Todos los productos deben estar disponibles
     - **Con configuración DESACTIVADA**: Solo productos con stock > 0 disponibles

### Opción 2: Prueba con Postman o Insomnia

#### 1. Login
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { ... }
  }
}
```

Copia el token de la respuesta.

#### 2. Obtener Configuración Actual
```http
GET http://localhost:3000/api/v1/companies/ecommerce/config
Authorization: Bearer {TU_TOKEN_AQUI}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "allow_order_without_stock": 0,
    "name": "Tu Empresa",
    "commercial_name": "Nombre Comercial"
  },
  "message": "Configuración de e-commerce obtenida exitosamente"
}
```

#### 3. Activar la Configuración
```http
PUT http://localhost:3000/api/v1/companies/ecommerce/config
Authorization: Bearer {TU_TOKEN_AQUI}
Content-Type: application/json

{
  "allow_order_without_stock": 1
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "message": "Configuración de tienda actualizada exitosamente",
    "allow_order_without_stock": 1
  }
}
```

#### 4. Verificar en Productos
```http
GET http://localhost:3000/api/v1/ecommerce/products?limit=5
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Producto A",
        "stock_available": 0,
        "allow_order_without_stock": true,
        "in_stock": true
      }
    ],
    "config": {
      "allow_order_without_stock": true
    }
  }
}
```

#### 5. Desactivar la Configuración
```http
PUT http://localhost:3000/api/v1/companies/ecommerce/config
Authorization: Bearer {TU_TOKEN_AQUI}
Content-Type: application/json

{
  "allow_order_without_stock": 0
}
```

### Opción 3: Verificación Directa en la Base de Datos

Puedes verificar que la columna se creó correctamente:

```sql
-- Ver la estructura de la tabla
DESCRIBE companies;

-- Ver el valor actual
SELECT name, allow_order_without_stock FROM companies WHERE is_default = 1;

-- Activar manualmente (para prueba)
UPDATE companies SET allow_order_without_stock = 1 WHERE is_default = 1;

-- Desactivar manualmente
UPDATE companies SET allow_order_without_stock = 0 WHERE is_default = 1;
```

## 🎯 Casos de Prueba

### Caso 1: Configuración Desactivada (Comportamiento Normal)
1. Desactiva la configuración
2. Ve a la tienda online
3. Busca un producto con stock = 0
4. **Resultado esperado**: Debe mostrar "Agotado" y botón deshabilitado

### Caso 2: Configuración Activada (Pedidos sin Stock)
1. Activa la configuración
2. Ve a la tienda online
3. Busca el mismo producto con stock = 0
4. **Resultado esperado**: Debe estar disponible para compra, sin mensaje de "Agotado"

### Caso 3: Productos con Stock Disponible
1. Con cualquier configuración
2. Productos con stock > 0
3. **Resultado esperado**: Siempre disponibles para compra

## 📊 Verificación Visual en el Frontend

La interfaz de configuración debe mostrar:

```
┌─────────────────────────────────────────────────────┐
│ ℹ️ Configura las opciones generales de tu tienda   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📦 Configuración de Inventario                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Permitir Pedidos sin Importar Stock        [ ON/OFF]│
│                                                      │
│ Cuando está activado, los clientes podrán realizar  │
│ pedidos de productos incluso si no hay stock...     │
│                                                      │
│ ⚠️ Importante: Con esta opción activada, deberás   │
│    gestionar manualmente los pedidos que excedan... │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ℹ️ Estado Actual                             │   │
│ │                                               │   │
│ │ Pedidos sin stock: ✓ Activado / ✗ Desactivado│   │
│ │ Comportamiento: Los productos siempre...     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ✅ Configuración actualizada exitosamente          │
└─────────────────────────────────────────────────────┘
```

## 🐛 Solución de Problemas

### Error: "No se puede cargar la configuración"
- Verifica que el backend esté corriendo
- Revisa que la migración se ejecutó correctamente
- Verifica permisos del usuario (requiere `settings.access`)

### Error: "Configuración no se actualiza"
- Verifica la consola del navegador para errores
- Revisa los logs del backend
- Verifica que el usuario tenga permisos

### Error: "Columna no existe"
- Ejecuta la migración: `node backend/add-ecommerce-config-to-companies.js`
- Verifica en la base de datos que la columna existe

## ✅ Checklist de Verificación

- [ ] Migración ejecutada exitosamente
- [ ] Backend corriendo sin errores
- [ ] Frontend corriendo sin errores
- [ ] Login exitoso en el sistema
- [ ] Acceso a página de Configuración
- [ ] Switch visible y funcional
- [ ] Mensaje de éxito al cambiar configuración
- [ ] Estado actual se actualiza correctamente
- [ ] Cambios persisten al recargar la página
- [ ] Productos respetan la configuración en el e-commerce

## 📞 Contacto

Si encuentras algún problema, verifica:
1. Logs del backend en la consola
2. Console del navegador (F12)
3. Que todos los archivos fueron guardados correctamente
4. Que el backend fue reiniciado después de los cambios

---

**Fecha**: 2026-01-16
**Funcionalidad**: Permitir Pedidos sin Stock en Tienda Online
**Estado**: ✅ Implementado y Listo para Probar
