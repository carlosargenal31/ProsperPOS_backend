# ✅ Arqueo de Caja - Flujo Final Completado

## 📋 Cambios Implementados

Se ha actualizado el sistema de arqueo de caja para implementar el flujo correcto de estados y totales.

---

## 🎯 Flujo de Trabajo Actualizado

### 1️⃣ **APERTURA DE CAJA** (Estado: ABIERTA)
- Usuario crea una nueva caja
- Se establece `date_from`, `time_from` y `opening_amount`
- **`date_to` y `time_to` = NULL** ✅
- **Estado: `ABIERTA`**

### 2️⃣ **GUARDAR ARQUEO** (Estado: REVISADO)
- Usuario edita la caja abierta y hace clic en **GUARDAR**
- Se actualizan denominaciones y pagos bancarios
- **`final_total` = TOTAL SEGÚN SISTEMA** (lo vendido)
- **`date_to` y `time_to` = NULL** ✅
- **Estado cambia a: `REVISADO`** ✅

### 3️⃣ **CERRAR CAJA** (Estado: CERRADA)
- Usuario hace clic en botón **CERRAR** desde el listado
- Se establecen `date_to` y `time_to` con fecha/hora actual
- Se mantiene el `final_total` del paso anterior
- **Estado cambia a: `CERRADA`** ✅

---

## 🔧 Archivos Modificados

### Frontend

#### 1. `/template/src/views/pages/cash-register/components/EditArqueoModal.vue`

**Cambios en handleSave:**

```javascript
const handleSave = async () => {
  const cleanData = {
    // NO llenar date_to ni time_to - se llenan solo al CERRAR
    total_cash: String(parseFloat(totalEfectivo.value || 0).toFixed(2)),

    // ✅ IMPORTANTE: final_total = TOTAL SEGÚN SISTEMA (lo vendido)
    final_total: String(parseFloat(systemTotals.value.total_general || 0).toFixed(2)),

    // ... otros campos ...

    total_by_system: String(parseFloat(systemTotals.value.total_general || 0).toFixed(2)),

    // ✅ Al guardar, cambiar estado a REVISADO
    status: 'REVISADO',

    // Denominaciones y pagos bancarios
    denominations: formData.value.denominations.map(d => ({ ... })),
    bank_payments: formData.value.bank_payments.map(p => ({ ... }))
  };

  const response = await axios.put(
    `${API_URL}/cash-register/sessions/${formData.value.id}`,
    cleanData,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.data.success) {
    toast.success('Arqueo guardado y marcado como REVISADO');
    emit('success', response.data.data);
    emit('close');
  }
};
```

**Mensaje actualizado:**
```javascript
toast.success('Arqueo guardado y marcado como REVISADO');
```

#### 2. `/template/src/views/pages/cash-register/cash-register-list.vue`

**Botón de Cerrar actualizado:**

```vue
<!-- Antes: solo para ABIERTA -->
<a v-if="session.status === 'ABIERTA'" ...>

<!-- Ahora: para ABIERTA y REVISADO -->
<a v-if="session.status === 'ABIERTA' || session.status === 'REVISADO'"
   class="me-2 p-2 text-info"
   href="#"
   @click.prevent="closeSession(session)"
   title="Cerrar Caja">
  <i class="ti ti-lock"></i>
</a>
```

