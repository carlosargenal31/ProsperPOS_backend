# 🛒 Inicio Rápido - E-Commerce ProsperPOS

## ✅ Estado Actual

- ✅ Base de datos configurada
- ✅ Migraciones aplicadas (9 tablas creadas)
- ✅ 1014 productos disponibles
- ✅ Precios configurados
- ✅ Backend configurado en puerto 3000
- ✅ Frontend configurado en puerto 3001

## 🚀 Cómo Iniciar

### 1. Iniciar el Backend

```bash
cd backend
npm start
```

El servidor estará en: **http://localhost:3000**

### 2. Iniciar el Frontend

```bash
cd template
npm run dev
```

El frontend estará en: **http://localhost:3001**

### 3. Acceder a la Tienda

Abre tu navegador y ve a:

```
http://localhost:3001/vue/template/shop
```

## 📱 Rutas Disponibles

- **Tienda**: `http://localhost:3001/vue/template/shop`
- **Login/Registro**: `http://localhost:3001/vue/template/shop/login`
- **Carrito**: `http://localhost:3001/vue/template/shop/cart`
- **Checkout**: `http://localhost:3001/vue/template/shop/checkout`
- **Mis Pedidos**: `http://localhost:3001/vue/template/shop/orders`

## 🎯 Prueba el Sistema

### Paso 1: Crear una Cuenta
1. Ve a `/shop/login`
2. Haz clic en "Regístrate aquí"
3. Completa el formulario:
   - Nombre: Juan
   - Apellido: Pérez
   - Email: juan@example.com
   - Contraseña: 123456

### Paso 2: Explorar Productos
1. Verás el catálogo con 1014 productos
2. Usa los filtros de categoría y marca
3. Busca productos específicos

### Paso 3: Agregar al Carrito
1. Haz clic en el botón "+" en cualquier producto
2. El producto se agregará al carrito
3. Verás el contador del carrito aumentar

### Paso 4: Hacer un Pedido
1. Ve al carrito (`/shop/cart`)
2. Revisa tus productos
3. Haz clic en "Proceder al Pedido"
4. Completa los datos de envío:
   - Dirección: Colonia Palmira, Calle Principal
   - Ciudad: Tegucigalpa
   - Departamento: Francisco Morazán
5. Haz clic en "Confirmar Pedido"
6. Se abrirá un modal de éxito
7. Haz clic en "Abrir WhatsApp" (esto generará el mensaje)

### Paso 5: Ver tus Pedidos
1. Ve a "Mis Pedidos" (`/shop/orders`)
2. Verás el historial de todos tus pedidos
3. Puedes cancelar pedidos pendientes

## 🔧 Configuración de WhatsApp

El número de WhatsApp está configurado en la base de datos. Para cambiarlo:

```sql
UPDATE ecommerce_settings
SET setting_value = '+504 XXXX-XXXX'
WHERE setting_key = 'whatsapp_number';
```

**Nota**: La integración de WhatsApp genera una URL que abre WhatsApp Web con un mensaje pre-formateado. El vendedor recibirá todos los detalles del pedido.

## 📊 Tablas Creadas

1. `web_customers` - Clientes del e-commerce
2. `web_orders` - Pedidos
3. `web_order_items` - Items de pedidos
4. `web_order_status_history` - Historial de estados
5. `shopping_cart` - Carrito de compras
6. `customer_addresses` - Direcciones de envío
7. `customer_favorites` - Favoritos (próximamente)
8. `ecommerce_settings` - Configuración
9. `banners` - Banners promocionales (próximamente)

## 🎨 Características

✅ **Catálogo de Productos**
- Listado con imágenes
- Filtros por categoría y marca
- Búsqueda
- Ordenamiento
- Paginación
- Información de stock

✅ **Autenticación**
- Registro de clientes
- Login con JWT
- Sesión persistente

✅ **Carrito de Compras**
- Agregar/eliminar productos
- Actualizar cantidades
- Validación de stock
- Cálculo de totales con ISV

✅ **Sistema de Pedidos**
- Checkout con datos de envío
- Generación de número de pedido
- Historial de pedidos
- Cancelación de pedidos
- Estados: pendiente, confirmado, procesando, enviado, entregado, cancelado

✅ **Integración WhatsApp**
- Mensaje formateado automáticamente
- Incluye productos, cantidades, precios
- Dirección de envío
- Notas del cliente

## 🔑 Credenciales de Prueba

Para probar rápidamente, puedes crear una cuenta con:
- Email: `test@example.com`
- Contraseña: `123456`

## 📝 API Endpoints

Base URL: `http://localhost:3000/api/v1/ecommerce`

### Autenticación (Públicos)
- `POST /auth/register` - Registrar
- `POST /auth/login` - Login

### Productos (Públicos)
- `GET /products/catalog` - Catálogo
- `GET /products/:id` - Detalles
- `GET /categories` - Categorías
- `GET /brands` - Marcas

### Carrito (Requiere Auth)
- `GET /cart` - Ver carrito
- `POST /cart/add` - Agregar producto
- `PUT /cart/item/:id` - Actualizar cantidad
- `DELETE /cart/item/:id` - Eliminar

### Pedidos (Requiere Auth)
- `POST /orders` - Crear pedido
- `GET /orders` - Mis pedidos
- `GET /orders/:number` - Detalles
- `POST /orders/:number/cancel` - Cancelar

## 🎉 ¡Listo!

Tu sistema de e-commerce está completamente funcional. Los clientes pueden:
1. Ver productos
2. Registrarse
3. Agregar al carrito
4. Hacer pedidos
5. Los pedidos se envían a WhatsApp para que un vendedor los atienda

## 🆘 Problemas Comunes

**Error de conexión al backend**
- Verifica que el backend esté corriendo en el puerto 3001
- Revisa el archivo `.env` en `backend/`

**No se ven productos**
- Ejecuta: `node backend/seed-ecommerce-products.js`

**Error de autenticación**
- Borra el localStorage del navegador
- Vuelve a hacer login

**WhatsApp no se abre**
- Verifica que tengas WhatsApp instalado o WhatsApp Web disponible
- El enlace funciona en móvil y desktop

---

**¡Disfruta tu nueva tienda online!** 🎊
