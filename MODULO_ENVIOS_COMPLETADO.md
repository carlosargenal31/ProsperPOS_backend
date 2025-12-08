# MÓDULO DE ENVÍOS Y GUÍAS DE REMISIÓN - COMPLETADO ✅

## 📦 Resumen del Módulo

Se ha implementado exitosamente un módulo completo para la gestión de **Envíos, Guías de Remisión y Comprobantes de Entrega** en el sistema ProsperPOS.

Este módulo permite:
- Crear y gestionar guías de remisión
- Registrar múltiples receptores (principal + 2 alternativos)
- Gestionar información detallada de origen y destino
- Hacer seguimiento del estado de envíos
- Integración con vehículos y conductores
- Control de paquetes y mercancía

---

## 🗂️ Estructura de Archivos Creados

### Backend

#### 1. Base de Datos
**Archivo:** `backend/database/create-shipments-table.sql`
- Tabla `shipments`: Almacena toda la información de los envíos
- Tabla `shipment_items`: Almacena los ítems/productos de cada envío
- Incluye índices para optimización de consultas
- Relaciones con: customers, warehouses, branches, vehicles, users

**Campos Principales de la tabla `shipments`:**
- **Documento:** shipment_number, document_type, status, emission_date
- **Cliente:** customer_id, customer_name, customer_phone, customer_document
- **Receptor Principal:** receiver_name, receiver_phone, receiver_id_document
- **Receptor Alternativo 1:** receiver_alt_name, receiver_alt_phone, receiver_alt_id_document
- **Receptor Alternativo 2:** receiver_alt2_name, receiver_alt2_phone, receiver_alt2_id_document
- **Origen:** origin_warehouse_id, origin_address, origin_city, origin_state, origin_country
- **Destino:** destination_address, destination_reference, destination_city, destination_state, destination_coordinates
- **Conductor/Vehículo:** driver_name, driver_phone, vehicle_id, vehicle_plate
- **Fechas:** emission_date, estimated_delivery_date, actual_delivery_date
- **Otros:** package_quantity, total_weight, declared_value, notes, special_instructions

#### 2. Modelo
**Archivo:** `backend/src/models/shipment.model.js`

