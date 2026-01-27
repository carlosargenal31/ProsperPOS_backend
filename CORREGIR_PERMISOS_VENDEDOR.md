# 🔧 Corregir Permisos de Vendedor para POS

## 🎯 Problema Actual

El vendedor puede iniciar sesión y ver el POS, pero obtiene errores **403 Forbidden** al intentar cargar datos:

```
❌ GET /api/v1/warehouses - 403 Forbidden
❌ GET /api/v1/resolutions/active - 403 Forbidden
❌ GET /api/v1/bank-accounts - 403 Forbidden
❌ GET /api/v1/categories/active - 403 Forbidden
❌ GET /api/v1/tax-rates - 403 Forbidden
```

**Causa:** El rol "vendedor" no tiene los permisos necesarios en la base de datos.

---

## ✅ Solución (2 minutos)

### PASO 1: Ejecutar Script de Permisos

Abre una terminal en la carpeta `backend` y ejecuta:

```bash
cd backend
node add-pos-permissions-to-cashier.js
```

**Resultado esperado:**

```
========================================
AGREGANDO PERMISOS DE POS A VENDEDOR
========================================

✅ Rol encontrado: Vendedor (ID: 3, Slug: cashier)

📋 Permisos a verificar/agregar: 30

✅ warehouses.read - AGREGADO
✅ resolutions.read - AGREGADO
✅ bank_accounts.read - AGREGADO
✅ categories.read - AGREGADO
✅ tax_rates.read - AGREGADO
✅ customers.read - AGREGADO
✅ products.read - AGREGADO
...

========================================
RESUMEN
========================================
✅ Permisos agregados: 30
✓  Permisos existentes: 0
⚠️  Permisos no encontrados: 0
📊 Total procesados: 30
========================================

🎉 ¡Permisos agregados exitosamente!
```

---

### PASO 2: Cerrar Sesión del Vendedor

En el navegador donde está ProsperPOS:

**Opción A:** Usa el menú
- Gestión de Usuarios → Cerrar Sesión

**Opción B:** Usa la consola (F12)
```javascript
localStorage.clear();
location.reload();
```

---

### PASO 3: Iniciar Sesión de Nuevo

```
Usuario: vendedor
Contraseña: [tu contraseña]
```

---

### PASO 4: Verificar que Funciona

Después de iniciar sesión:

1. **Deberías ir a POS Facturación** ✅
2. **NO debería haber errores 403** ✅
3. **Los datos deberían cargar correctamente:**
   - ✅ Bodegas cargadas
   - ✅ Resolución activa cargada
   - ✅ Categorías cargadas
   - ✅ Tasas de impuesto cargadas
   - ✅ Productos cargados
   - ✅ Clientes cargados

---

## 📊 Permisos que se Agregan

El script agrega **30 permisos** al rol vendedor:

### Lectura de Datos:
- `warehouses.read` - Ver bodegas
- `resolutions.read` - Ver resoluciones de facturación
- `bank_accounts.read` - Ver cuentas bancarias/métodos de pago
- `categories.read` - Ver categorías de productos
- `tax_rates.read` - Ver tasas de impuesto
- `customers.read` - Ver clientes
- `products.read` - Ver productos
- `users.read` - Ver usuarios (vendedores)

### Ventas e Invoices:
- `sales.create` - Crear ventas
- `sales.read` - Ver ventas
- `sales.update` - Actualizar ventas
- `invoices.create` - Crear facturas
- `invoices.read` - Ver facturas
- `invoices.update` - Actualizar facturas
- `invoices.print` - Imprimir facturas

### Cotizaciones:
- `quotes.create` - Crear cotizaciones
- `quotes.read` - Ver cotizaciones
- `quotes.update` - Actualizar cotizaciones

### Devoluciones:
- `sales_returns.create` - Crear devoluciones
- `sales_returns.read` - Ver devoluciones

### Cupones y Ofertas:
- `coupons.read` - Ver cupones
- `offers.read` - Ver ofertas

### Guías de Remisión:
- `shipments.create` - Crear guías
- `shipments.read` - Ver guías

