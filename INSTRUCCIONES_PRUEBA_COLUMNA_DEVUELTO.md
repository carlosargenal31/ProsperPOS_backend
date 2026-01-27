# Instrucciones para Probar la Columna "Devuelto"

## ✅ Cambios Implementados

Se ha agregado exitosamente una columna "Devuelto" en el Libro de Ventas que muestra:
- **0.00** para facturas sin devoluciones
- **El monto devuelto** (en rojo) para facturas con devoluciones

## 🚀 Cómo Probar

### 1. Reiniciar el Backend

```bash
cd backend
npm start
```

O si tienes el script de reinicio:
```bash
restart-backend.bat
```

### 2. Reiniciar el Frontend (Template)

```bash
cd template
npm run serve
```

O si tienes el script:
```bash
restart-frontend.bat
```

### 3. Acceder al Libro de Ventas

1. Abrir el navegador y acceder al sistema
2. Iniciar sesión con tu usuario
3. Navegar a: **Reportes > Libro de Ventas**
4. La columna "Devuelto" debe aparecer automáticamente

## 🔍 Qué Verificar

### En la Tabla Principal

✅ **Columna "Devuelto" visible**
- Debe aparecer entre "Total" y "Vendedor"
- Debe mostrar valores numéricos con formato L 0.00

✅ **Valores en 0.00 para facturas normales**
- Color negro, texto normal
- Para facturas que no tienen devoluciones

✅ **Valores > 0.00 para facturas devueltas**
- Color rojo, texto en negrita
- Debe coincidir con el total de las notas de crédito asociadas

✅ **Footer con Total Devuelto**
- En la fila de totales, la columna "Devuelto" debe mostrar la suma
- Debe coincidir con el valor de la tarjeta "Total Devuelto" (arriba)

### Funcionalidades

✅ **Ordenamiento**
- Click en "Devuelto" debe ordenar la tabla
- Ascendente: 0.00 primero, devueltos al final
- Descendente: Mayores devoluciones primero

✅ **Selector de Columnas**
- Botón "Columnas" debe mostrar "Devuelto" en la lista
- Al desmarcar, la columna debe ocultarse
- Al marcar, la columna debe aparecer nuevamente

✅ **Búsqueda**
- La búsqueda debe funcionar normalmente
- Los valores devueltos deben mantenerse visibles

### Exportaciones

✅ **Excel**
1. Click en "Guardar Reporte"
2. Seleccionar "Guardar como Excel"
3. Abrir el archivo descargado
4. Verificar que existe la columna "Devuelto"
5. Verificar que los valores son correctos
6. Verificar que la fila de totales incluye el total devuelto

✅ **PDF**
1. Click en "Guardar Reporte"
2. Seleccionar "Guardar como PDF"
3. Abrir el PDF
4. Verificar que la columna "Devuelto" está visible
5. Verificar que los valores devueltos están en rojo
6. Verificar que el footer incluye el total devuelto en rojo

✅ **Imagen**
1. Click en "Guardar Reporte"
2. Seleccionar "Guardar como Imagen"
3. Abrir la imagen PNG
4. Verificar que la columna es visible
5. Verificar el formato (rojo para devoluciones)

✅ **Impresión**
1. Click en "Guardar Reporte"
2. Seleccionar "Imprimir"
3. Verificar la vista previa
4. La columna debe estar incluida

## 🧪 Casos de Prueba

### Caso 1: Factura sin Devolución
**Esperado:**
- Columna "Devuelto": 0.00 (negro, normal)
- Estado puede ser: COBRADO, PENDIENTE, ABONOS

### Caso 2: Factura con Devolución Parcial
**Esperado:**
- Columna "Devuelto": [monto] en rojo y negrita
- El monto debe ser menor que el Total
- Estado puede ser: DEVUELTO o ABONOS

**Ejemplo:**
```
Total: L 1,000.00
Devuelto: L 500.00 (en rojo)
Estado: DEVUELTO
```

### Caso 3: Factura con Devolución Total
**Esperado:**
- Columna "Devuelto": [monto] en rojo y negrita
- El monto debe ser igual al Total
- Estado: DEVUELTO

**Ejemplo:**
```
Total: L 3,906.50
Devuelto: L 3,906.50 (en rojo)
Estado: DEVUELTO
```

