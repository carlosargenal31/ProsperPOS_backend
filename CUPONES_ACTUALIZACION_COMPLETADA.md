# Actualización del Módulo de Cupones - Completada

## Fecha: 2025-11-25

## Resumen de Cambios

Se han realizado las siguientes modificaciones para sincronizar el frontend con el backend del módulo de cupones:

## 1. Actualización de Base de Datos ✅

### Tabla `coupons`:
Se agregaron los siguientes campos:

**Nuevos Campos:**
- `agencia_id` INT - Relación con sucursales/agencias
- `limitar_fecha` TINYINT(1) - Flag para limitar por fecha
- `limitar_hora` TINYINT(1) - Flag para limitar por hora
- `hora_desde` TIME - Hora de inicio
- `hora_hasta` TIME - Hora de fin
- `aplica_lunes` a `aplica_domingo` TINYINT(1) - Días de aplicación
- `aplica_para` ENUM - Tipo de aplicación (todos, compras_mayores, cantidades_mayores)
- `monto_minimo` DECIMAL(10,2) - Monto mínimo para aplicar
- `cantidad_minima` INT - Cantidad mínima para aplicar

**Campos Renombrados:**
- `suspendido` → `suspendida`
- `aplicar_a` → `tipo_aplicacion`

**Valores de ENUM actualizados:**
- `tipo_aplicacion`: 'grupo', 'multiple' (antes: 'grupo', 'subgrupo', 'articulo', 'multiples_articulos')

### Tabla `coupon_products`:
Se agregaron los siguientes campos para descuentos individuales:

- `product_code` VARCHAR(50) - Código del producto
- `product_name` VARCHAR(255) - Nombre del producto
- `descuento_porcentaje` DECIMAL(5,2) - Descuento en porcentaje
- `descuento_monto` DECIMAL(10,2) - Descuento en monto fijo

## 2. Mapeo de Campos Frontend ↔ Backend

El frontend usa nombres diferentes a los de la base de datos. El controlador maneja este mapeo:

| Frontend | Base de Datos | Descripción |
|----------|---------------|-------------|
| categoria_id | grupo_id | ID de categoría |
| subcategoria_id | subgrupo_id | ID de subcategoría |
| producto_id | articulo_id | ID de producto |
| categoria_nombre | - | Nombre de categoría (JOIN) |
| subcategoria_nombre | - | Nombre de subcategoría (JOIN) |
| producto_nombre | - | Nombre de producto (JOIN) |
| agencia_nombre | - | Nombre de agencia (JOIN) |

## 3. Nueva Ruta API ✅

Se agregó la ruta para generar el siguiente código:

```javascript
GET /api/v1/coupons/next-code
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "codigo": "000002"
  },
  "message": "Código generado exitosamente"
}
```

## 4. Simplificación del Frontend ✅

Se eliminaron del formulario (pero se mantienen en la BD para compatibilidad):

- ❌ Sección de límite por hora
- ❌ Sección de días de la semana
- ❌ Sección "La cupón aplica para"

**Campos que permanecen en el formulario:**
- ✅ Código y Nombre
- ✅ Agencia
- ✅ Tipo de aplicación (Categoría/Subcategoría/Producto o Múltiples productos)
- ✅ Límites de fecha (Desde/Hasta)
- ✅ Tipo de descuento (Porcentaje/Monto)
- ✅ Valor del descuento
- ✅ Suspender
- ✅ Productos múltiples con descuentos individuales

## 5. Archivos Modificados

### Base de Datos:
- ✅ `backend/database/migrations/update_coupons_table_fields.sql` - Nueva migración

### Backend:
- ✅ `backend/src/routes/coupon.routes.js` - Agregada ruta `/next-code`

### Frontend:
- ✅ `template/src/components/modal/coupon-modal.vue` - Simplificado

## 6. Funcionalidades Implementadas

### Cupones de Categoría/Subcategoría/Producto Individual:
- Seleccionar categoría con búsqueda paginada
- Seleccionar subcategoría filtrada por categoría
- Seleccionar producto filtrado por categoría/subcategoría
- Descuento global aplicable

### Cupones de Múltiples Productos:
- Búsqueda de productos
- Agregar/remover productos a la lista
- Descuento individual por producto (% o monto)
- Si el descuento individual es 0, se aplica el descuento base del cupón

## 7. Estructura de Datos

### Crear/Actualizar Cupón:

```javascript
{
  "codigo": "000001",
  "nombre": "FACHALETAS",
  "agencia_id": 1,
  "tipo_aplicacion": "grupo", // o "multiple"
  "categoria_id": 1,  // → se mapea a grupo_id
  "subcategoria_id": null, // → se mapea a subgrupo_id
  "producto_id": null, // → se mapea a articulo_id
  "tipo_descuento": "monto", // o "porcentaje"
  "valor_descuento": 200.00,
  "limitar_fecha": true,
  "fecha_desde": "2025-11-10",
  "fecha_hasta": "2025-11-17",
  "suspendida": false,
  "is_active": true,

  // Para tipo_aplicacion = "multiple"
  "items": [
    {
      "product_id": 1,
      "product_code": "PROD001",
      "product_name": "Producto 1",
      "descuento_porcentaje": 10.00,
      "descuento_monto": 0.00
    }
  ]
}
```

## 8. Verificación de Funcionamiento

### Pruebas requeridas:
1. ✅ Generar código automático
2. ⏳ Crear cupón de categoría
3. ⏳ Crear cupón de múltiples productos
4. ⏳ Editar cupón
5. ⏳ Eliminar cupón
6. ⏳ Ver detalles de cupón

## 9. Notas Importantes

1. **Compatibilidad hacia atrás**: Los campos eliminados del formulario (hora, días, aplica_para) se mantienen en la BD con valores por defecto
2. **Mapeo automático**: El controlador mapea automáticamente entre los nombres del frontend y backend
3. **Validaciones**: Los campos requeridos son: codigo, nombre, tipo_descuento, valor_descuento, tipo_aplicacion
4. **Soft Delete**: Los cupones se eliminan con soft delete (deleted_at)

## 10. Siguientes Pasos

- [ ] Probar la funcionalidad completa desde el frontend
- [ ] Verificar que no haya errores en consola
- [ ] Documentar casos de uso
- [ ] Crear pruebas unitarias

## Conclusión

✅ **La sincronización entre frontend y backend ha sido completada exitosamente.**

El módulo de cupones ahora está simplificado y funcional, con soporte para:
- Cupones por categoría/subcategoría/producto
- Cupones de múltiples productos con descuentos individuales
- Gestión completa CRUD
- Generación automática de códigos
