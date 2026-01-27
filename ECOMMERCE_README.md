# Sistema de E-Commerce ProsperPOS

## Descripción

Sistema completo de comercio electrónico integrado a ProsperPOS que permite a los clientes:
- Ver catálogo de productos con imágenes
- Crear cuenta e iniciar sesión
- Agregar productos al carrito
- Realizar pedidos que se envían a WhatsApp
- Ver historial de pedidos

Los pedidos se envían automáticamente por WhatsApp para que un vendedor pueda contactar al cliente y confirmar el pedido.

## Instalación

### 1. Aplicar Migraciones de Base de Datos

```bash
mysql -u root -p310104 prosperpos < backend/database/create-ecommerce-tables.sql
```

Esto creará las siguientes tablas:
- `web_customers` - Clientes del e-commerce
- `web_orders` - Pedidos
- `web_order_items` - Items de pedidos
- `web_order_status_history` - Historial de estados
- `shopping_cart` - Carrito de compras
- `customer_addresses` - Direcciones de envío
- `customer_favorites` - Productos favoritos
- `ecommerce_settings` - Configuración del e-commerce
- `banners` - Banners promocionales

### 2. Configurar WhatsApp

Edita la configuración de WhatsApp en la tabla `ecommerce_settings`:

```sql
UPDATE ecommerce_settings
SET setting_value = '+504 XXXX-XXXX'
WHERE setting_key = 'whatsapp_number';
```

### 3. Iniciar el Backend

```bash
cd backend
npm start
```

El backend estará disponible en: `http://localhost:3000`

### 4. Iniciar el Frontend

```bash
cd template
npm run dev
```

El frontend estará disponible en: `http://localhost:3001`

## Estructura del Proyecto

### Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── ecommerce-auth.controller.js
│   │   ├── ecommerce-products.controller.js
│   │   ├── ecommerce-cart.controller.js
│   │   └── ecommerce-orders.controller.js
│   ├── models/
│   │   ├── web-customer.model.js
│   │   ├── web-order.model.js
│   │   └── shopping-cart.model.js
│   ├── middleware/
│   │   └── ecommerce-auth.middleware.js
│   └── routes/
│       └── ecommerce.routes.js
└── database/
    └── create-ecommerce-tables.sql
```

### Frontend

```
template/src/
├── api/
│   └── ecommerce.js
└── views/
    └── shop/
        ├── catalog.vue
        ├── login.vue
        ├── cart.vue
        ├── checkout.vue
        └── orders.vue
