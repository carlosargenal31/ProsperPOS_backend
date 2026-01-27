# Solución: Cupones con Producto Específico

## 🐛 Problema Reportado

Cuando creas un cupón y seleccionas un **producto específico**, el sistema está aplicando el descuento a **TODOS los productos de la misma categoría y subcategoría**, en lugar de aplicarlo solo al producto seleccionado.

### Ejemplo del Problema
```
Cupón: "Descuento de San Valentín"
- Categoría: CERAMICA PARA PISO
- Subcategoría: CERAMICAS 46X46CM
- Producto Específico: CERAMICA 46047 46X46CM (1.90MT)

PROBLEMA: El cupón se aplica a TODOS los productos de CERAMICAS 46X46CM
ESPERADO: El cupón debería aplicarse SOLO a CERAMICA 46047
```

## 🔍 Análisis del Código

He revisado todo el flujo del sistema y encontré lo siguiente:

### 1. Frontend - Envío de Datos ✅ CORRECTO

**Archivo**: `template/src/components/modal/coupon-modal.vue` (líneas 1479-1514)

```javascript
const dataToSend = {
  codigo: this.formData.codigo,
  nombre: this.formData.nombre,
  tipo_aplicacion: this.formData.tipo_aplicacion,
  categoria_id: this.formData.categoria_id || null,
  subcategoria_id: this.formData.subcategoria_id || null,
  producto_id: this.formData.producto_id || null,  // ← Se envía correctamente
  // ... otros campos
};
```

**Estado**: ✅ El frontend SÍ envía el `producto_id` correctamente.

### 2. Backend - Guardado en Base de Datos ✅ CORRECTO

**Archivo**: `backend/src/controllers/coupon.controller.js` (líneas 276-318)

```javascript
const query = `
  INSERT INTO coupons (
    ...
    tipo_aplicacion, grupo_id, subgrupo_id, articulo_id,
    ...
  ) VALUES (?, ?, ?, ?, ?, ..., ?, ?, ?, ?)
`;

const result = await db.query(query, [
  ...
  tipo_aplicacion,
  categoria_id || null,
  subcategoria_id || null,
  producto_id || null,  // ← Se mapea correctamente a articulo_id
  ...
]);
```

**Estado**: ✅ El backend SÍ guarda el `producto_id` en el campo `articulo_id`.

### 3. Validación del Cupón ✅ LÓGICA CORRECTA

**Archivo**: `backend/src/controllers/ecommerce-coupon.controller.js` (líneas 149-172)

```javascript
if (coupon.tipo_aplicacion === 'grupo') {
  // Si tiene articulo_id específico, SOLO aplicar a ese producto
  if (coupon.articulo_id) {
    applicableItems = cart.items.filter(item => item.product_id === coupon.articulo_id);
  }
  // Si tiene grupo_id Y subgrupo_id, debe cumplir AMBAS
  else if (coupon.grupo_id && coupon.subgrupo_id) {
    applicableItems = cart.items.filter(item =>
      item.category_id === coupon.grupo_id &&
      item.subcategory_id === coupon.subgrupo_id
    );
  }
  // ... resto de condiciones
}
```

**Estado**: ✅ La lógica es correcta. Si `articulo_id` existe, SOLO filtra por ese producto.

## 🎯 Causa Probable del Problema

Después de analizar el código, la causa más probable es:

**El campo `producto_id` NO se está guardando en la base de datos**, aunque el código es correcto.

### Posibles Causas:

1. **Migración de base de datos no ejecutada**: El campo `articulo_id` podría no existir en la tabla `coupons`
2. **Valor NULL**: El `producto_id` puede estar llegando como `undefined` o `null` desde el frontend
3. **Error de validación**: El backend puede estar rechazando el valor antes de guardarlo

## ✅ Solución: Verificación y Corrección

### Paso 1: Verificar Estructura de la Tabla

Ejecuta este SQL en tu base de datos:

```sql
DESCRIBE coupons;
```

Verifica que exista el campo `articulo_id`:
```
articulo_id | int | YES | NULL
```

Si NO existe, ejecuta:

```sql
ALTER TABLE coupons
ADD COLUMN articulo_id INT NULL AFTER subgrupo_id;

-- Agregar foreign key
ALTER TABLE coupons
ADD CONSTRAINT fk_coupons_articulo
FOREIGN KEY (articulo_id) REFERENCES products(id)
ON DELETE SET NULL;
```

### Paso 2: Verificar Cupones Existentes

Ejecuta este SQL para ver cómo están guardados los cupones:

```sql
SELECT
  id,
  codigo,
  nombre,
  tipo_aplicacion,
  grupo_id AS categoria_id,
  subgrupo_id AS subcategoria_id,
  articulo_id AS producto_id
FROM coupons
WHERE deleted_at IS NULL
ORDER BY id DESC
LIMIT 5;
```

**Interpretación de resultados**:

```
| codigo | categoria_id | subcategoria_id | producto_id |
|--------|-------------|-----------------|-------------|
| 000007 | 1           | 5               | NULL        |  ← PROBLEMA
| 000006 | 1           | 5               | 123         |  ← CORRECTO
```

- Si `producto_id` es `NULL` aunque seleccionaste un producto: **HAY UN BUG**
- Si `producto_id` tiene un valor: **El código está funcionando correctamente**

