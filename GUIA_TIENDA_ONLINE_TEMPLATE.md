# 🛒 Guía Completa - Tienda en Línea (Template POS)

## 📋 Descripción

La tienda en línea está ahora integrada dentro del **template** del POS. Los usuarios autorizados pueden acceder desde el sidebar del POS a:
- **Catálogo de Productos** - Ver y agregar productos al carrito
- **Carrito de Pre-Pedidos** - Enviar pedidos por WhatsApp

---

## 🎯 ¿Cómo funciona?

1. Usuario inicia sesión en el POS (template)
2. En el sidebar (barra lateral izquierda), ve la sección **"Tienda en Línea"**
3. Click en **"Catálogo de Productos"** para ver los productos
4. Agrega productos al carrito
5. Va a **"Carrito de Pre-Pedidos"**
6. Llena sus datos y presiona **"Enviar pedido por WhatsApp"**
7. Se abre WhatsApp con el mensaje formateado

---

## 🚀 Configuración Inicial

### 1. Configurar variables de entorno

Crea el archivo `template/.env` (copia de `.env.example`):

```bash
cd template
cp .env.example .env
```

Edita `template/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1/ecommerce
NODE_ENV=development
```

### 2. Configurar número de WhatsApp

Edita `template/src/views/pages/ecommerce/cart.vue` (línea 19):

```javascript
WHATSAPP_NUMBER: '50431923555' // Cambia por TU número
```

**Formato**: Código de país + número sin espacios
- Honduras: `50431923555`
- USA: `15551234567`

### 3. Instalar dependencias (si es necesario)

```bash
cd template
npm install
```

---

## 🔧 Iniciar el Sistema

### Paso 1: Iniciar el Backend

```bash
cd backend
npm start
```

El backend debe estar corriendo en `http://localhost:3000`

### Paso 2: Iniciar el Template (Frontend POS)

```bash
cd template
npm run dev
```

El POS estará disponible en `http://localhost:3001`

---

## 📱 Acceso desde el POS

### En el Sidebar (Menú Lateral):

Al final del sidebar, encontrarás la nueva sección:

```
📦 Tienda en Línea
  └─ 🛒 Catálogo de Productos
  └─ 📱 Carrito de Pre-Pedidos
```

### Permisos

Por defecto, todos los usuarios autenticados pueden acceder. Si quieres restringir el acceso, puedes modificar el archivo:
- `template/src/views/layouts/vertical-sidebar.vue`

---

## 📁 Estructura de Archivos Creados

```
template/
├── src/
│   ├── views/
│   │   └── pages/
│   │       └── ecommerce/
│   │           ├── catalog.vue      # Catálogo de productos
│   │           └── cart.vue         # Carrito con WhatsApp
│   ├── router/
│   │   └── index.js                 # ✅ Rutas agregadas
│   └── assets/
│       └── json/
│           └── sidebar.json         # ✅ Menú actualizado
└── .env                             # Variables de entorno
```

---

## 🎨 Páginas Creadas

### 1. Catálogo de Productos (`/ecommerce/catalog`)

**Características:**
- Listado de productos con imágenes
- Filtros:
  - Búsqueda por nombre/código
  - Categoría
  - Precio máximo
  - Solo en stock
- Vista de tarjetas (cards)
- Botón "Agregar al carrito"
- Paginación
- Badge de stock (AGOTADO / POCAS UNIDADES)

**Ruta**: `/ecommerce/catalog`

### 2. Carrito de Pre-Pedidos (`/ecommerce/cart`)

**Características:**
- Ver productos en el carrito
- Ajustar cantidades (+/-)
- Eliminar productos
- Formulario del cliente:
  - Nombre *
  - Teléfono *
  - Dirección *
  - Comentarios
- Resumen del pedido:
  - Subtotal
  - ISV (15%)
  - Total
- Botón WhatsApp

**Ruta**: `/ecommerce/cart`

---

## 💬 Formato del Mensaje WhatsApp

```
👋 Nuevo pre-pedido desde ProsperPOS

🗓️ 19/12/2025 ⏰ 03:30 pm

*Datos del cliente:*
Nombre: Carlos Argeñal
Teléfono: 504 3192-3555
Dirección: Barrio La Merced, Tegucigalpa

*📝 Productos*
*X4 PORCELANATO 60X60  L 2,800.00*
*X1 ADHESIVO CERAMICO  L 450.00*

Subtotal: L 3,250.00
ISV (15%): L 487.50
*Total: L 3,737.50*

*Comentarios adicionales:*
_Entregar antes de las 5pm_

👆 Por favor confirme este pedido para procesar.
```

---

## 🔌 API Endpoints Utilizados

Base URL: `http://localhost:3000/api/v1/ecommerce`

### Endpoints Públicos (sin autenticación):

