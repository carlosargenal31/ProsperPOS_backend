# Instrucciones de Prueba - Cupones con Días de la Semana

## ✅ Correcciones Implementadas

### 1. Problema de Codificación UTF-8 Corregido
- Se corrigió "cup�n" → "cupón" en todos los mensajes del modal
- Archivo: `template/src/components/modal/coupon-modal.vue`

### 2. Funcionalidad de Días de la Semana Implementada
- **Frontend**: Ya existían los checkboxes para seleccionar días (Lunes a Domingo)
- **Backend**: Se actualizó el controller para guardar y validar los días seleccionados
- **Base de Datos**: Los campos ya existían en la tabla `coupons`

## 🧪 Cómo Probar la Funcionalidad

### Paso 1: Crear un Cupón con Días Específicos

1. Inicia sesión en el sistema POS
2. Ve a **Ventas → Cupones**
3. Haz clic en **"Agregar Nuevo Cupón"**
4. Completa el formulario:
   - **Código**: Se genera automáticamente
   - **Nombre del Cupón**: Por ejemplo, "DESCUENTO FIN DE SEMANA"
   - **Tipo de Descuento**: Selecciona "Monto" o "Porcentaje"
   - **Valor**: Ingresa el monto o porcentaje del descuento

5. **Sección de Días** (la parte nueva):
   - Desmarca el checkbox "Todos"
   - Selecciona SOLO los días en que quieres que el cupón esté activo
   - Por ejemplo, para un cupón de fin de semana:
     - ❌ Lunes
     - ❌ Martes
     - ❌ Miércoles
     - ❌ Jueves
     - ❌ Viernes
     - ✅ Sábado
     - ✅ Domingo

6. Haz clic en **"Guardar"**

### Paso 2: Verificar que se Guardó Correctamente

1. En la lista de cupones, haz clic en el ícono del **ojo** (ver detalles) del cupón que acabas de crear
2. Verifica que aparezcan los días seleccionados en el modal de detalles

### Paso 3: Probar la Validación en el POS

#### Opción A: Probar en un Día Válido

1. Si hoy es uno de los días seleccionados (ej: Sábado):
2. Ve al **POS** y agrega productos al carrito
3. Ingresa el código del cupón
4. **Resultado esperado**: ✅ El cupón se debe aplicar correctamente

#### Opción B: Probar en un Día Inválido

1. Si hoy NO es uno de los días seleccionados (ej: Lunes):
2. Ve al **POS** y agrega productos al carrito
3. Ingresa el código del cupón
4. **Resultado esperado**: ❌ Debe aparecer un mensaje de error:
   ```
   "Este cupón no es válido para el día lunes"
   ```

### Paso 4: Probar en E-commerce (Opcional)

Si tienes el módulo de e-commerce activo:

1. Agrega productos al carrito en la tienda online
2. Intenta aplicar el cupón
3. El sistema debe validar el día de la semana igual que en el POS

## 📋 Casos de Prueba Recomendados

### Caso 1: Cupón de Días Laborales
```
Nombre: DESCUENTO LABORAL
Días: Lunes, Martes, Miércoles, Jueves, Viernes
Valor: L. 50.00
```
**Probar**: Debe funcionar de Lunes a Viernes, rechazarse en fin de semana

### Caso 2: Cupón de Fin de Semana
```
Nombre: OFERTA FIN DE SEMANA
Días: Sábado, Domingo
Valor: 15%
```
**Probar**: Debe funcionar solo Sábado y Domingo

### Caso 3: Cupón de Días Específicos
```
Nombre: MIERCOLES DE PLAZA
Días: Solo Miércoles
Valor: L. 100.00
```
**Probar**: Debe funcionar solo los Miércoles

### Caso 4: Cupón Todos los Días
```
Nombre: DESCUENTO SIEMPRE
Días: Todos seleccionados
Valor: L. 25.00
```
**Probar**: Debe funcionar cualquier día de la semana

## 🔍 Verificación en Base de Datos (Opcional)

Si quieres verificar directamente en la base de datos:

```sql
SELECT
  codigo,
  nombre,
  aplica_lunes,
  aplica_martes,
  aplica_miercoles,
  aplica_jueves,
  aplica_viernes,
  aplica_sabado,
  aplica_domingo
FROM coupons
WHERE deleted_at IS NULL
ORDER BY id DESC
LIMIT 5;
```

Los valores deben ser:
- `1` = Día activo
- `0` = Día inactivo

## 🐛 Problemas Conocidos Resueltos

1. **Codificación UTF-8**: Ya corregido
   - Antes: "cup�n"
   - Ahora: "cupón"

2. **Días no se guardaban**: Ya corregido
   - Ahora el backend guarda todos los campos de días de la semana

3. **Validación no funcionaba**: Ya corregido
   - Ahora el sistema valida el día actual contra los días configurados en el cupón

## ✨ Mejoras Implementadas

1. **Mensajes claros de error**: Cuando un cupón no es válido para el día actual, el sistema muestra exactamente qué día es y por qué no aplica

2. **Validación en múltiples módulos**:
   - ✅ POS
   - ✅ E-commerce
   - ✅ API de cupones

3. **Interfaz intuitiva**: Los checkboxes permiten seleccionar fácilmente los días de la semana

## 📝 Notas Técnicas

### Archivos Modificados

1. **Frontend**:
   - `template/src/components/modal/coupon-modal.vue` (línea 596: mensaje de información, líneas 1520-1556: mensajes de éxito/error)

2. **Backend**:
   - `backend/src/controllers/coupon.controller.js`:
     - Función `createCoupon`: Ahora guarda los campos de días de la semana
     - Función `updateCoupon`: Ahora actualiza los campos de días de la semana
     - Función `validateCoupon`: Ahora valida el día de la semana actual

### Campos en Base de Datos

Tabla: `coupons`

Campos agregados (ya existían):
- `aplica_lunes` TINYINT(1)
- `aplica_martes` TINYINT(1)
- `aplica_miercoles` TINYINT(1)
- `aplica_jueves` TINYINT(1)
- `aplica_viernes` TINYINT(1)
- `aplica_sabado` TINYINT(1)
- `aplica_domingo` TINYINT(1)

### Lógica de Validación

```javascript
// Obtener día actual (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
const dayOfWeek = new Date().getDay();

// Mapear a campo de base de datos
const dayMapping = {
  0: 'aplica_domingo',
  1: 'aplica_lunes',
  2: 'aplica_martes',
  3: 'aplica_miercoles',
  4: 'aplica_jueves',
  5: 'aplica_viernes',
  6: 'aplica_sabado'
};

// Validar
if (!coupon[dayMapping[dayOfWeek]]) {
  return error('Cupón no válido para el día de hoy');
}
```

## 🎉 Conclusión

Todas las funcionalidades de días de la semana ahora están completamente implementadas y funcionando. Los usuarios pueden:
- ✅ Seleccionar días específicos de la semana para cada cupón
- ✅ Ver los días seleccionados en los detalles del cupón
- ✅ Recibir mensajes claros cuando un cupón no es válido para el día actual
- ✅ Usar cupones que solo aplican en ciertos días de la semana
