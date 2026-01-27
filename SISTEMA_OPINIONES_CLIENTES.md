# Sistema de Gestión de Opiniones de Clientes

## Descripción General

Este sistema permite gestionar las opiniones y consultas que los clientes envían a través del formulario de contacto en la tienda online. Los administradores pueden ver todas las opiniones, responderlas y enviar automáticamente la respuesta por email al cliente.

## Características Principales

✅ **Formulario Público**: Los clientes pueden enviar sus opiniones sin necesidad de iniciar sesión
✅ **Panel de Administración**: Vista completa de todas las opiniones con filtros y paginación
✅ **Respuestas por Email**: Los administradores pueden responder y el sistema envía automáticamente un email al cliente
✅ **Sistema de Estados**: Las opiniones pueden estar "pendiente" o "respondido"
✅ **Estadísticas**: Vista general con métricas de opiniones
✅ **Permisos**: Control de acceso basado en permisos (ver, responder, eliminar)

## Tipos de Consulta Disponibles

El sistema ha filtrado las siguientes opciones del formulario original:

### ❌ Opciones Eliminadas:
- Resolución de dudas x BOC
- Línea en OV pendiente de facturación
- Reposición de producto dañado
- Reposición de producto por calidad
- Entrega en dirección incorrecta
- Entregas de producto incorrecto
- Orden no entregada
- Factura incorrecta
- Servicio - No contestan en Extensión
- Confirmación de pagos a proveedores
- Horarios para entrega de contraseñas de pago
- Referencias personales comerciales
- Recepción parcial por el cliente
- Reposición producto dañado en tarima sellada

### ✅ Opciones Activas:
- Otra
- Seguimiento con Asesor
- Cotización no fue recibida/enviada
- Factura - no fue recibida/enviada
- Factura - incorrecta
- Servicio - Asesor no responde
- Servicio - Asesor no da seguimiento
- Servicio - Tiempo de entrega en bodega
- Servicio - No atienden en Tienda

## API Endpoints

### Endpoint Público (Sin autenticación)

#### 1. Crear Nueva Opinión
```http
POST /api/v1/opinions
Content-Type: application/json

{
  "name": "Juan",
  "lastname": "Pérez",
  "email": "juan.perez@example.com",
  "inquiry_type": "Seguimiento con Asesor",
  "message": "Necesito información sobre el estado de mi pedido #1234"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Tu opinión ha sido enviada exitosamente. Te responderemos pronto.",
  "data": {
    "id": 1,
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan.perez@example.com",
    "inquiry_type": "Seguimiento con Asesor",
    "message": "Necesito información sobre el estado de mi pedido #1234",
    "status": "pendiente",
    "created_at": "2026-01-13T14:00:00.000Z"
  }
}
```

---

### Endpoints Privados (Requieren autenticación de administrador)

#### 2. Obtener Todas las Opiniones
```http
GET /api/v1/opinions?status=pendiente&page=1&limit=20
Authorization: Bearer {token}
```

**Parámetros de consulta:**
- `status` (opcional): `pendiente` o `respondido`
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Cantidad por página (default: 50)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Juan",
      "lastname": "Pérez",
      "email": "juan.perez@example.com",
      "inquiry_type": "Seguimiento con Asesor",
      "message": "Necesito información sobre el estado de mi pedido #1234",
      "status": "pendiente",
      "admin_response": null,
      "admin_user_id": null,
      "admin_name": null,
      "admin_email": null,
      "responded_at": null,
      "created_at": "2026-01-13T14:00:00.000Z",
      "updated_at": "2026-01-13T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### 3. Obtener Opinión por ID
```http
GET /api/v1/opinions/1
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan.perez@example.com",
    "inquiry_type": "Seguimiento con Asesor",
    "message": "Necesito información sobre el estado de mi pedido #1234",
    "status": "pendiente",
    "admin_response": null,
    "admin_user_id": null,
    "admin_name": null,
    "admin_email": null,
    "responded_at": null,
    "created_at": "2026-01-13T14:00:00.000Z",
    "updated_at": "2026-01-13T14:00:00.000Z"
  }
}
```

#### 4. Responder a una Opinión
```http
POST /api/v1/opinions/1/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "admin_response": "Hola Juan, tu pedido #1234 está en proceso de envío y llegará en 2-3 días hábiles. Puedes rastrearlo con el código de seguimiento: ABC123XYZ."
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Opinión respondida exitosamente",
  "data": {
    "id": 1,
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan.perez@example.com",
    "inquiry_type": "Seguimiento con Asesor",
    "message": "Necesito información sobre el estado de mi pedido #1234",
    "status": "respondido",
    "admin_response": "Hola Juan, tu pedido #1234 está en proceso de envío...",
    "admin_user_id": 1,
    "admin_name": "Administrador",
    "admin_email": "admin@prosperpos.com",
    "responded_at": "2026-01-13T14:30:00.000Z",
    "created_at": "2026-01-13T14:00:00.000Z",
    "updated_at": "2026-01-13T14:30:00.000Z"
  },
  "email_sent": true
}
```

