# 🚀 Instrucciones de Configuración - ProsperPOS

## Problema Actual
Las vistas de **Categorías**, **Subcategorías** y **Marcas** no muestran datos debido a que:
1. La tabla `products` no tiene la columna `brand_id`
2. Faltan rutas `/active` para categories y brands en el backend
3. No hay datos de ejemplo en la base de datos

## ✅ Solución Implementada

### 1. **Ejecutar Script de Corrección de Base de Datos**

Primero, ejecuta el script para agregar la columna `brand_id`:

```bash
# Opción 1: Desde línea de comandos
cd backend
mysql -u root -p prosperpos < scripts/fix-database.sql

# Opción 2: Desde MySQL Workbench
# 1. Abrir MySQL Workbench
# 2. Conectarse a la base de datos
# 3. Abrir el archivo: backend/scripts/fix-database.sql
# 4. Ejecutar el script completo (⚡ icono de rayo)
```

### 2. **Insertar Datos de Ejemplo**

Después de corregir la base de datos, inserta los datos de ejemplo:

**IMPORTANTE**: Usa el archivo `seed-data-uuid.sql` (NO el `seed-data-auto-id.sql`) porque tu base de datos usa VARCHAR(36) para los IDs.

```bash
# Opción 1: Desde línea de comandos
mysql -u root -p prosperpos < backend/scripts/seed-data-uuid.sql

# Opción 2: Desde MySQL Workbench (RECOMENDADO)
# 1. Abrir el archivo: backend/scripts/seed-data-uuid.sql
# 2. Ejecutar el script completo (icono ⚡)
```

Esto insertará:
- ✅ 10 Categorías principales
- ✅ 30 Subcategorías
- ✅ 22 Marcas

### 3. **Reiniciar el Servidor Backend**

```bash
cd backend
npm run dev
```

O si está corriendo, detenerlo (Ctrl+C) y volver a iniciarlo.

### 4. **Actualizar el Frontend**

El frontend ya está actualizado con los cambios:
- ✅ [brand-list.vue](template/src/views/pages/inventory/brand-list.vue) - Conectado al backend
- ✅ [sub-categories.vue](template/src/views/pages/inventory/sub-categories.vue) - Conectado al backend
- ✅ [category-list.vue](template/src/views/pages/inventory/category-list.vue) - Ya funcionaba

Si el frontend está corriendo, refrescar la página (F5).

## 📋 Archivos Modificados/Creados

### Backend

#### Scripts SQL
- ✅ `backend/scripts/fix-database.sql` - Agrega columna brand_id
- ✅ `backend/scripts/seed-data.sql` - Datos de ejemplo

#### Rutas
- ✅ `backend/src/routes/category.routes.js` - Agregada ruta `/active`
- ✅ `backend/src/routes/brand.routes.js` - Agregada ruta `/active`
- ✅ `backend/src/routes/subcategory.routes.js` - NUEVO ARCHIVO

#### Controladores
- ✅ `backend/src/controllers/brand.controller.js` - Método `getActiveBrands()`
- ✅ `backend/src/controllers/subcategory.controller.js` - NUEVO ARCHIVO

#### Servicios
- ✅ `backend/src/services/brand.service.js` - Métodos con manejo de errores
- ✅ `backend/src/services/category.service.js` - Método `getActiveCategories()`
- ✅ `backend/src/services/subcategory.service.js` - NUEVO ARCHIVO

#### Middleware
- ✅ `backend/src/middleware/validation.middleware.js` - Validaciones de subcategorías

### Frontend
- ✅ `template/src/views/pages/inventory/brand-list.vue` - Actualizado
- ✅ `template/src/views/pages/inventory/sub-categories.vue` - Actualizado

## 🔍 Verificación

Después de seguir los pasos, verifica que todo funcione:

### 1. Verificar Base de Datos
```sql
-- Verificar columna brand_id
DESCRIBE products;

-- Verificar datos insertados
SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL;
SELECT COUNT(*) as total FROM brands WHERE deleted_at IS NULL;

-- Ver categorías y subcategorías
SELECT
    c.name as categoria,
    (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id) as subcategorias
FROM categories c
WHERE c.parent_id IS NULL;
```

### 2. Verificar Backend
```bash
# El servidor debe estar corriendo sin errores
# Verificar que responda:
curl http://localhost:3000/api/health
```

### 3. Verificar Endpoints
Probar en el navegador o Postman (necesitas estar autenticado):

- `GET http://localhost:3000/api/v1/categories?page=1&limit=10`
- `GET http://localhost:3000/api/v1/categories/active`
- `GET http://localhost:3000/api/v1/subcategories?page=1&limit=10`
- `GET http://localhost:3000/api/v1/brands?page=1&limit=10`
- `GET http://localhost:3000/api/v1/brands/active`

### 4. Verificar Frontend
Navegar a:
- Categorías: debería mostrar 10 categorías
- Subcategorías: debería mostrar 30 subcategorías
- Marcas: debería mostrar 25 marcas

## ⚠️ Solución de Problemas

### Error: "Unknown column 'p.brand_id'"
**Solución**: No ejecutaste el script `fix-database.sql`. Ejecútalo ahora.

### Error: "Categorías no encontradas"
**Solución**: No ejecutaste el script `seed-data.sql`. Ejecútalo ahora.

### Error 500 en `/active`
**Solución**: Reinicia el servidor backend.

### No aparecen datos en el frontend
**Solución**:
1. Verifica que el backend esté corriendo
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que estés autenticado
4. Verifica que tu usuario tenga los permisos necesarios

## 📊 Estructura de Datos Insertados

### Categorías (10)
1. Electrónica
2. Ropa y Calzado
3. Hogar y Muebles
4. Deportes
5. Alimentos y Bebidas
6. Salud y Belleza
7. Juguetes y Juegos
8. Librería y Papelería
9. Mascotas
10. Automotriz

### Subcategorías (30)
- 6 por cada categoría principal
- Ejemplos: "Celulares y Smartphones", "Ropa de Hombre", "Muebles de Sala", etc.

### Marcas (25)
- Samsung, Apple, Huawei, Lenovo, HP, Dell, LG, Sony
- Nike, Adidas, Puma, Zara, H&M, Levis
- IKEA, Whirlpool, Mabe
- Xiaomi, Motorola
- Coca-Cola, Pepsi, Nestlé, Bimbo, Sabritas
- Genérica

## 🎯 Próximos Pasos Opcionales

1. Implementar modales de crear/editar/eliminar para cada vista
2. Agregar validaciones adicionales
3. Implementar exportación a PDF/Excel
4. Agregar imágenes a las categorías y marcas
5. Implementar búsqueda avanzada

## 📞 Soporte

Si encuentras problemas adicionales:
1. Revisa los logs del backend: `backend/backend.log`
2. Revisa la consola del navegador (F12)
3. Verifica que todas las dependencias estén instaladas:
   ```bash
   cd backend && npm install
   cd template && npm install
   ```

---

✅ Una vez completados todos los pasos, tu sistema ProsperPOS debería mostrar correctamente las categorías, subcategorías y marcas.