### Arqueo de Caja:
- `cash_register.create` - Crear arqueos
- `cash_register.read` - Ver arqueos
- `cash_register.update` - Actualizar arqueos

---

## 🐛 Solución de Problemas

### Problema: "No se encontró el rol cashier"

**Error:**
```
❌ ERROR: No se encontró el rol "cashier"
```

**Solución:**

El rol existe pero con otro slug. Verifica con:

```bash
node -e "
const db = require('./src/utils/database');
db.query('SELECT * FROM roles').then(roles => {
  console.log('Roles existentes:');
  roles.forEach(r => console.log(\`  - \${r.name} (slug: \${r.slug})\`));
  process.exit(0);
});
"
```

Si el slug es diferente (ej: `vendedor` en lugar de `cashier`), edita el script:

```javascript
// Línea 24 del script
WHERE slug = 'vendedor'  // Cambia 'cashier' por el slug correcto
```

---

### Problema: "Algunos permisos no encontrados"

**Mensaje:**
```
⚠️  Permiso "warehouses.read" no existe en la BD - SALTANDO
```

**Causa:** Esos permisos no existen en la tabla `permissions` de tu base de datos.

**Solución:**

Crea los permisos faltantes. Por ejemplo:

```sql
INSERT INTO permissions (name, description, created_at) VALUES
('warehouses.read', 'Ver bodegas', NOW()),
('resolutions.read', 'Ver resoluciones', NOW()),
('bank_accounts.read', 'Ver cuentas bancarias', NOW()),
('categories.read', 'Ver categorías', NOW()),
('tax_rates.read', 'Ver tasas de impuesto', NOW());
```

Luego ejecuta el script de nuevo.

---

### Problema: Sigo viendo errores 403 después de ejecutar el script

**Checklist:**

- [ ] ¿Ejecutaste el script? → Debe decir "Permisos agregados"
- [ ] ¿Cerraste sesión? → IMPORTANTE: Debes cerrar sesión
- [ ] ¿Iniciaste sesión de nuevo? → Los permisos se cargan al iniciar sesión
- [ ] ¿El script mostró "Permisos agregados"? → Si mostró "ya existe", no hay problema

Si aún tienes errores 403, verifica qué permiso específico falta:

```javascript
// En consola del navegador (F12)
const user = JSON.parse(localStorage.getItem('user'));
console.log('Permisos del usuario:', user.permissions);
```

Busca si incluye: `warehouses.read`, `resolutions.read`, etc.

---

## 🎯 Verificación Final

Después de ejecutar el script y volver a iniciar sesión, abre la consola (F12) y deberías ver:

```
✅ Productos cargados: 1018
✅ Clientes cargados: 423
✅ Vendedores cargados: 3
✅ Bodegas cargadas: X
✅ Resolución activa cargada
✅ Categorías cargadas: X
✅ Tasas de impuesto cargadas: X
```

**Sin errores 403**

---

## 📝 Checklist Completo

- [ ] Script ejecutado: `node add-pos-permissions-to-cashier.js`
- [ ] Script mostró: "Permisos agregados exitosamente"
- [ ] Sesión cerrada en el navegador
- [ ] Iniciado sesión con vendedor de nuevo
- [ ] Redirige a POS Facturación
- [ ] NO hay errores 403 en consola
- [ ] Productos se cargan correctamente
- [ ] Clientes se cargan correctamente
- [ ] Bodegas se cargan correctamente
- [ ] Resolución se carga correctamente

---

## ✅ Todo Listo

Si todos los checkboxes están marcados:

🎉 **¡El vendedor ahora puede usar el POS completamente!**

Puede:
- ✅ Ver productos
- ✅ Ver clientes
- ✅ Seleccionar bodega
- ✅ Crear facturas
- ✅ Aplicar cupones y ofertas
- ✅ Hacer devoluciones
- ✅ Crear guías de remisión
- ✅ Hacer arqueo de caja

---

**Fecha:** 2026-01-24
**Archivo del script:** `backend/add-pos-permissions-to-cashier.js`