Funciones implementadas:
- `getAll(filters)` - Obtener todos los envíos con filtros
- `getById(id)` - Obtener envío por ID con todos sus detalles
- `getByShipmentNumber(shipmentNumber)` - Buscar por número de guía
- `create(shipmentData)` - Crear nuevo envío con ítems
- `update(id, shipmentData)` - Actualizar envío existente
- `delete(id)` - Eliminar envío
- `updateStatus(id, status, userId)` - Cambiar estado del envío
- `generateShipmentNumber()` - Generar número de guía automático (GR-####)
- `getStatistics(filters)` - Obtener estadísticas de envíos

#### 3. Servicio
**Archivo:** `backend/src/services/shipment.service.js`

Lógica de negocio:
- Validaciones de datos requeridos
- Control de transiciones de estado
- Generación automática de números de guía
- Integración con facturas
- Validación de permisos

#### 4. Controlador
**Archivo:** `backend/src/controllers/shipment.controller.js`

Endpoints HTTP:
- `GET /api/v1/shipments` - Listar todos los envíos
- `GET /api/v1/shipments/:id` - Ver detalle de un envío
- `POST /api/v1/shipments` - Crear nuevo envío
- `PUT /api/v1/shipments/:id` - Actualizar envío
- `DELETE /api/v1/shipments/:id` - Eliminar envío
- `PATCH /api/v1/shipments/:id/status` - Actualizar solo el estado
- `GET /api/v1/shipments/generate-number` - Generar número de guía
- `GET /api/v1/shipments/statistics` - Obtener estadísticas
- `POST /api/v1/shipments/from-invoice/:invoiceId` - Crear desde factura

#### 5. Rutas
**Archivo:** `backend/src/routes/shipment.routes.js`
- Todas las rutas protegidas con autenticación
- Registradas en `backend/src/routes/index.js` bajo `/v1/shipments`

---

### Frontend

#### 1. Vista Principal
**Archivo:** `template/src/views/pages/shipments/shipments-list.vue`

Características:
- Tabla de envíos con paginación
- Panel de estadísticas (Total, Pendientes, En Camino, Entregados)
- Filtros por estado y búsqueda
- Acciones rápidas (Ver, Editar, Imprimir, Cambiar Estado, Eliminar)
- Indicadores visuales de estado con badges de colores
- Integración con SweetAlert2 para confirmaciones

#### 2. Modal de Creación/Edición
**Archivo:** `template/src/views/pages/shipments/shipment-modal.vue`

Secciones del formulario:
1. **Información del Documento**
   - Número de guía (auto-generado)
   - Tipo de documento (Guía de Remisión, Comprobante de Entrega, Despacho)
   - Fecha de emisión

2. **Información del Cliente**
   - Selector de cliente o captura manual
   - Nombre, teléfono y documento del cliente

3. **Receptor Principal** (REQUERIDO)
   - Nombre completo
   - Teléfono/Celular
   - Documento de identidad

4. **Receptor Alternativo 1** (Opcional)
   - Nombre alternativo
   - Teléfono alternativo
   - Documento alternativo

5. **Receptor Alternativo 2** (Opcional)
   - Segundo nombre alternativo
   - Segundo teléfono alternativo
   - Segundo documento alternativo

6. **Lugar de Partida/Origen**
   - Selector de bodega (auto-completa dirección)
   - Selector de sucursal
   - Dirección completa de partida
   - Ciudad, departamento y país de origen

7. **Lugar de Destino**
   - Dirección completa de destino
   - Referencias adicionales del lugar
   - Ciudad, departamento y país de destino
   - Coordenadas GPS (opcional)

8. **Conductor y Vehículo**
   - Selector de vehículo (auto-completa datos)
   - Placa del vehículo
   - Nombre y teléfono del conductor
   - Cédula y licencia del conductor

9. **Fechas y Tiempos**
   - Fecha estimada de entrega
   - Hora de salida
   - Cantidad de paquetes

10. **Notas e Instrucciones Especiales**
    - Notas generales
    - Instrucciones específicas

#### 3. Integración en el Router
**Archivo:** `template/src/router/index.js`
- Ruta registrada: `/shipments`
- Componente: [shipments-list.vue](template/src/views/pages/shipments/shipments-list.vue)

#### 4. Menú Sidebar
**Archivo:** `template/src/assets/json/sidebar.json`
- Ubicación: Ventas > Procesos > Guías de Remisión
- Icono y enlace configurados

**Archivo:** `template/src/views/layouts/vertical-sidebar.vue`
- Permisos configurados para el módulo 'shipments'

---

## 🎯 Características Implementadas

### ✅ Gestión de Receptores
- **Receptor Principal:** Persona que recibe el envío (REQUERIDO)
  - Nombre completo
  - Teléfono/celular
  - Documento de identidad

- **Receptor Alternativo 1:** Contacto de respaldo (OPCIONAL)
  - Útil cuando el receptor principal no está disponible
  - Todos los datos del receptor

- **Receptor Alternativo 2:** Tercer contacto (OPCIONAL)
  - Segundo respaldo para asegurar la entrega
  - Todos los datos del receptor

### ✅ Gestión de Ubicaciones
- **Origen:**
  - Selección de bodega (auto-completa dirección)
  - Selección de sucursal
  - Dirección completa personalizable
  - Ciudad, departamento y país

- **Destino:**
  - Dirección completa de entrega
  - Referencias adicionales (color de casa, cerca de..., etc.)
  - Ciudad, departamento y país
  - Coordenadas GPS opcionales para GPS del conductor

### ✅ Estados del Envío
1. **Pendiente** (Badge Amarillo) - Envío creado, esperando salida
2. **En Camino** (Badge Azul) - Envío en tránsito
3. **Entregado** (Badge Verde) - Envío completado
4. **Cancelado** (Badge Rojo) - Envío cancelado

### ✅ Validaciones de Negocio
- No se puede cambiar el estado de un envío ya entregado
- No se puede eliminar un envío entregado
- Los envíos cancelados solo pueden volver a estado pendiente
- Campos requeridos validados en backend y frontend

### ✅ Integración con Otros Módulos
- **Clientes:** Autocompletado de datos del cliente
- **Bodegas:** Selección de bodega de origen con dirección
- **Sucursales:** Selección de sucursal de origen
- **Vehículos:** Selección de vehículo con auto-completado
- **Usuarios:** Registro de quién crea y entrega

---

## 📊 Estadísticas Disponibles

El módulo proporciona estadísticas en tiempo real:
- Total de envíos
- Envíos pendientes
- Envíos en camino
- Envíos entregados
- Envíos cancelados
- Valor total declarado de mercancía

---

## 🔐 Seguridad y Permisos

- Todas las rutas del backend requieren autenticación
- Sistema de permisos basado en módulos
- Auditoría de creación y modificación con usuarios
- Validación de datos en backend y frontend

---

## 📱 Interfaz de Usuario

### Diseño Responsive
- Compatible con dispositivos móviles
- Adaptado para tablets y escritorio
- Modal scrollable para formularios largos

### Experiencia de Usuario
- Auto-generación de números de guía
- Auto-completado de datos desde otras entidades
- Validación en tiempo real
- Mensajes de confirmación con SweetAlert2
- Indicadores visuales de estado
- Tooltips informativos

---

## 🚀 Cómo Usar el Módulo

### 1. Crear un Nuevo Envío

1. Ir a **Ventas > Procesos > Guías de Remisión**
2. Clic en **"Nuevo Envío"**
3. El número de guía se genera automáticamente
4. Llenar los datos del cliente
5. **IMPORTANTE:** Llenar datos del receptor principal:
   - Nombre de quien va a recibir
   - Teléfono de contacto (REQUERIDO)
   - Documento de identidad (opcional pero recomendado)
6. **OPCIONAL:** Agregar receptores alternativos
   - Receptor alternativo 1 (si el principal no está)
   - Receptor alternativo 2 (tercer respaldo)
7. Seleccionar bodega/sucursal de origen o escribir dirección manual
8. Escribir dirección completa de destino
9. Agregar referencias del lugar (color de casa, cerca de..., etc.)
10. Seleccionar conductor y vehículo (si aplica)
11. Agregar notas e instrucciones especiales
12. Guardar

### 2. Gestionar Estados

- **Marcar En Camino:** Cuando el envío sale
- **Marcar Entregado:** Cuando se completa la entrega
- El sistema registra automáticamente fecha y usuario

### 3. Consultar Envíos

- Buscar por número de guía
- Filtrar por estado
- Ver estadísticas generales
- Imprimir guías de remisión

---

## 🔄 Flujo de Trabajo Recomendado

1. **Crear Envío** → Estado: Pendiente
2. **Asignar Conductor y Vehículo** (si no se hizo antes)
3. **Marcar como "En Camino"** → Al momento de salir
4. **Marcar como "Entregado"** → Al completar la entrega
   - Sistema registra fecha/hora de entrega
   - Sistema registra usuario que confirmó

---

## 🎨 Iconos Utilizados

- 📦 `ti-package` - Envíos en general
- 🚚 `ti-truck-delivery` - En camino
- ✅ `ti-check` - Entregado
- ⏰ `ti-clock` - Pendiente
- 📍 `ti-map-pin` - Ubicaciones
- 👤 `ti-user-check` - Receptores
- 🚗 `ti-truck` - Vehículos
- 📝 `ti-notes` - Notas

---

## ⚙️ Configuración Técnica

### Base de Datos
```sql
-- Ejecutar el archivo SQL para crear las tablas:
mysql -u root -p[PASSWORD] prosperpos < backend/database/create-shipments-table.sql
```

### Backend
Las rutas están disponibles en:
```
http://localhost:3000/api/v1/shipments
```

### Frontend
Acceder desde el menú:
```
Ventas > Procesos > Guías de Remisión
```

O directamente en:
```
http://localhost:8080/shipments
```

---

## 📋 Próximas Mejoras Sugeridas

### Funcionalidades Adicionales
1. **Integración con Facturas:**
   - Crear envío automáticamente desde una factura
   - Vincular envíos con facturas de venta

2. **Impresión de Guías:**
   - Plantilla de impresión profesional
   - Código QR para seguimiento
   - Código de barras del número de guía

3. **Seguimiento en Tiempo Real:**
   - Actualización de ubicación GPS
   - Notificaciones SMS al receptor
   - Portal de seguimiento para clientes

4. **Firma Digital:**
   - Captura de firma del receptor
   - Foto de evidencia de entrega
   - Almacenamiento seguro de comprobantes

5. **Reportes Avanzados:**
   - Eficiencia de entregas por conductor
   - Tiempos promedio de entrega por zona
   - Análisis de rutas más utilizadas

6. **Integración con Mapas:**
   - Visualización de rutas en mapa
   - Optimización de rutas de entrega
   - Cálculo automático de distancias

---

## 🐛 Troubleshooting

### Error al crear envío
- Verificar que la tabla `shipments` existe
- Verificar conexión a base de datos
- Revisar permisos del usuario de MySQL

### No aparece en el menú
- Verificar que `sidebar.json` tiene la ruta correcta
- Limpiar caché del navegador
- Verificar permisos del usuario logueado

### Error 404 en API
- Verificar que el backend está corriendo
- Verificar que las rutas están registradas en `index.js`
- Verificar puerto del backend (por defecto 3000)

---

## 👨‍💻 Desarrollado Por

**Carlos Argeñal**
ProsperPOS - Sistema de Punto de Venta
Fecha: 17 de Noviembre de 2025

---

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contactar al equipo de desarrollo.

---

**¡El módulo de Envíos y Guías de Remisión está completamente funcional y listo para usar! 🎉**
