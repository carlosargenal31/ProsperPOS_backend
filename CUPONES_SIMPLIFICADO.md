# Simplificación del Módulo de Cupones

## Fecha: 2025-11-25

## Cambios Realizados

Se han eliminado las siguientes secciones del módulo de cupones para simplificar el formulario:

### 1. Sección de Hora Eliminada ❌

**Antes:**
- Checkbox "Limitar por rango de hora"
- Campos "Hora Desde" y "Hora Hasta"

**Después:**
- Solo queda la sección de "Límites de Fecha"

### 2. Sección de Días de la Semana Eliminada ❌

**Antes:**
- Checkbox "Todos los días"
- Checkboxes individuales: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo

**Después:**
- Esta sección fue completamente eliminada

### 3. Sección "La cupón aplica para" Eliminada ❌

**Antes:**
- Radio button "TODOS"
- Radio button "Compras mayores a" (con campo de monto mínimo)
- Radio button "Cantidades mayores a" (con campo de cantidad mínima)

**Después:**
- Esta sección fue completamente eliminada

## Archivos Modificados

### Modal de Cupones
**Archivo**: `template/src/components/modal/coupon-modal.vue`

#### Cambios en Modal "Agregar/Editar Cupón":
✅ Sección de Hora removida
✅ Sección de Días removida
✅ Sección "La cupón aplica para" removida

#### Cambios en Modal "Ver Cupón":
✅ Sección de visualización de Hora removida
✅ Sección de visualización de Días removida
✅ Sección de visualización "Aplica Para" removida (manteniendo solo "Suspendida")

## Campos que Permanecen

### Sección de Configuración de Aplicación:
- ✅ Código (auto-generado)
- ✅ Nombre de Cupón
- ✅ Agencia
- ✅ Tipo de aplicación (Grupo/Múltiple)
- ✅ Categoría/Subcategoría/Producto

### Sección de Fechas:
- ✅ Limitar por rango de fecha (checkbox)
- ✅ Fecha Desde
- ✅ Fecha Hasta

### Sección de Descuento:
- ✅ Tipo de Descuento (Porcentaje/Monto)
- ✅ Valor del descuento

### Sección de Control:
- ✅ Suspender (checkbox)

### Para Cupones de Múltiples Productos:
- ✅ Búsqueda y selección de productos
- ✅ Tabla de productos con descuentos individuales

## Resumen de Simplificación

| Antes | Después |
|-------|---------|
| ~15 campos de configuración | ~8 campos de configuración |
| 3 secciones de restricciones | 1 sección de restricciones (fechas) |
| 7 checkboxes de días | 0 |
| 3 opciones de aplicación | 0 (aplica siempre) |

## Beneficios

1. **Interfaz más limpia**: El formulario es más simple y fácil de usar
2. **Menor complejidad**: Menos campos que llenar y validar
3. **Más rápido**: Creación de cupones más ágil
4. **Menos errores**: Menor probabilidad de configuraciones incorrectas

## Impacto en Base de Datos

Los siguientes campos en la base de datos ya no se utilizarán en el formulario:
- `limitar_hora`
- `hora_desde`
- `hora_hasta`
- `aplica_lunes`
- `aplica_martes`
- `aplica_miercoles`
- `aplica_jueves`
- `aplica_viernes`
- `aplica_sabado`
- `aplica_domingo`
- `aplica_para`
- `monto_minimo`
- `cantidad_minima`

**Nota**: Estos campos permanecen en la base de datos por compatibilidad, pero el formulario ya no los solicita ni los muestra.

## Conclusión

✅ El módulo de cupones ha sido simplificado exitosamente, manteniendo solo las funcionalidades esenciales de configuración de descuentos.