**Función closeSession:**
```javascript
const closeSession = async (session) => {
  const result = await Swal.fire({
    title: '¿Cerrar caja?',
    text: `¿Está seguro de cerrar el arqueo ${session.consecutive}? Esto establecerá la fecha y hora de cierre.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    const token = localStorage.getItem('token');
    const now = new Date();

    const closeData = {
      date_to: now.toISOString().split('T')[0],
      time_to: now.toTimeString().split(' ')[0].substring(0, 5),
      status: 'CERRADA'
    };

    const response = await axios.put(
      `${API_URL}/cash-register/sessions/${session.id}`,
      closeData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      toast.success('Caja cerrada exitosamente');
      loadSessions();
      loadStats();
    }
  }
};
```

---

### Backend

#### 3. `/backend/src/models/cash-register.model.js`

**Validación actualizada:**

```javascript
// Si la sesión está abierta O REVISADO, NO permitir llenar date_to ni time_to
// a menos que esté cerrando
if ((existing[0].status === 'ABIERTA' || existing[0].status === 'REVISADO')
    && sessionData.status !== 'CERRADA') {
  if (sessionData.date_to || sessionData.time_to) {
    throw new AppError(
      'No se puede establecer fecha/hora final en una caja abierta o revisada. Debe cerrar la caja primero.',
      400
    );
  }
}
```

---

## 📊 Ejemplo de Flujo Completo

### PASO 1: Apertura
```javascript
{
  "consecutive": "ARQ-2601-000001",
  "status": "ABIERTA",
  "date_from": "2026-01-20",
  "time_from": "08:00",
  "date_to": null,           // ✅ NULL
  "time_to": null,           // ✅ NULL
  "opening_amount": 1000.00,
  "final_total": 0
}
```

### PASO 2: Guardar (cambio a REVISADO)
```javascript
// Usuario hace clic en GUARDAR en el modal
{
  "consecutive": "ARQ-2601-000001",
  "status": "REVISADO",      // ✅ Cambió a REVISADO
  "date_from": "2026-01-20",
  "time_from": "08:00",
  "date_to": null,           // ✅ Sigue NULL
  "time_to": null,           // ✅ Sigue NULL
  "opening_amount": 1000.00,
  "final_total": 4317.75,    // ✅ Total según sistema
  "total_by_system": 4317.75,
  "total_by_count": 4000.00,
  "difference": -317.75
}
```

### PASO 3: Cerrar Caja
```javascript
// Usuario hace clic en CERRAR desde el listado
{
  "consecutive": "ARQ-2601-000001",
  "status": "CERRADA",       // ✅ Cambió a CERRADA
  "date_from": "2026-01-20",
  "time_from": "08:00",
  "date_to": "2026-01-20",   // ✅ Ahora tiene fecha
  "time_to": "18:00",        // ✅ Ahora tiene hora
  "opening_amount": 1000.00,
  "final_total": 4317.75,    // ✅ Se mantiene el total
  "total_by_system": 4317.75,
  "total_by_count": 4000.00,
  "difference": -317.75
}
```

---

## 🔑 Puntos Clave

### 1. **Total Final = Total Según Sistema**
El `final_total` siempre se establece con el total según sistema (las ventas reales):

```javascript
final_total: String(parseFloat(systemTotals.value.total_general || 0).toFixed(2))
```

Este valor incluye:
- Ventas del día (todas las formas de pago)
- Apertura de caja

**Ejemplo:**
- Ventas: L 3,317.75
- Apertura: L 1,000.00
- **Total Final: L 4,317.75** ✅

### 2. **Estados del Arqueo**

| Estado | Descripción | date_to/time_to | Acciones Disponibles |
|--------|-------------|-----------------|---------------------|
| **ABIERTA** | Caja recién abierta | NULL | Editar, Guardar, Cerrar |
| **REVISADO** | Arqueo guardado, pendiente de cerrar | NULL | Editar, Cerrar |
| **CERRADA** | Caja cerrada oficialmente | Con valores | Solo ver/imprimir |

### 3. **Flujo de Botones**

```
ABIERTA  →  [GUARDAR]  →  REVISADO  →  [CERRAR]  →  CERRADA
   ↓                         ↓                        ↓
 Editar                    Editar                  Solo ver
 Cerrar                    Cerrar                     -
```

---

## 🧪 Pruebas Realizadas

### Script de Prueba: `test-flujo-completo-arqueo.js`

**Resultados:**
```
🔧 PASO 1: GUARDANDO ARQUEO (debe cambiar a REVISADO)...
========================================
✅ Arqueo guardado exitosamente
   Nuevo estado: REVISADO ✅
   Fecha hasta: NULL ✅
   Hora hasta: NULL ✅
   Total final: L 4317.75 ✅

🔒 PASO 2: CERRANDO CAJA (debe llenar fechas)...
========================================
   Fecha a establecer: 2026-01-20
   Hora a establecer: 15:08

✅ Caja cerrada exitosamente
   Estado final: CERRADA ✅
   Fecha hasta: 2026-01-20 ✅
   Hora hasta: 15:08 ✅
   Total final: L 4317.75 ✅ (se mantiene)

✅ FLUJO COMPLETADO EXITOSAMENTE
```

---

## 📱 Experiencia de Usuario

### En el Modal de Edición:

**Al hacer clic en GUARDAR:**
```
✅ Arqueo guardado y marcado como REVISADO
```

**El modal muestra:**
```
Total Final: L 4,317.75 (Total según sistema)
```

### En el Listado:

**Caja ABIERTA o REVISADO:**
- Muestra botón de **Editar** (lápiz)
- Muestra botón de **Cerrar** (candado)
- Muestra botón de **Eliminar** (basura)

**Caja CERRADA:**
- Solo muestra botón de **Imprimir**
- No permite editar ni eliminar

---

## ✅ Validaciones Implementadas

### Backend
1. ✅ No permite llenar `date_to` ni `time_to` en cajas ABIERTA o REVISADO
2. ✅ Solo permite `date_to` y `time_to` al cambiar estado a CERRADA
3. ✅ Mantiene `final_total` entre actualizaciones
4. ✅ Valida que exista la sesión antes de actualizar

### Frontend
1. ✅ No envía `date_to` ni `time_to` al GUARDAR
2. ✅ Cambia estado a REVISADO al guardar
3. ✅ Establece `final_total` = total según sistema
4. ✅ Solo envía `date_to`, `time_to` y `status` al CERRAR

---

## 🎉 Resultado Final

El sistema ahora implementa correctamente:

1. **✅ Al GUARDAR:** Estado → REVISADO, fechas NULL, total = sistema
2. **✅ Al CERRAR:** Estado → CERRADA, fechas llenas, total se mantiene
3. **✅ Total Final:** Siempre es el total según sistema (ventas)
4. **✅ Flujo Lógico:** ABIERTA → REVISADO → CERRADA

**Documentado:** 20 de enero de 2026