### Caso 4: Nota de Crédito (Fila de Devolución)
**Esperado:**
- Tipo Doc: DEVOLUCION
- Total: valor negativo
- Devuelto: valor absoluto en rojo y negrita
- Estado: NC-[número] - DEVUELTO

**Ejemplo:**
```
Tipo: DEVOLUCION
Total: L -8,316.49
Devuelto: L 8,316.49 (en rojo)
```

### Caso 5: Factura con Múltiples Devoluciones
**Esperado:**
- La columna "Devuelto" muestra la SUMA de todas las notas de crédito
- Si una factura tiene 2 NC de L 100 y L 200, debe mostrar L 300.00

## 🐛 Posibles Problemas y Soluciones

### Problema: La columna no aparece
**Solución:**
1. Verificar que el backend está corriendo
2. Hacer F5 (recargar página)
3. Limpiar caché del navegador (Ctrl + Shift + Del)
4. Verificar que no esté oculta en el selector de columnas

### Problema: Los valores están en 0.00 cuando debería haber devolución
**Solución:**
1. Verificar en la base de datos que existen credit_notes para esa factura
2. Verificar que credit_notes.deleted_at IS NULL
3. Verificar que credit_notes.invoice_id coincide con el ID de la factura

### Problema: Los colores no se ven (no está en rojo)
**Solución:**
1. Verificar CSS (puede ser cache del navegador)
2. Forzar recarga con Ctrl + F5
3. Los valores deben ser > 0 para que aparezcan en rojo

### Problema: Error al exportar
**Solución:**
1. Verificar consola del navegador (F12)
2. Verificar que no haya errores en la respuesta del API
3. Probar recargar la página y volver a exportar

## 📝 Notas Técnicas

### Archivos Modificados

**Backend:**
- `backend/src/services/sales-book.service.js` - Query SQL y exportación

**Frontend:**
- `template/src/views/pages/reports/sales-book.vue` - Vista y lógica

### Archivos de Documentación Creados
- `COLUMNA_DEVUELTO_LIBRO_VENTAS.md` - Documentación completa
- `VISTA_PREVIA_COLUMNA_DEVUELTO.md` - Ejemplos visuales
- `INSTRUCCIONES_PRUEBA_COLUMNA_DEVUELTO.md` - Este archivo
- `backend/test-devuelto-column.js` - Script de prueba (opcional)

### Query SQL Utilizado

```sql
COALESCE(
  (SELECT ABS(SUM(cn.total))
   FROM credit_notes cn
   WHERE cn.invoice_id = i.id
   AND cn.deleted_at IS NULL),
  0
) as devuelto
```

Este subquery:
1. Busca todas las notas de crédito (credit_notes) asociadas a la factura
2. Suma los totales de las notas de crédito
3. Convierte a valor absoluto con ABS() (ya que las NC son negativas)
4. Retorna 0 si no hay notas de crédito

## ✅ Checklist de Verificación

Antes de dar por completada la prueba, verificar:

- [ ] Backend está corriendo sin errores
- [ ] Frontend está corriendo sin errores
- [ ] La columna "Devuelto" es visible en la tabla
- [ ] Los valores son correctos para facturas sin devolución (0.00)
- [ ] Los valores son correctos para facturas con devolución (> 0.00 en rojo)
- [ ] El footer muestra el total devuelto
- [ ] Se puede ordenar por la columna "Devuelto"
- [ ] Se puede ocultar/mostrar la columna
- [ ] La exportación a Excel incluye la columna
- [ ] La exportación a PDF incluye la columna
- [ ] La exportación a Imagen incluye la columna
- [ ] La impresión incluye la columna
- [ ] No hay errores en la consola del navegador

## 📞 Soporte

Si encuentras algún problema durante las pruebas:
1. Revisar la consola del navegador (F12) para errores JavaScript
2. Revisar los logs del backend para errores del servidor
3. Verificar que la base de datos está accesible
4. Verificar que tienes datos de prueba (facturas y notas de crédito)

---

**Fecha de implementación:** 23 de enero de 2026
**Estado:** ✅ Listo para probar
**Prioridad:** Alta - Nueva funcionalidad
