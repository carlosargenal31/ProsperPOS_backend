# IMPORTAR DOCUMENTO - VERSIÓN MEJORADA (ESTILO SISTEMA ORIGINAL)

## Cambios Implementados

Se ha rediseñado completamente el modal de importación de documentos para que se vea y funcione exactamente como el sistema de búsqueda de datos de las imágenes de referencia.

### ✅ Diseño del Modal

#### Modal de Pantalla Completa
- **Clase**: `modal-fullscreen`
- **Título**: "Búsqueda de datos" (en lugar de "Importar Operación en Espera / Cotización")
- **Fondo oscuro**: `background: rgba(0,0,0,0.5)`

#### Filtros de Búsqueda (Fila Superior)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Buscar por: [Nombre ▼] | Ordenar Por: [Fecha Más Reciente ▼]       │
│ Desde: [2025-01-01]     | Hasta: [2025-11-19]                       │
│ Vendedor: [Seleccione un Vendedor ▼] | [🔍 Buscar...]              │
└─────────────────────────────────────────────────────────────────────┘
```

**Controles de Búsqueda:**
1. **Buscar por**: Dropdown
   - Nombre
   - Número

2. **Ordenar Por**: Dropdown
   - Fecha Más Reciente
   - Fecha Más Antigua
   - Número

3. **Desde**: Input date
4. **Hasta**: Input date
5. **Vendedor**: Select dropdown con lista de vendedores
6. **Campo de búsqueda**: Input con ícono de lupa

### ✅ Tabla de Documentos

#### Estructura de Columnas
| ☑ | Emisión | Vence | Documento | Cliente | Vendedor | Usuario | Total(L) | Estatus |
|---|---------|-------|-----------|---------|----------|---------|----------|---------|

**Características:**
- **Checkbox**: Para seleccionar documentos (en lugar de radio buttons)
- **Emisión**: Fecha y hora formateada como `DD/MM/YYYY\nHH:MM AM/PM`
- **Vence**: Muestra días restantes con colores:
  - 🔴 Rojo: Vencido (días negativos)
  - 🟡 Amarillo: Próximo a vencer (≤ 5 días)
  - 🟢 Verde: Vigente (> 5 días)
- **Documento**: Link clickeable para ver detalles
- **Estatus**: Badge con estado "PENDIENTE"
- **Click en fila**: Selecciona/deselecciona el documento
- **Clase `table-active`**: Resalta la fila seleccionada

#### Altura de Tabla
```css
max-height: calc(100vh - 280px);
overflow-y: auto;
```

### ✅ Paginación
- **Botón "SIGUIENTE"**: Centrado debajo de la tabla
- **Por página**: 15 documentos
- **Se oculta**: Si hay menos de 15 documentos

### ✅ Botones del Footer
```
[CERRAR] [PROCESAR]
```
- **CERRAR**: `btn-secondary btn-sm`
- **PROCESAR**: `btn-success btn-sm` (deshabilitado hasta seleccionar documento)

## Nuevas Propiedades de Data

```javascript
// Import Document
showImportModal: false,
importDocumentType: '', // 'pending-invoice' or 'quote'
importSearch: '',
importSearchBy: 'name',       // ← NUEVO
importSortBy: 'recent',       // ← NUEVO
importDateFrom: '',
importDateTo: '',
importVendorFilter: '',       // ← NUEVO
importPage: 1,                // ← NUEVO
importPerPage: 15,            // ← NUEVO
documents: [],
selectedDocumentId: null
```

## Nuevas Computed Properties

### `paginatedDocuments()`
Retorna los documentos de la página actual basado en:
- `importPage`
- `importPerPage`
- `filteredDocuments`

### `importTotalPages()`
Calcula el número total de páginas necesarias para mostrar todos los documentos filtrados.

### `filteredDocuments()` - MEJORADO
Ahora incluye:
1. **Filtro por búsqueda**: Según `importSearchBy` (nombre o número)
2. **Filtro por fechas**: Rango desde/hasta
3. **Filtro por vendedor**: `importVendorFilter`
4. **Ordenamiento**:
   - Fecha Más Reciente (descendente)
   - Fecha Más Antigua (ascendente)
   - Por Número (alfabético)

## Nuevos Métodos

### `formatDateTime(dateString)`
Formatea fecha y hora en formato:
```
18/11/2025
03:35 PM
```

### `formatVenceDays(dateString)`
Calcula y retorna días hasta el vencimiento:
```
(15) Días  → Vigente
(3) Días   → Próximo a vencer
(-2) Días  → Vencido
```

### `getVenceDaysClass(dateString)`
Retorna clase CSS según días restantes:
- `text-danger`: Vencido
- `text-warning`: ≤ 5 días
- `text-success`: > 5 días

### `selectDocument(doc)`
Toggle de selección de documento con checkbox.

### `closeImportModal()` - MEJORADO
Ahora resetea TODOS los filtros y paginación:
```javascript
this.importPage = 1;
this.importSearch = '';
this.importSearchBy = 'name';
this.importSortBy = 'recent';
this.importDateFrom = '';
this.importDateTo = '';
this.importVendorFilter = '';
```

## Flujo de Trabajo Completo

### 1. Usuario hace clic en "Importar Documento"
```
[⚙️ Opciones Adicionales] [📝 Campos Adicionales] [📥 Importar Documento ▼]
                                                      └─> Operación en Espera
                                                      └─> Cotización
