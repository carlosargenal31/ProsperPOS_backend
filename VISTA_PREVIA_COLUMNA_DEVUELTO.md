# Vista Previa - Columna "Devuelto" en Libro de Ventas

## 📊 Ejemplo Visual de la Tabla

```
┌──────────┬──────────┬───────────┬──────────────┬───────────┬──────────┬───────────┬──────────┬───────────┐
│  Fecha   │ Sucursal │   Tipo    │  Nro Doc     │  Total    │ Devuelto │  Estado   │ Vendedor │  Cliente  │
├──────────┼──────────┼───────────┼──────────────┼───────────┼──────────┼───────────┼──────────┼───────────┤
│22/01/2026│ Agencia  │ FACTURA   │ 000-002-01-  │ 12,537.99 │   0.00   │ COBRADO   │  Laura   │CONSUMIDOR │
│          │Principal │           │ 00380074     │           │          │           │Velasquez │  FINAL    │
├──────────┼──────────┼───────────┼──────────────┼───────────┼──────────┼───────────┼──────────┼───────────┤
│22/01/2026│ Agencia  │ FACTURA   │ 000-002-01-  │  1,917.00 │   900.00 │ DEVUELTO  │  Carlos  │ FERPECO   │
│          │Principal │           │ 00380073     │           │   🔴     │           │ Argeñal  │           │
├──────────┼──────────┼───────────┼──────────────┼───────────┼──────────┼───────────┼──────────┼───────────┤
│22/01/2026│ Agencia  │DEVOLUCION │ DEV-000016   │ -8,316.49 │ 8,316.49 │NC-000016  │  Daniel  │CONSUMIDOR │
│          │Principal │           │              │           │   🔴     │-DEVUELTO  │ Bonilla  │  FINAL    │
├──────────┼──────────┼───────────┼──────────────┼───────────┼──────────┼───────────┼──────────┼───────────┤
│21/01/2026│ Agencia  │ FACTURA   │ 000-002-01-  │  4,527.50 │   0.00   │ COBRADO   │  Carlos  │CONSUMIDOR │
│          │Principal │           │ 00380069     │           │          │           │ Argeñal  │  FINAL    │
├──────────┼──────────┼───────────┼──────────────┼───────────┼──────────┼───────────┼──────────┼───────────┤
│21/01/2026│ Agencia  │ FACTURA   │ 000-002-01-  │  3,906.50 │ 3,906.50 │ DEVUELTO  │  Carlos  │CONSUMIDOR │
│          │Principal │           │ 00380070     │           │   🔴     │           │ Argeñal  │  FINAL    │
└──────────┴──────────┴───────────┴──────────────┴───────────┴──────────┴───────────┴──────────┴───────────┘
                                             TOTALES:  124,961.72  17,187.42
                                                                     🔴
```

## 🎨 Características de Diseño

### Columna "Devuelto"

#### Facturas sin Devolución
```
Devuelto
────────
  0.00
```
- Color: Normal (negro)
- Fuente: Regular

