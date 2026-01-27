# HISTORIAL DE EXISTENCIAS - AGRUPACIÓN POR BODEGAS COMPLETADA ✅

## Resumen de Cambios

Se ha mejorado el módulo de **Historial de Existencias** para mostrar información de bodegas, categorías y subcategorías, similar al formato del Inventario Físico.

## 🎯 Características Implementadas

### 1. **Backend - Datos por Bodega**
**Archivo:** `backend/src/services/stock-history.service.js`

#### Cambios Realizados:
- ✅ **CROSS JOIN con warehouses**: Ahora cada producto se multiplica por cada bodega
- ✅ **Subcategorías incluidas**: Se agregó el JOIN con `subcategories` para mostrar subcategoría
- ✅ **Movimientos por bodega**:
  - Cargos agrupados por `product_id` y `warehouse_id`
  - Descargos agrupados por `product_id` y `warehouse_id`
  - Ventas agrupadas por `product_id` y `warehouse_id`
- ✅ **Agrupación opcional**: Parámetro `group_by_warehouses` (por defecto `true`)
- ✅ **Totales por bodega y generales**: Calcula subtotales por bodega y totales generales

#### Estructura de Respuesta:

**Modo Agrupado (`group_by_warehouses: true`):**
```javascript
{
  data: [
    {
      warehouse_id: 1,
      warehouse_name: "BODEGA 101 TIENDA",
      items: [
        {
          id: 1,
          sku: "FF-0042-9",
          product_name: "CERAMICA 46001 46X46CM",
          category_name: "CERAMICA PARA PISO",
          subcategory_name: "CERAMICAS 46X46CM",
          warehouse_name: "BODEGA 101 TIENDA",
          initial_quantity: 20,
          added_quantity: 0,
          defective_quantity: 0,
          sold_quantity: 0,
          final_quantity: 20
        },
        // ... más productos
      ],
      totals: {
        initial_quantity: 780.2,
        added_quantity: 0,
        defective_quantity: 0,
        sold_quantity: 27.2,
        final_quantity: 763
      }
    },
    {
      warehouse_id: 2,
      warehouse_name: "BODEGA 102 TALLER",
      items: [...],
      totals: {...}
    }
  ],
  totals: {
    initial_quantity: 1560.4,
    added_quantity: 0,
    defective_quantity: 0,
    sold_quantity: 54.4,
    final_quantity: 1526
  },
  grouped_by_warehouses: true
}
```

**Modo Sin Agrupar (`group_by_warehouses: false`):**
```javascript
{
  data: [
    {
      id: 1,
      sku: "FF-0042-9",
      product_name: "CERAMICA 46001 46X46CM",
      category_name: "CERAMICA PARA PISO",
      subcategory_name: "CERAMICAS 46X46CM",
      warehouse_id: 1,
      warehouse_name: "BODEGA 101 TIENDA",
      initial_quantity: 20,
      // ...
    },
    // ... un producto puede aparecer múltiples veces (una por bodega)
  ],
  totals: {...},
  grouped_by_warehouses: false
}
```

---

### 2. **Frontend - Vista Agrupada por Bodegas**
**Archivo:** `template/src/views/pages/reports/inventory-report/stock-history.vue`

#### Cambios en la UI:

✅ **Checkbox para Agrupar por Bodegas:**
```html
<div class="form-check">
  <input type="checkbox" v-model="groupedByWarehouses" id="groupByWarehouses" />
  <label for="groupByWarehouses">
    <i class="ti ti-building-warehouse me-1"></i> Agrupar por Bodegas
  </label>
</div>
```

✅ **Vista Agrupada:**
- Header visual por bodega (fondo azul con borde naranja)
- Tabla de productos por bodega
- Columna de **Categoría / Subcategoría** con badges de colores
- Subtotales por bodega (fondo amarillo)
- Totales generales (fondo verde)

✅ **Vista Sin Agrupar:**
- Tabla única con todos los productos
- Columna de **Bodega** visible
- Columna de **Categoría / Subcategoría**
- Un producto puede aparecer múltiples veces si está en varias bodegas

#### Estructura Visual:

**Modo Agrupado:**
```
┌─────────────────────────────────────────────────┐
│ 🏢 BODEGA 101 TIENDA                            │
├──────┬────────────────┬─────────────┬───────────┤
│ SKU  │ Producto       │ Cat / Subcat│ Cantidades│
├──────┼────────────────┼─────────────┼───────────┤
│ XX   │ Producto A     │ 🏷️ Cat / Sub │ ...       │
│ YY   │ Producto B     │ 🏷️ Cat / Sub │ ...       │
├──────┴────────────────┴─────────────┴───────────┤
│ SUBTOTAL - BODEGA 101: ...                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏢 BODEGA 102 TALLER                            │
├──────┬────────────────┬─────────────┬───────────┤
│ ...                                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✅ TOTALES GENERALES: ...                       │
└─────────────────────────────────────────────────┘
```