```

### 2. Se abre modal de pantalla completa
```
╔════════════════════════════════════════════════════════════════════╗
║ Búsqueda de datos                                               [×]║
╠════════════════════════════════════════════════════════════════════╣
║ Buscar por: [Nombre ▼] Ordenar: [Fecha Más Reciente ▼]            ║
║ Desde: [____] Hasta: [____] Vendedor: [____] [🔍 _______]         ║
╠════════════════════════════════════════════════════════════════════╣
║ ☑ │Emisión      │Vence    │Documento        │Cliente   │...       ║
║ ☐ │18/11/2025   │(15)Días │COTIZACION 0001  │CONSUMIDOR│...       ║
║   │02:43 PM     │         │                 │FINAL     │...       ║
║ ☐ │18/11/2025   │(15)Días │COTIZACION 0002  │CONSUMIDOR│...       ║
║   │02:04 PM     │         │                 │FINAL     │...       ║
╠════════════════════════════════════════════════════════════════════╣
║                        [SIGUIENTE]                                 ║
╠════════════════════════════════════════════════════════════════════╣
║ [CERRAR]                                      [PROCESAR]           ║
╚════════════════════════════════════════════════════════════════════╝
```

### 3. Usuario puede:
- ✅ Buscar por nombre o número
- ✅ Filtrar por rango de fechas
- ✅ Filtrar por vendedor
- ✅ Ordenar resultados
- ✅ Hacer clic en el número del documento para ver detalles
- ✅ Seleccionar documento con checkbox o clic en fila
- ✅ Navegar entre páginas con botón "SIGUIENTE"

### 4. Al hacer clic en "PROCESAR"
- Se importa el documento seleccionado
- Se carga toda la información en el POS:
  - Cliente
  - Productos con cantidades, precios, descuentos, impuestos
  - Bodega
  - Vendedor
- Se cierra el modal
- Usuario puede proceder al cobro

## Comparación con Versión Anterior

| Aspecto | Versión Anterior | Versión Nueva |
|---------|-----------------|---------------|
| Modal | Modal-xl | Modal-fullscreen |
| Título | Descriptivo del tipo | "Búsqueda de datos" |
| Selección | Radio buttons | Checkboxes |
| Filtro de búsqueda | Simple | Por campo (nombre/número) |
| Ordenamiento | No disponible | 3 opciones |
| Filtro de vendedor | No disponible | Dropdown con lista |
| Fecha/hora | Simple fecha | Fecha + hora formateada |
| Vencimiento | No mostrado | Con colores y días |
| Paginación | No disponible | 15 por página |
| Botones | "Cancelar" / "Importar Documento" | "CERRAR" / "PROCESAR" |

## Archivos Modificados

### `template/src/views/pages/pos/pos-invoice.vue`

**Template (Líneas 953-1069):**
- Modal rediseñado a pantalla completa
- Nuevos filtros de búsqueda
- Tabla con 9 columnas
- Paginación implementada

**Data (Líneas 1203-1215):**
- 5 nuevas propiedades agregadas

**Computed (Líneas 1337-1399):**
- `filteredDocuments()` mejorado con más filtros
- `paginatedDocuments()` agregado
- `importTotalPages()` agregado

**Methods (Líneas 2326-2498):**
- `formatDateTime()` agregado
- `formatVenceDays()` agregado
- `getVenceDaysClass()` agregado
- `selectDocument()` agregado
- `closeImportModal()` mejorado

## Estado Final

✅ **100% FUNCIONAL Y PROBADO**

El modal de importación ahora:
- ✅ Se ve exactamente como el sistema de referencia
- ✅ Tiene todos los filtros necesarios
- ✅ Muestra información completa y formateada
- ✅ Permite búsqueda, filtrado y ordenamiento avanzado
- ✅ Incluye paginación para mejor rendimiento
- ✅ Es completamente responsive
- ✅ Funciona con cotizaciones y operaciones en espera
- ✅ Importa todos los datos correctamente al POS

---

**Fecha de Implementación**: 2025-11-18
**Desarrollador**: Claude Code
**Sistema**: ProsperPOS - Punto de Venta
**Versión**: 2.0 - Mejorada según imágenes de referencia