```

## Endpoints de la API

### Autenticación

- `POST /api/v1/ecommerce/auth/register` - Registrar cliente
- `POST /api/v1/ecommerce/auth/login` - Iniciar sesión
- `GET /api/v1/ecommerce/auth/profile` - Obtener perfil (auth)
- `PUT /api/v1/ecommerce/auth/profile` - Actualizar perfil (auth)
- `PUT /api/v1/ecommerce/auth/change-password` - Cambiar contraseña (auth)

### Productos

- `GET /api/v1/ecommerce/products/catalog` - Catálogo de productos
- `GET /api/v1/ecommerce/products/featured` - Productos destacados
- `GET /api/v1/ecommerce/products/search` - Buscar productos
- `GET /api/v1/ecommerce/products/:id` - Detalles de producto
- `GET /api/v1/ecommerce/categories` - Categorías
- `GET /api/v1/ecommerce/brands` - Marcas

### Carrito

- `GET /api/v1/ecommerce/cart` - Obtener carrito (auth)
- `POST /api/v1/ecommerce/cart/add` - Agregar producto (auth)
- `PUT /api/v1/ecommerce/cart/item/:product_id` - Actualizar cantidad (auth)
- `DELETE /api/v1/ecommerce/cart/item/:product_id` - Eliminar producto (auth)
- `DELETE /api/v1/ecommerce/cart/clear` - Vaciar carrito (auth)
- `GET /api/v1/ecommerce/cart/count` - Contar items (auth)

### Pedidos

- `POST /api/v1/ecommerce/orders` - Crear pedido (auth)
- `GET /api/v1/ecommerce/orders` - Mis pedidos (auth)
- `GET /api/v1/ecommerce/orders/:order_number` - Detalles de pedido (auth)
- `POST /api/v1/ecommerce/orders/:order_number/cancel` - Cancelar pedido (auth)
- `GET /api/v1/ecommerce/orders/:order_number/whatsapp` - URL de WhatsApp (auth)

## Rutas del Frontend

- `/shop` - Catálogo de productos
- `/shop/login` - Login/Registro
- `/shop/cart` - Carrito de compras
- `/shop/checkout` - Finalizar pedido
- `/shop/orders` - Mis pedidos

## Flujo de Uso

### Cliente

1. **Ver Productos**: El cliente visita `/shop` y ve el catálogo de productos
2. **Registrarse**: Si no tiene cuenta, va a `/shop/login` y se registra
3. **Agregar al Carrito**: Hace clic en el botón "Agregar al carrito" en los productos
4. **Ver Carrito**: Va a `/shop/cart` para revisar su carrito
5. **Checkout**: Hace clic en "Proceder al Pedido" y llena los datos de envío
6. **Confirmar Pedido**: El pedido se crea y se genera un enlace de WhatsApp
7. **WhatsApp**: Se abre WhatsApp con un mensaje pre-formateado del pedido
8. **Vendedor Contacta**: Un vendedor recibe el mensaje y contacta al cliente

### Vendedor

1. Recibe el pedido por WhatsApp con todos los detalles
2. Contacta al cliente para confirmar
3. Coordina el pago y entrega
4. Actualiza el estado del pedido en el sistema (próxima feature)

## Configuración Adicional

### Variables de Entorno

Asegúrate de configurar en el archivo `.env` del backend:

```env
JWT_SECRET=tu-clave-secreta-muy-segura
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=310104
DB_NAME=prosperpos
```

### Configuración de E-Commerce

Puedes actualizar la configuración directamente en la base de datos:

```sql
-- Cambiar número de WhatsApp
UPDATE ecommerce_settings
SET setting_value = '+504 XXXX-XXXX'
WHERE setting_key = 'whatsapp_number';

-- Configurar costo de envío
UPDATE ecommerce_settings
SET setting_value = '50.00'
WHERE setting_key = 'shipping_cost';

-- Monto mínimo de pedido
UPDATE ecommerce_settings
SET setting_value = '100.00'
WHERE setting_key = 'min_order_amount';

-- Nombre de la tienda
UPDATE ecommerce_settings
SET setting_value = 'Mi Tienda'
WHERE setting_key = 'store_name';
```

## Características Principales

### Productos
- ✅ Catálogo con paginación
- ✅ Filtros por categoría y marca
- ✅ Ordenamiento (precio, nombre, fecha)
- ✅ Búsqueda de productos
- ✅ Imágenes de productos
- ✅ Stock disponible
- ✅ Precios con impuestos

### Carrito
- ✅ Agregar/eliminar productos
- ✅ Actualizar cantidades
- ✅ Validación de stock
- ✅ Cálculo de totales con impuestos
- ✅ Persistencia en base de datos

### Pedidos
- ✅ Crear pedidos desde el carrito
- ✅ Dirección de envío
- ✅ Notas del cliente
- ✅ Generación automática de número de pedido
- ✅ Historial de pedidos
- ✅ Estados de pedido
- ✅ Cancelación de pedidos

### WhatsApp
- ✅ Mensaje formateado con detalles del pedido
- ✅ URL generada automáticamente
- ✅ Incluye productos, cantidades, precios
- ✅ Dirección de envío
- ✅ Notas del cliente

## Próximas Mejoras

- [ ] Panel de administración para gestionar pedidos
- [ ] Notificaciones por email
- [ ] Sistema de seguimiento de pedidos
- [ ] Métodos de pago en línea
- [ ] Cupones de descuento
- [ ] Productos relacionados
- [ ] Reviews y calificaciones
- [ ] Lista de deseos
- [ ] Comparar productos
- [ ] Chat en vivo

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

## Licencia

Propiedad de ProsperPOS - Todos los derechos reservados
