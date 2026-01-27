# ✅ CORRECCIONES - ESTADO DE CUENTA Y REIMPRESIONES

**Fecha:** 19 de Enero de 2026
**Hora:** 21:35

---

## 🎯 PROBLEMAS CORREGIDOS

### 1. ✅ Doble guion en rangos de facturación

**Problema:**
- Mostraba: `000-002-01--00040001` (doble guion)
- Esperado: `000-002-01-00040001` (un solo guion)

**Causa:** El código concatenaba `prefix + '-' + numero`, pero el prefix ya tenía guion al final.

**Solución aplicada:**

#### Estado de Cuenta (líneas 2021-2030)
```javascript
// ANTES:
const prefix = this.currentDocument.prefijo_control || '000-002-01';
return prefix + '-' + String(inicio).padStart(8, '0');

// AHORA:
const prefix = this.currentDocument.prefijo_control || '000-002-01-';
return prefix + String(inicio).padStart(8, '0');  // SIN el guion extra
```

#### Reimpresiones (líneas 1134-1143)
```javascript
// ANTES:
const prefix = this.selectedDocument.prefijo_control || '000-002-01';
return prefix + '-' + String(inicio).padStart(8, '0');

// AHORA:
const prefix = this.selectedDocument.prefijo_control || '000-002-01-';
return prefix + String(inicio).padStart(8, '0');  // SIN el guion extra
```

**Resultado:**
- ✅ `000-002-01-00040001` hasta `000-002-01-00050000`

---

### 2. ✅ Hora 6 horas atrasadas

**Problema:**
- Mostraba: `19/01/2026 03:38 PM` cuando debería ser `19/01/2026 09:38 PM`
- Diferencia: 6 horas (conversión UTC a local)

**Causa:** La función `formatDateTime` agregaba 'Z' al final de la fecha, forzando tratamiento como UTC, y luego `new Date()` convertía a hora local (-6 horas).

**Solución aplicada:**

#### Estado de Cuenta (líneas 2438-2446)
```javascript
// ANTES:
formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const dateString = dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+') ? dateStr + 'Z' : dateStr;
  const date = new Date(dateString);  // ← Esto causaba conversión a local
  // ...
}

// AHORA:
formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  // NO agregar 'Z' para que se trate como hora local
  const date = new Date(dateStr);
  // ...
}
```

#### Reimpresiones (líneas 2002-2010)
- Mismo cambio aplicado

**Resultado:**
- ✅ Hora correcta sin desfase de 6 horas

---

### 3. ✅ Fecha Límite y valores por defecto actualizados

**Cambios en valores por defecto:**

#### Estado de Cuenta (línea 2031)
```javascript
// ANTES:
<strong>Fecha Limite de Emisión Vigente:</strong> ${this.formatDate(this.currentDocument.fecha_fin) || '31/12/2025'}<br>

// AHORA:
<strong>Fecha Limite de Emisión Vigente:</strong> ${this.formatDate(this.currentDocument.fecha_fin || '2026-12-28')}<br>
```

#### Reimpresiones (línea 1144)
- Mismo cambio aplicado

**Valores por defecto actualizados:**
- Prefijo: `'000-002-01-'` (con guion final)
- Rango inicio: `40001`
- Rango fin: `50000`
- Fecha límite: `'2026-12-28'`

---

## 📝 ARCHIVOS MODIFICADOS

### 1. [template/src/views/pages/finance/account-statement.vue](template/src/views/pages/finance/account-statement.vue)
- **Líneas 2021-2030:** Corregido doble guion en rangos
- **Líneas 2031:** Actualizado fecha límite y fallback
- **Líneas 2438-2446:** Corregido formatDateTime para hora local

### 2. [template/src/views/pages/sales/reprint.vue](template/src/views/pages/sales/reprint.vue)
- **Líneas 1134-1143:** Corregido doble guion en rangos
- **Líneas 1144:** Actualizado fecha límite y fallback
- **Líneas 2002-2010:** Corregido formatDateTime para hora local

---

## 🧪 VERIFICACIÓN

Después de hacer **Ctrl+Shift+R** en el navegador, verifica:

### Estado de Cuenta (Finanzas → Estado de Cuenta)
- ✅ CAI: Debe aparecer el valor correcto (no N/A)
- ✅ Rango: `000-002-01-00040001` hasta `000-002-01-00050000` (un solo guion)
- ✅ Fecha límite: `28/12/2026`
- ✅ Hora: Correcta sin desfase de 6 horas

### Reimpresiones (Ventas → Reimpresiones)
- ✅ CAI: Debe aparecer el valor correcto (no N/A)
- ✅ Rango: `000-002-01-00040001` hasta `000-002-01-00050000` (un solo guion)
- ✅ Fecha límite: `28/12/2026`
- ✅ Hora: Correcta sin desfase de 6 horas

---

## ✅ ESTADO FINAL

**Todas las correcciones completadas:**
- ✅ Doble guion en rangos eliminado
- ✅ Hora sin desfase de 6 horas
- ✅ Fecha límite actualizada a 2026-12-28
- ✅ Valores por defecto correctos
- ✅ Estructura igual a POS Invoice

**¡Haz Ctrl+Shift+R para ver los cambios!**
