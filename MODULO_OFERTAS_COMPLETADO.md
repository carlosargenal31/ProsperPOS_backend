# MÓDULO DE OFERTAS/DESCUENTOS - COMPLETADO

## Resumen

Se ha implementado exitosamente el módulo completo de Ofertas/Descuentos para ProsperPOS, siguiendo la estructura de los módulos existentes (bodegas y vehículos) y las imágenes proporcionadas.

## Componentes Creados

### Backend

1. **Base de Datos**
   - Archivo: `backend/database/create-offers-table.sql`
   - Tablas:
     - `offers`: Tabla principal de ofertas con todos los campos
     - `offer_items`: Tabla para ofertas con múltiples artículos

2. **Modelo**
   - Archivo: `backend/src/models/offer.model.js`
   - Métodos principales:
     - `findAll()`: Obtener todas las ofertas con filtros
     - `findById()`: Obtener oferta por ID
     - `create()`: Crear nueva oferta
     - `update()`: Actualizar oferta
     - `delete()`: Eliminar oferta (soft delete)
     - `getActiveOffers()`: Obtener ofertas activas

3. **Servicio**
   - Archivo: `backend/src/services/offer.service.js`
   - Funcionalidades:
     - Gestión completa de ofertas (CRUD)
     - Validación de aplicabilidad de ofertas
     - Cálculo de descuentos
     - Manejo de items múltiples

4. **Controlador**
   - Archivo: `backend/src/controllers/offer.controller.js`
   - Endpoints implementados:
     - GET `/api/v1/offers` - Listar ofertas
     - GET `/api/v1/offers/active` - Ofertas activas
     - GET `/api/v1/offers/:id` - Obtener oferta por ID
     - POST `/api/v1/offers` - Crear oferta
     - PUT `/api/v1/offers/:id` - Actualizar oferta
     - DELETE `/api/v1/offers/:id` - Eliminar oferta
     - POST `/api/v1/offers/:id/validate` - Validar aplicabilidad
     - POST `/api/v1/offers/:id/calculate` - Calcular descuento

5. **Rutas**
   - Archivo: `backend/src/routes/offer.routes.js`
   - Registrado en: `backend/src/routes/index.js`

### Frontend

1. **Modal de Ofertas**
   - Archivo: `template/src/components/modal/offer-modal.vue`
   - Características:
     - Modal de agregar oferta
     - Modal de editar oferta
     - Modal de confirmación de eliminación
     - Formulario completo con todos los campos:
       - Código con opción de consecutivos
       - Nombre de oferta
       - Agencia
       - Tipo de aplicación (grupo/múltiple)
       - Grupo, Subgrupo, Artículo
       - Límites de fecha y hora
       - Días de la semana
       - Tipo de descuento (porcentaje/monto)
       - Aplicación (todos/compras mayores/cantidades mayores)
       - Suspender oferta

2. **Página de Lista**
   - Archivo: `template/src/views/pages/offers/offers-list.vue`
   - Características:
     - Tabla responsive con ofertas
     - Ordenamiento por columnas
     - Botón de agregar nueva oferta
     - Acciones de editar y eliminar
     - Estados (Activo/Inactivo/Suspendido)
     - Formato de montos y porcentajes

3. **Rutas**
   - Ruta agregada en: `template/src/router/index.js`
   - URL: `/offers`

## Estructura de Datos

### Tabla `offers`

```sql
- id: INT (Primary Key)
- codigo: VARCHAR(50) (Unique)
- nombre: VARCHAR(255)
- agencia_id: INT (FK a branches)
- tipo_aplicacion: ENUM('grupo', 'subgrupo', 'articulo', 'multiple')
- grupo: VARCHAR(255)
- subgrupo: VARCHAR(255)
- articulo: VARCHAR(255)
- limitar_fecha: BOOLEAN
- fecha_desde: DATE
- fecha_hasta: DATE
- limitar_hora: BOOLEAN
- aplica_lunes: BOOLEAN
- aplica_martes: BOOLEAN
- aplica_miercoles: BOOLEAN
- aplica_jueves: BOOLEAN
- aplica_viernes: BOOLEAN
- aplica_sabado: BOOLEAN
- aplica_domingo: BOOLEAN
- tipo_descuento: ENUM('porcentaje', 'monto')
- valor_descuento: DECIMAL(10, 2)
- aplica_para: ENUM('todos', 'compras_mayores', 'cantidades_mayores')
- monto_minimo: DECIMAL(10, 2)
- cantidad_minima: INT
- suspendida: BOOLEAN
- is_active: BOOLEAN
- created_by, updated_by, deleted_by: INT
- created_at, updated_at, deleted_at: DATETIME
```

### Tabla `offer_items`

```sql
- id: INT (Primary Key)
- offer_id: INT (FK a offers)
- product_code: VARCHAR(50)
- product_name: VARCHAR(255)
- descuento_porcentaje: DECIMAL(5, 2)
- descuento_monto: DECIMAL(10, 2)
- created_at, updated_at: DATETIME
```