**Modo Sin Agrupar:**
```
┌──────┬────────────┬──────────┬─────────────┬─────┐
│ SKU  │ Producto   │ Bodega   │ Cat / Subcat│ ... │
├──────┼────────────┼──────────┼─────────────┼─────┤
│ XX   │ Producto A │ B101     │ 🏷️ Cat / Sub│ ... │
│ XX   │ Producto A │ B102     │ 🏷️ Cat / Sub│ ... │
│ YY   │ Producto B │ B101     │ 🏷️ Cat / Sub│ ... │
└──────┴────────────┴──────────┴─────────────┴─────┘
```

---

### 3. **Exportación Actualizada**

#### Excel (`.xlsx`)
- ✅ Soporta formato agrupado con headers de bodega
- ✅ Soporta formato plano con columna de bodega
- ✅ Incluye categoría y subcategoría en ambos formatos
- ✅ Subtotales por bodega en formato agrupado
- ✅ Totales generales al final

#### PDF e Imagen
- ✅ Genera HTML con el formato correcto según agrupación
- ✅ Headers dinámicos según el modo
- ✅ Categoría / Subcategoría visible
- ✅ Badges visuales para bodegas y categorías

---

## 🎨 Diseño Visual

### Colores y Estilos:
- **Header de Bodega**: Fondo `#f0f7ff` con borde izquierdo `#ff9800` (naranja)
- **Subtotal de Bodega**: Fondo `#fff9e6` (amarillo claro)
- **Total General**: Fondo `#4caf50` (verde) con texto blanco
- **Badge Categoría**: Azul info con icono 🏷️
- **Badge Subcategoría**: Gris secundario con icono 🏷️
- **Badge Bodega** (sin agrupar): Naranja warning con icono 🏢

---

## 📋 Cómo Usar

### 1. Acceder al Reporte
```
Menú → Reportes → Inventario → Historial de Existencias
```

### 2. Generar Reporte
1. Seleccionar período de fechas
2. (Opcional) Filtrar por categoría, subcategoría o producto
3. **Marcar/desmarcar** el checkbox "Agrupar por Bodegas"
4. Clic en **"Generar Reporte"**

### 3. Visualizar Datos
- **Agrupado**: Verás secciones separadas por bodega
- **Sin agrupar**: Verás una tabla plana con columna de bodega

### 4. Exportar
- Clic en **"Guardar Reporte"**
- Elegir formato: Excel, PDF, Imagen o Imprimir
- El formato respetará la agrupación seleccionada

---

## 🔍 Ejemplo de Caso de Uso

### Escenario:
Tienes un producto **"CERAMICA 46001"** que está en:
- **BODEGA 101 TIENDA**: 20 unidades
- **BODEGA 102 TALLER**: 38 unidades

### Resultado Agrupado:
```
🏢 BODEGA 101 TIENDA
  CERAMICA 46001 - Cat: PISO / Sub: 46X46CM - Stock: 20

🏢 BODEGA 102 TALLER
  CERAMICA 46001 - Cat: PISO / Sub: 46X46CM - Stock: 38

✅ TOTALES GENERALES: 58
```

### Resultado Sin Agrupar:
```
CERAMICA 46001 | BODEGA 101 | PISO / 46X46CM | Stock: 20
CERAMICA 46001 | BODEGA 102 | PISO / 46X46CM | Stock: 38
```

---

## ✅ Beneficios

1. **Claridad por Bodega**: Separación visual clara entre inventarios de cada bodega
2. **Información Completa**: Categoría y subcategoría siempre visibles
3. **Subtotales Útiles**: Totales por bodega facilitan el análisis
4. **Flexibilidad**: Opción de ver agrupado o plano según necesidad
5. **Formato Consistente**: Similar al Inventario Físico (experiencia uniforme)
6. **Exportación Profesional**: Reportes Excel/PDF mantienen la estructura

---

## 🚀 Estado: COMPLETADO

✅ Backend actualizado con CROSS JOIN y agrupación por bodegas
✅ Frontend con vista agrupada y sin agrupar
✅ Checkbox para toggle de agrupación
✅ Categoría y subcategoría visibles
✅ Subtotales por bodega
✅ Totales generales
✅ Exportación Excel actualizada
✅ Exportación PDF/Imagen actualizada
✅ Diseño visual atractivo con badges y colores

---

## 📝 Notas Técnicas

- **Query optimizado**: Un solo query con LEFT JOINs para todas las bodegas
- **Performance**: CROSS JOIN controlado con filtros de productos activos
- **Escalabilidad**: Funciona con múltiples bodegas sin cambios adicionales
- **Compatibilidad**: Mantiene backward compatibility (sin agrupar sigue funcionando)

---

**Desarrollado por:** Carlos Argeñal
**Fecha:** 2026-01-23
**Sistema:** ProsperPOS v1.0