### Paso 3: Prueba Manual desde la UI

1. **Crear un cupón de prueba**:
   - Ve a **Ventas → Cupones**
   - Haz clic en **"Agregar Nuevo Cupón"**
   - Nombre: "PRUEBA PRODUCTO UNICO"
   - Selecciona **"Seleccionar una categoría y/o producto en específico"**
   - Selecciona una **Categoría**
   - Selecciona una **Subcategoría**
   - **IMPORTANTE**: Selecciona un **Producto específico**
   - Tipo de Descuento: Monto
   - Valor: 10.00
   - Haz clic en **"Guardar"**

2. **Abrir la consola del navegador** (F12) y buscar el log:
   ```
   Datos a enviar: {
     ...
     producto_id: 123,  ← Debe tener un número, NO null
     ...
   }
   ```

3. **Verificar en la base de datos** que el `producto_id` se guardó:
   ```sql
   SELECT
     codigo, nombre, grupo_id, subgrupo_id, articulo_id
   FROM coupons
   WHERE codigo = 'CODIGO_QUE_GENERASTE';
   ```

4. **Probar en el POS**:
   - Agrega al carrito varios productos de la misma categoría/subcategoría
   - Aplica el cupón
   - **ESPERADO**: Solo debería descontarse el producto específico seleccionado

### Paso 4: Verificar Console Logs

Cuando apliques el cupón en el POS, abre la consola del navegador (F12) y busca:

```javascript
=== VALIDATE COUPON DEBUG ===
Cupón encontrado: {
  id: 1,
  codigo: '000007',
  nombre: 'PRUEBA PRODUCTO UNICO',
  tipo_aplicacion: 'grupo',
  grupo_id: 1,
  subgrupo_id: 5,
  articulo_id: 123  ← DEBE TENER UN VALOR
}
```

Si `articulo_id: null`, ahí está el problema.

## 🔧 Corrección si el Problema Persiste

Si después de verificar, el `producto_id` sigue sin guardarse, agrega este log temporal al backend:

**Archivo**: `backend/src/controllers/coupon.controller.js`

Después de la línea 256 (dentro de `createCoupon`), agrega:

```javascript
// DEBUG: Verificar qué valores estamos recibiendo
console.log('===== DEBUG CUPON =====');
console.log('categoria_id:', categoria_id);
console.log('subcategoria_id:', subcategoria_id);
console.log('producto_id:', producto_id);
console.log('tipo_aplicacion:', tipo_aplicacion);
console.log('=======================');
```

Luego, crea un cupón y revisa los logs del servidor backend para ver qué valores está recibiendo.

## 📋 Checklist de Verificación

- [ ] Verificar que el campo `articulo_id` existe en la tabla `coupons`
- [ ] Crear un cupón de prueba con producto específico
- [ ] Verificar en la consola del navegador que `producto_id` se envía correctamente
- [ ] Verificar en la base de datos que `articulo_id` se guardó correctamente
- [ ] Probar aplicar el cupón en el POS con varios productos
- [ ] Verificar que solo descuenta el producto específico

## 🎓 Explicación de Cómo Debería Funcionar

### Escenario Correcto:

```
CUPÓN:
- Código: DESC001
- Nombre: "Descuento Producto X"
- Categoría: Cerámica (ID: 1)
- Subcategoría: 46x46 (ID: 5)
- Producto: CERAMICA 46047 (ID: 123)
- Descuento: L 50.00

CARRITO:
1. CERAMICA 46047 (ID: 123) - L 200.00  ← ESTE OBTIENE DESCUENTO
2. CERAMICA 46048 (ID: 124) - L 180.00
3. CERAMICA 46049 (ID: 125) - L 190.00

RESULTADO:
- Total Original: L 570.00
- Descuento: L 50.00 (SOLO en producto 123)
- Total con Descuento: L 520.00
```

### Escenario Incorrecto (Bug):

```
RESULTADO ERRÓNEO:
- Total Original: L 570.00
- Descuento: L 150.00 (L 50 en CADA producto) ← MAL
- Total con Descuento: L 420.00
```

## 💡 Solución Rápida Temporal

Si necesitas que funcione inmediatamente mientras investigamos, puedes:

1. **Crear cupones de tipo "Seleccionar múltiples productos"**
2. Agregar SOLO el producto específico que quieres
3. Esto garantiza que solo se aplique a ese producto

Pasos:
- Selecciona **"Seleccionar múltiples productos"**
- Busca y agrega el producto específico
- NO agregues otros productos
- Guarda el cupón

De esta manera, el cupón solo se aplicará al producto que agregaste, aunque uses el tipo "multiple" en lugar de "grupo".

## 📝 Archivos Relevantes

1. **Frontend**: `template/src/components/modal/coupon-modal.vue`
2. **Backend Controller**: `backend/src/controllers/coupon.controller.js`
3. **Validación**: `backend/src/controllers/ecommerce-coupon.controller.js`
4. **Migración SQL**: `backend/database/migrations/create_coupons_table.sql`

## 🔄 Próximos Pasos

1. Ejecutar el checklist de verificación
2. Reportar los resultados encontrados
3. Si el problema persiste, agregar logs de debug
4. Identificar en qué punto del flujo se pierde el `producto_id`

---

**Creado**: 2026-01-23
**Autor**: Claude Sonnet 4.5
**Estado**: Pendiente de verificación
