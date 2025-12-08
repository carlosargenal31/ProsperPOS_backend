# ✅ Sistema de Consecutivos Actualizado - POS Facturación

## 📋 Resumen de Cambios Implementados

### 1. **Ocultar Campos de Resolución en COTIZACIÓN** ✅

**Antes:**
- En cotización se mostraban todos los campos: Consecutivo, No. Resolución y Consec. Resolución

**Ahora:**
- **En COTIZACIÓN**: Solo se muestra el Consecutivo (ocupa más espacio, 6 columnas)
- **En FACTURA**: Se muestran los 3 campos (Consecutivo, No. Resolución, Consec. Resolución)

### 2. **Sincronización de Consecutivos** ✅

**FACTURA:**
- El consecutivo de factura ahora está **sincronizado con la resolución**
- Comienza en: `00031836` (coincide con el número actual de la resolución)
- Formato: 8 dígitos con ceros a la izquierda
- Ejemplo: `00031836`, `00031837`, `00031838`...

**COTIZACIÓN:**
- Consecutivo independiente
- Comienza en: `0000000001`
- Formato: 10 dígitos con ceros a la izquierda
- Ejemplo: `0000000001`, `0000000002`, `0000000003`...

**FACTURA EN ESPERA:**
- Consecutivo independiente
- Comienza en: `0000000001`
- Formato: 10 dígitos con ceros a la izquierda

### 3. **Guardado en Base de Datos** ✅

Los consecutivos se guardan **SOLO COMO NÚMEROS**, sin prefijos:
- ❌ NO: `COTIZACION 0000000001`
- ✅ SÍ: `0000000001`
- ❌ NO: `FACTURA 00031836`
- ✅ SÍ: `00031836`

### 4. **Tablas Vaciadas** ✅

Se vaciaron las siguientes tablas para empezar con numeración limpia:

| Tabla | Registros | Estado |
|-------|-----------|--------|
| `invoices` | 0 | ✅ Vaciada |
| `invoice_items` | 0 | ✅ Vaciada |
| `invoice_payments` | 0 | ✅ Vaciada |
| `quotes` | 0 | ✅ Vaciada |
| `quote_items` | 0 | ✅ Vaciada |
| `pending_invoices` | 0 | ✅ Vaciada |
| `pending_invoice_items` | 0 | ✅ Vaciada |
| `sales_returns` | 0 | ✅ Vaciada |
| `sales_return_items` | 0 | ✅ Vaciada |

**Autoincrementales reiniciados a 1** en todas las tablas.

## 📸 Visualización

### Pantalla de COTIZACIÓN:
```
┌─────────────────────────────────────────┐
│ Consecutivo          | Documento        │
│ 0000000001           | COTIZACION       │
│ (6 columnas)         | (6 columnas)     │
└─────────────────────────────────────────┘
```

### Pantalla de FACTURA:
```
┌───────────────────────────────────────────────────────────────────┐
│ Consecutivo | No. Resolución                    | Consec. Res.   │
│ 00031836    | 2A9170-F8828A-8815E0-63BE03...    | 000-002-01-... │
│ (3 cols)    | (3 cols)                          | (3 cols)       │
└───────────────────────────────────────────────────────────────────┘
│ Documento                                                          │
│ FACTURA                                                            │
│ (3 cols)                                                           │
└───────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Incremento

1. **Al guardar COTIZACIÓN**:
   - Se incrementa `consecutives.quote`
   - Se guarda en DB como número puro: `0000000001`

2. **Al guardar FACTURA**:
   - Se incrementa `resolution.current`
   - El consecutivo mostrado coincide con `resolution.current`
   - Se guarda en DB como número puro: `00031836`

3. **Al guardar FACTURA EN ESPERA**:
   - Se incrementa `consecutives.quote` (usa el mismo contador que cotización)
   - Se guarda en DB como número puro

## 📂 Archivos Modificados

### Frontend:
- [pos-invoice.vue](template/src/views/pages/pos/pos-invoice.vue)
  - Campos de resolución ocultos en COTIZACIÓN (líneas 30-56)
  - Consecutivo sincronizado con resolución para FACTURA (líneas 1392-1402)
  - Consecutivo de FACTURA comienza en 31836 (línea 1374)

### Backend:
- [coupon.controller.js](backend/src/controllers/coupon.controller.js)
  - Método `validateCoupon()` agregado (líneas 83-175)
  - Método `getCoupons()` con filtro de activos (líneas 40-94)

- [coupon.routes.js](backend/src/routes/coupon.routes.js)
  - Ruta `/validate/:code` agregada (líneas 27-32)

### Base de Datos:
- [reset-documents-tables.sql](backend/database/reset-documents-tables.sql)
  - Script para vaciar todas las tablas de documentos
  - Reinicia autoincrementales a 1

## ✅ Checklist de Funcionalidades

- [x] Consecutivo numérico puro (sin letras)
- [x] Ocultar campos de resolución en COTIZACIÓN
- [x] Mostrar campos de resolución en FACTURA
- [x] Consecutivo de FACTURA sincronizado con resolución (00031836)
- [x] Consecutivo de COTIZACIÓN independiente (0000000001)
- [x] Guardado en DB solo como números
- [x] Tablas vaciadas y autoincrementales reiniciados
- [x] Modal de cupones integrado
- [x] Modal de ofertas integrado
- [x] API de validación de cupones

## 🚀 Cómo Usar

1. **Para crear una COTIZACIÓN**:
   - Selecciona "COTIZACION" en el dropdown
   - Solo verás el consecutivo (sin resolución)
   - El consecutivo comienza en `0000000001`

2. **Para crear una FACTURA**:
   - Selecciona "FACTURA" en el dropdown
   - Verás consecutivo + No. Resolución + Consec. Resolución
   - El consecutivo comienza en `00031836` y coincide con la resolución

3. **Al guardar**:
   - El sistema incrementa automáticamente el consecutivo correspondiente
   - Se guarda solo el número puro en la base de datos

## 📝 Notas Importantes

- ⚠️ El consecutivo de FACTURA y la Resolución deben coincidir siempre
- ⚠️ No modificar manualmente `consecutives.invoice`, usar `resolution.current`
- ✅ Las tablas fueron vaciadas para empezar con numeración limpia
- ✅ Los cupones y ofertas ya están integrados en el POS

## 🎯 Resultado Final

**COTIZACIÓN:**
```
Consecutivo: 0000000001
Documento: COTIZACION
(Sin campos de resolución)
```

**FACTURA:**
```
Consecutivo: 00031836
No. Resolución: 2A9170-F8828A-8815E0-63BE03-090956-9D
Consec. Resolución: 000-002-01-00031836
Documento: FACTURA
```

---

✅ **Sistema completamente actualizado y listo para producción**
