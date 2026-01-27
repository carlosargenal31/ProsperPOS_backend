# 🛒 Guía Rápida - Tienda en Línea ProsperPOS

## 📋 Descripción

La tienda en línea de ProsperPOS permite a tus clientes:
- Ver el catálogo de productos
- Filtrar por categoría y precio
- Crear un pre-pedido
- Enviar el pedido directamente por WhatsApp

**IMPORTANTE**: Los clientes NO pagan en línea, solo crean un pre-pedido que se envía por WhatsApp a tu número de ventas.

---

## 🚀 Inicio Rápido

### 1. Configurar número de WhatsApp

Edita el archivo `client/pages/products/cart.vue` y cambia el número de WhatsApp (línea 25):

```javascript
const WHATSAPP_NUMBER = '50431923555'; // Cambia por tu número
```

**Formato**: Código de país + número sin espacios ni guiones
- Ejemplo Honduras: `50431923555`
- Ejemplo USA: `15551234567`

### 2. Iniciar el servidor backend

```bash
cd backend
npm start
```

El backend estará corriendo en `http://localhost:3000`

### 3. Iniciar el cliente (tienda)

```bash
cd client
npm run dev
```

La tienda estará disponible en `http://localhost:3001`

---

## 📁 Estructura de la Tienda

### Páginas principales:

1. **`/`** (index.vue) - Página principal
   - Hero con búsqueda de productos
   - Categorías de productos
   - Sección de servicios

2. **`/products/catalog`** - Catálogo de productos
   - Listado de productos con imágenes
   - Filtros por categoría, precio y stock
   - Agregar productos al carrito

3. **`/products/cart`** - Carrito de pre-pedido
   - Ver productos seleccionados
   - Modificar cantidades
   - Formulario de datos del cliente
   - Botón para enviar por WhatsApp

---

## 🎨 Componentes Adaptados

### Hero (Búsqueda)
**Archivo**: `client/components/home/Hero.vue`
- Búsqueda de productos por nombre
- Filtro por categoría
- Filtro por precio máximo

### Categorías
**Archivo**: `client/components/home/Categories.vue`
- Muestra las categorías de productos
- Se cargan dinámicamente desde la base de datos
- Enlace directo al catálogo filtrado

---

## 🔧 API Endpoints Utilizados

Todos los endpoints están en: `http://localhost:3000/api/v1/ecommerce`

### Públicos (sin autenticación):

```
GET /categories                    - Listar categorías
GET /products/catalog              - Catálogo de productos
GET /products/:id                  - Detalles de un producto
GET /products/search?q=...         - Buscar productos
```

### Parámetros del catálogo:

```javascript
{
  page: 1,              // Página actual
  limit: 12,            // Productos por página
  search: '',           // Búsqueda por nombre/código
  category_id: null,    // Filtrar por categoría
  minPrice: null,       // Precio mínimo
  maxPrice: null,       // Precio máximo
  inStock: false,       // Solo productos con stock
  sort: 'name_asc'      // Ordenamiento
}
```

---

## 💬 Formato del Mensaje WhatsApp

Cuando el cliente presiona "Enviar por WhatsApp", se genera un mensaje con este formato:

```
👋 Nuevo pre-pedido desde ProsperPOS

🗓️ 19/12/2025 ⏰ 02:30 pm

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

## 🎯 Flujo del Cliente

1. **Navegar** → El cliente entra a la tienda y busca productos
2. **Agregar** → Agrega productos al carrito
3. **Carrito** → Revisa su pedido y llena sus datos
4. **WhatsApp** → Presiona el botón y se abre WhatsApp con el mensaje
5. **Enviar** → El cliente envía el mensaje a tu número
6. **Facturar** → Tú confirmas y facturas el pedido en el POS

---

## 🛠️ Personalización

### Cambiar el nombre de la empresa

Edita `client/components/home/Hero.vue`:

```vue
<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
  Encuentra los mejores productos para tu proyecto
</h1>
```

### Cambiar colores

Los colores principales están en Tailwind CSS:
- **Azul primario**: `blue-500`, `blue-600`, `blue-900`
- **Verde (WhatsApp)**: `green-500`, `green-600`
- **Rojo (agotado)**: `red-500`

### Agregar imagen de hero

Reemplaza la imagen en: `client/assets/images/hero-image.jpg`

---

## ⚙️ Configuración Avanzada

### Cambiar puerto del cliente

Edita `client/package.json`:

```json
"scripts": {
  "dev": "nuxt dev --port 3001"
}
```

### Cambiar puerto del backend

Edita `backend/.env`:

```
PORT=3000
```

### Habilitar CORS para dominios externos

Edita `backend/src/server.js` si necesitas acceso desde otro dominio.

---

## 📊 Base de Datos

La tienda utiliza las mismas tablas que el POS:
- `products` - Productos
- `categories` - Categorías
- `stock` - Inventario

**Campos importantes del producto**:
- `name` - Nombre del producto
- `code` - Código
- `price_1` - Precio de venta
- `stock` - Cantidad disponible
- `image_url` - URL de la imagen (opcional)

---

## ❓ Preguntas Frecuentes

**P: ¿Los clientes pueden pagar en línea?**
R: No, esta es una tienda de pre-pedidos. Los pagos se hacen en persona o al contactar por WhatsApp.

**P: ¿Cómo agrego imágenes a los productos?**
R: Agrega la URL de la imagen en el campo `image_url` de la tabla `products`.

**P: ¿Puedo cambiar el impuesto del 15%?**
R: Sí, edita la línea en `client/pages/products/cart.vue`:
```javascript
const tax = computed(() => {
  return subtotal.value * 0.15; // Cambia 0.15 por tu tasa
});
```

**P: ¿Cómo desactivo el filtro de stock?**
R: El filtro "Solo productos en stock" es opcional. El cliente puede desmarcarlo.

---

## 🎉 ¡Listo!

Tu tienda en línea ya está funcionando. Los clientes pueden:
1. Ver tus productos
2. Crear su pre-pedido
3. Enviártelo por WhatsApp

Tú solo tienes que:
1. Recibir el mensaje
2. Confirmar el pedido
3. Facturarlo en el POS

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Que el backend esté corriendo en el puerto 3000
2. Que el cliente esté corriendo en el puerto 3001
3. Que la base de datos tenga productos con stock
4. Los logs de la consola del navegador (F12)

---

**¡Buena suerte con tu tienda en línea! 🚀**