```
GET  /categories               # Listar categorías
GET  /products/catalog          # Catálogo de productos
GET  /products/:id              # Detalle de producto
GET  /products/search?q=...     # Buscar productos
```

### Parámetros del Catálogo:

```javascript
{
  page: 1,              // Número de página
  limit: 12,            // Productos por página
  search: '',           // Búsqueda
  category_id: null,    // Filtro por categoría
  minPrice: null,       // Precio mínimo
  maxPrice: null,       // Precio máximo
  inStock: false        // Solo con stock
}
```

---

## 🎨 Personalización

### Cambiar colores del tema

Los estilos utilizan las clases de Bootstrap del template. Los botones principales son:

- **Verde (WhatsApp)**: `.btn-success`
- **Azul (Primario)**: `.btn-primary`
- **Rojo (Eliminar)**: `.btn-danger`

### Cambiar productos por página

En `catalog.vue` (línea ~269):
```javascript
itemsPerPage: 12,  // Cambia este número
```

### Cambiar impuesto (ISV)

En `cart.vue` (línea ~56):
```javascript
tax() {
  return this.subtotal * 0.15; // Cambia 0.15 por tu tasa
}
```

---

## 🛠️ Solución de Problemas

### El sidebar no muestra "Tienda en Línea"

**Solución:**
1. Verifica que `template/src/assets/json/sidebar.json` tenga la sección agregada
2. Refresca el navegador (Ctrl + F5)
3. Verifica la consola del navegador (F12) por errores

### "Cannot read properties of undefined"

**Solución:**
1. Asegúrate que el backend esté corriendo
2. Verifica que `VITE_API_URL` en `.env` sea correcta
3. Revisa la consola del navegador para ver el error completo

### Los productos no se cargan

**Solución:**
1. Verifica que el backend esté corriendo en el puerto 3000
2. Prueba el endpoint manualmente:
   ```bash
   curl http://localhost:3000/api/v1/ecommerce/products/catalog
   ```
3. Asegúrate que hay productos en la base de datos

### El carrito está vacío después de recargar

**Solución:**
- El carrito se guarda en `localStorage`
- Verifica que el navegador no esté en modo incógnito
- Revisa la consola del navegador (F12) → Application → Local Storage

---

## 📊 Base de Datos

La tienda utiliza las mismas tablas que el POS:

```sql
- products       # Productos
- categories     # Categorías
- stock          # Inventario (campo: stock)
```

**Campos importantes:**
- `products.name` - Nombre del producto
- `products.code` - Código
- `products.price_1` - Precio de venta
- `products.stock` - Cantidad disponible
- `products.image` - Ruta/URL de imagen (opcional)
- `products.category_id` - FK a categories

---

## 🔐 Seguridad

### Autenticación

Las rutas de ecommerce en el template están protegidas por:
1. Login del POS (autenticación general)
2. No requieren permisos especiales adicionales

Si quieres agregar permisos específicos, edita:
- `template/src/router/guards.js`

---

## ⚡ Próximas Mejoras Sugeridas

1. **Historial de pedidos** - Ver pedidos anteriores del cliente
2. **Imágenes múltiples** - Galería de imágenes por producto
3. **Búsqueda avanzada** - Por marca, rango de precio, etc.
4. **Favoritos** - Guardar productos favoritos
5. **Notificaciones** - Alertas cuando un producto vuelva a estar en stock

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito autenticarme para usar la tienda?**
R: Sí, debes iniciar sesión en el POS primero.

**P: ¿Puedo usar esto desde un celular?**
R: Sí, el diseño es responsive y funciona en móviles.

**P: ¿Los clientes externos pueden acceder?**
R: No, esta es una vista interna del POS. Para clientes externos, usa el proyecto `client/`.

**P: ¿Puedo cambiar el mensaje de WhatsApp?**
R: Sí, edita la función `sendToWhatsApp()` en `cart.vue`.

**P: ¿Cómo agrego imágenes a los productos?**
R: Agrega la URL o ruta en el campo `image` de la tabla `products`.

---

## 📞 Soporte

Si tienes problemas:

1. Revisa que el backend esté corriendo
2. Verifica que el template esté corriendo
3. Revisa la consola del navegador (F12)
4. Verifica los logs del backend

---

## ✅ Lista de Verificación

Antes de usar:
- [ ] Backend corriendo en puerto 3000
- [ ] Template corriendo (npm run dev)
- [ ] Archivo `.env` configurado
- [ ] Número de WhatsApp configurado en `cart.vue`
- [ ] Productos con stock en la base de datos
- [ ] Usuario autenticado en el POS

---

**¡La tienda en línea ya está lista! 🎉**

Ahora tus usuarios pueden crear pre-pedidos y enviarlos directamente por WhatsApp desde el POS.