**Nota:** Al responder, se envía automáticamente un email al cliente con la respuesta.

#### 5. Actualizar Estado de Opinión
```http
PATCH /api/v1/opinions/1/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "pendiente"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    "id": 1,
    "status": "pendiente",
    ...
  }
}
```

#### 6. Eliminar Opinión
```http
DELETE /api/v1/opinions/1
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Opinión eliminada exitosamente"
}
```

#### 7. Obtener Estadísticas
```http
GET /api/v1/opinions/stats
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 150,
      "pendientes": 25,
      "respondidas": 125,
      "tipos_consulta": 8
    },
    "by_type": [
      {
        "inquiry_type": "Seguimiento con Asesor",
        "count": 45
      },
      {
        "inquiry_type": "Servicio - Asesor no responde",
        "count": 30
      },
      ...
    ],
    "recent": [
      {
        "id": 150,
        "name": "María",
        "lastname": "González",
        "inquiry_type": "Seguimiento con Asesor",
        "created_at": "2026-01-13T14:30:00.000Z",
        "status": "pendiente"
      },
      ...
    ]
  }
}
```

## Estructura de la Base de Datos

### Tabla: `customer_opinions`

```sql
CREATE TABLE customer_opinions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  inquiry_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pendiente', 'respondido') DEFAULT 'pendiente',
  admin_response TEXT NULL,
  admin_user_id INT NULL,
  responded_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Permisos

El sistema utiliza 3 permisos específicos:

| Slug | Nombre | Descripción |
|------|--------|-------------|
| `opinions.read` | Ver Opiniones | Ver opiniones de clientes |
| `opinions.update` | Responder Opiniones | Responder opiniones de clientes |
| `opinions.delete` | Eliminar Opiniones | Eliminar opiniones de clientes |

Los permisos están asignados automáticamente al rol de **Administrador**.

## Email Automático de Respuesta

Cuando un administrador responde una opinión, el sistema envía automáticamente un email al cliente con:

- Nombre del cliente
- Tipo de consulta realizada
- Mensaje original del cliente
- Respuesta del administrador
- Diseño profesional con formato HTML

El email incluye:
- Encabezado con gradiente
- Mensaje original en un cuadro destacado
- Respuesta del administrador en un cuadro diferenciado
- Footer con información de la empresa

## Instalación y Configuración

### 1. Ejecutar Migraciones

```bash
cd backend
node create-customer-opinions-table.js
node add-opinion-permissions.js
```

### 2. Verificar Configuración SMTP

Asegúrate de tener configurado el SMTP en la tabla `ecommerce_settings`:

```sql
INSERT INTO ecommerce_settings (setting_key, setting_value) VALUES
('smtp_host', 'smtp.gmail.com'),
('smtp_port', '587'),
('smtp_user', 'tu-email@gmail.com'),
('smtp_password', 'tu-contraseña'),
('store_email', 'tu-email@gmail.com');
```

### 3. Reiniciar el Servidor

```bash
cd backend
npm start
```

## Ejemplo de Integración en el Frontend

### Formulario de Contacto (Ecommerce)

```javascript
// Actualizar las opciones del dropdown
const inquiryTypes = [
  'Otra',
  'Seguimiento con Asesor',
  'Cotización no fue recibida/enviada',
  'Factura - no fue recibida/enviada',
  'Factura - incorrecta',
  'Servicio - Asesor no responde',
  'Servicio - Asesor no da seguimiento',
  'Servicio - Tiempo de entrega en bodega',
  'Servicio - No atienden en Tienda'
];

// Enviar opinión
async function submitOpinion(data) {
  const response = await fetch('http://localhost:3001/api/v1/opinions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}
```

### Panel de Administración

```javascript
// Obtener opiniones pendientes
async function getPendingOpinions() {
  const response = await fetch('http://localhost:3001/api/v1/opinions?status=pendiente', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
}

// Responder opinión
async function respondOpinion(opinionId, response) {
  const result = await fetch(`http://localhost:3001/api/v1/opinions/${opinionId}/respond`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      admin_response: response
    })
  });

  return await result.json();
}
```

## Notas Importantes

1. **Seguridad**: El endpoint de creación de opiniones es público, pero incluye validación de datos
2. **Rate Limiting**: Considera implementar rate limiting en el endpoint público para prevenir spam
3. **Notificaciones**: Los administradores deberían recibir notificaciones cuando llegan nuevas opiniones
4. **Backup**: Las opiniones contienen información valiosa del cliente, asegúrate de incluirlas en los backups

## Próximas Mejoras Sugeridas

- [ ] Agregar notificaciones push para nuevas opiniones
- [ ] Implementar respuestas predefinidas/plantillas
- [ ] Agregar sistema de etiquetas para clasificar opiniones
- [ ] Dashboard con gráficos de tendencias
- [ ] Exportar opiniones a Excel/PDF
- [ ] Integración con sistema de tickets
- [ ] Búsqueda avanzada por texto
- [ ] Historial de conversación (múltiples respuestas)

---

**Autor:** Sistema ProsperPOS
**Versión:** 1.0.0
**Fecha:** 13 de Enero, 2026