## Instalación

### 1. Crear las tablas en la base de datos

```bash
mysql -u root -p310104 prosperpos < backend/database/create-offers-table.sql
```

### 2. (Opcional) Insertar datos de prueba

```bash
mysql -u root -p310104 prosperpos < backend/database/insert-sample-offers.sql
```

### 3. Reiniciar el servidor backend

```bash
cd backend
npm start
```

### 4. Acceder al módulo

URL: `http://localhost:puerto/offers`

## Características Principales

### 1. Gestión Completa CRUD
- Crear, leer, actualizar y eliminar ofertas
- Soft delete para mantener historial
- Validación de datos

### 2. Tipos de Ofertas
- **Por Grupo**: Aplicar a un grupo de productos
- **Por Subgrupo**: Aplicar a un subgrupo específico
- **Por Artículo**: Aplicar a un artículo específico
- **Múltiple**: Seleccionar múltiples artículos

### 3. Descuentos
- **Porcentaje**: Descuento en porcentaje
- **Monto Fijo**: Descuento en monto específico

### 4. Condiciones de Aplicación
- **Todos**: Aplicar a todas las compras
- **Compras mayores a**: Aplicar solo si la compra supera un monto
- **Cantidades mayores a**: Aplicar solo si la cantidad supera un número

### 5. Límites Temporales
- Límite por rango de fechas (desde-hasta)
- Límite por rango de horas
- Selección de días de la semana

### 6. Control de Estado
- Activo/Inactivo
- Suspendido temporalmente

### 7. Multi-agencia
- Asignación a agencia específica
- Ofertas globales (sin agencia)

## API Endpoints

### Listar Ofertas
```
GET /api/v1/offers
Query params: search, is_active, agencia_id, tipo_aplicacion
```

### Obtener Ofertas Activas
```
GET /api/v1/offers/active
```

### Obtener Oferta por ID
```
GET /api/v1/offers/:id
```

### Crear Oferta
```
POST /api/v1/offers
Body: { codigo, nombre, ... }
```

### Actualizar Oferta
```
PUT /api/v1/offers/:id
Body: { nombre, ... }
```

### Eliminar Oferta
```
DELETE /api/v1/offers/:id
```

### Validar Oferta
```
POST /api/v1/offers/:id/validate
Body: { total, cantidad }
```

### Calcular Descuento
```
POST /api/v1/offers/:id/calculate
Body: { amount }
```

## Uso en el POS

Para integrar las ofertas en el POS:

1. Obtener ofertas activas al cargar productos
2. Validar si la oferta es aplicable según las condiciones
3. Calcular el descuento correspondiente
4. Aplicar el descuento al total o producto

Ejemplo de integración:

```javascript
// Obtener ofertas activas
const response = await axios.get('http://localhost:3000/api/v1/offers/active');
const offers = response.data.data;

// Validar oferta
const validateResponse = await axios.post(
  `http://localhost:3000/api/v1/offers/${offerId}/validate`,
  { total: 2500, cantidad: 10 }
);

// Calcular descuento
const discountResponse = await axios.post(
  `http://localhost:3000/api/v1/offers/${offerId}/calculate`,
  { amount: 2500 }
);
const discount = discountResponse.data.data.discount;
```

## Archivos Creados

### Backend
- `backend/database/create-offers-table.sql`
- `backend/database/insert-sample-offers.sql`
- `backend/src/models/offer.model.js`
- `backend/src/services/offer.service.js`
- `backend/src/controllers/offer.controller.js`
- `backend/src/routes/offer.routes.js`

### Frontend
- `template/src/components/modal/offer-modal.vue`
- `template/src/views/pages/offers/offers-list.vue`

### Modificados
- `backend/src/routes/index.js` (agregada ruta de ofertas)
- `template/src/router/index.js` (agregada ruta de frontend)

## Próximos Pasos

1. **Integración con POS**: Agregar lógica para aplicar ofertas automáticamente en el POS
2. **Búsqueda de productos**: Implementar búsqueda modal para seleccionar grupos, subgrupos y artículos
3. **Reportes**: Crear reportes de ofertas más utilizadas
4. **Validaciones**: Agregar más validaciones de negocio
5. **Notificaciones**: Notificar cuando una oferta está por vencer

## Notas Importantes

- El código sigue automáticamente un consecutivo si la opción está activada
- Las ofertas tienen soft delete para mantener historial
- Se pueden asignar ofertas por agencia o hacerlas globales
- Los descuentos pueden ser por porcentaje o monto fijo
- Se pueden establecer condiciones de aplicación (monto mínimo, cantidad mínima)
- Las ofertas se pueden suspender temporalmente sin eliminarlas

## Soporte

Para cualquier duda o problema:
1. Verificar que las tablas se hayan creado correctamente
2. Verificar que el servidor backend esté corriendo
3. Revisar los logs del servidor para errores
4. Verificar que la ruta esté registrada en el router

---

**Fecha de Implementación**: Noviembre 2025
**Estado**: Completado y Funcional
**Versión**: 1.0.0