#### Facturas con Devolución Parcial
```
Devuelto
────────
 500.00 🔴
```
- Color: **Rojo (#dc3545)**
- Fuente: **Negrita**
- Indica: Una parte de la factura fue devuelta

#### Facturas con Devolución Total
```
Devuelto
────────
1,917.00 🔴
```
- Color: **Rojo (#dc3545)**
- Fuente: **Negrita**
- Indica: Toda la factura fue devuelta

#### Filas de Devolución (Notas de Crédito)
```
  Total     Devuelto
──────────  ────────
-8,316.49   8,316.49 🔴
```
- La columna "Total" muestra el valor negativo
- La columna "Devuelto" muestra el valor absoluto en rojo

## 📊 Ejemplos de Casos de Uso

### Caso 1: Factura Normal (Sin Devolución)
```
Factura: 000-002-01-00380074
Total: L 12,537.99
Devuelto: L 0.00 ← (en negro, regular)
Estado: COBRADO
```

### Caso 2: Factura con Devolución Parcial
```
Factura: 000-002-01-00380073
Total: L 1,917.00
Devuelto: L 900.00 ← (en ROJO, NEGRITA)
Estado: DEVUELTO o ABONOS (depende si hay saldo)
```

### Caso 3: Factura con Devolución Total
```
Factura: 000-002-01-00380070
Total: L 3,906.50
Devuelto: L 3,906.50 ← (en ROJO, NEGRITA)
Estado: DEVUELTO
```

### Caso 4: Nota de Crédito (Fila de Devolución)
```
Documento: DEV-000016
Total: L -8,316.49
Devuelto: L 8,316.49 ← (en ROJO, NEGRITA - valor absoluto)
Estado: NC-000016 - DEVUELTO
```

## 📱 Selector de Columnas

El usuario puede mostrar/ocultar la columna usando el botón "Columnas":

```
┌─────────────────────────────┐
│  Columnas Visibles (14/15)  │
├─────────────────────────────┤
│ ☑ Fecha                     │
│ ☑ Sucursal                  │
│ ☑ Tipo Doc                  │
│ ☑ Nro Documento             │
│ ☑ Nro Autorización          │
│ ☑ Cliente                   │
│ ☑ RTN                       │
│ ☑ Estatus                   │
│ ☑ Subtotal                  │
│ ☑ Descuento                 │
│ ☑ Recargos                  │
│ ☑ Impuesto                  │
│ ☑ Total                     │
│ ☑ Devuelto      ← NUEVA     │
│ ☑ Vendedor                  │
├─────────────────────────────┤
│ [Seleccionar Todas]         │
│ [Deseleccionar Todas]       │
│ [Cerrar]                    │
└─────────────────────────────┘
```

## 🔍 Ordenamiento

Al hacer clic en el encabezado "Devuelto", se puede ordenar:

```
Devuelto ↓  (Descendente - Facturas con más devolución primero)
────────
3,906.50 🔴
2,300.00 🔴
  900.00 🔴
    0.00
    0.00
```

```
Devuelto ↑  (Ascendente - Facturas sin devolución primero)
────────
    0.00
    0.00
  900.00 🔴
2,300.00 🔴
3,906.50 🔴
```

## 📄 Tarjetas de Resumen (Superior)

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  📄 Total Facturas  │  │  🔄 Total Devolucs  │  │  💰 Total General   │  │  ⬅️ Total Devuelto  │
│                     │  │                     │  │                     │  │                     │
│        44           │  │         4           │  │   L 133,661.72      │  │   L 17,187.42 🔴   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

La tarjeta "Total Devuelto" ya existía y muestra el mismo total que la columna en el footer.

## 📑 Footer de Totales

```
┌──────────┬──────────┬───────────┬──────────────┬───────────┬──────────┬───────────┐
│          │          │           │              │           │          │           │
├──────────┴──────────┴───────────┴──────────────┼───────────┼──────────┼───────────┤
│                          SUBTOTALES:            │ Subtotal  │ Descuento│  Recargos │
│                                                 │124,961.72 │ 10,800.45│    0.00   │
│                                                 │           │          │           │
│                                                 │ Impuesto  │  Total   │ Devuelto  │
│                                                 │ 17,187.42 │133,661.72│17,187.42🔴│
└─────────────────────────────────────────────────┴───────────┴──────────┴───────────┘
```

## 📊 Exportaciones

### Excel
```
| Fecha      | Tipo Doc | Nro Doc        | Total      | Devuelto   |
|------------|----------|----------------|------------|------------|
| 22/01/2026 | FACTURA  | 000-002-01-... | 12,537.99  | 0.00       |
| 22/01/2026 | FACTURA  | 000-002-01-... | 1,917.00   | 900.00     |
| 21/01/2026 | FACTURA  | 000-002-01-... | 3,906.50   | 3,906.50   |
|------------|----------|----------------|------------|------------|
| TOTALES    |          |                | 133,661.72 | 17,187.42  |
```

### PDF / Imagen
- Similar a la tabla HTML con la columna incluida
- Los valores devueltos se muestran en rojo
- El total devuelto aparece en el footer en rojo

### Impresión
- Formato idéntico al PDF
- Mantiene los colores y negritas

---

**💡 Ventajas de la Nueva Columna:**

✅ **Visibilidad Inmediata**: Se ve al instante qué facturas tienen devoluciones
✅ **No Requiere Cálculos Mentales**: El monto ya está calculado
✅ **Formato Visual**: El rojo llama la atención sobre las devoluciones
✅ **Análisis Rápido**: Se puede ordenar y filtrar fácilmente
✅ **Exportable**: Incluida en todos los formatos de reporte
✅ **Configurable**: Se puede ocultar si no se necesita

---

**Fecha:** 23 de enero de 2026
**Estado:** ✅ Implementado
