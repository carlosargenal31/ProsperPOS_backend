# 🛒 Tienda en Línea ProsperPOS - Resumen Ejecutivo

## ✅ Estado: COMPLETADO

La tienda en línea está **100% integrada** en el template del POS.

---

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Iniciar Backend
```bash
cd backend
npm start
```
✅ Backend corriendo en `http://localhost:3000`

### 2️⃣ Iniciar Template (POS)
```bash
cd template
npm run dev
```
✅ POS corriendo en `http://localhost:3001`

### 3️⃣ Acceder
1. Ir a `http://localhost:3001`
2. Iniciar sesión en el POS
3. En el **sidebar** (menú izquierdo), ir a:
   - **📦 Tienda en Línea** → **🛒 Catálogo de Productos**

---

## ⚙️ Configuración Única Requerida

### Cambiar número de WhatsApp

**Archivo**: `template/src/views/pages/ecommerce/cart.vue`
**Línea**: 19

```javascript
WHATSAPP_NUMBER: '50431923555' // ← Cambia por TU número
```

**Formato**: Código país + número (sin espacios)
- Honduras: `50431923555`
- USA: `15551234567`

---

## 📍 Ubicación en el Sidebar

Al final del menú lateral izquierdo:

```
...
📚 Manuales
  └─ Manual de Usuario
  └─ Manual Técnico

📦 Tienda en Línea  ← NUEVA SECCIÓN
  └─ 🛒 Catálogo de Productos
  └─ 📱 Carrito de Pre-Pedidos
```

---

## 🎯 Características Principales

### Catálogo (`/ecommerce/catalog`)
- ✅ Vista de productos con imágenes
- ✅ Filtros: búsqueda, categoría, precio, stock
- ✅ Badges de stock (AGOTADO / POCAS UNIDADES)
- ✅ Agregar al carrito
- ✅ Paginación
- ✅ Contador de items en carrito

### Carrito (`/ecommerce/cart`)
- ✅ Ver productos seleccionados
- ✅ Ajustar cantidades
- ✅ Formulario cliente (nombre, teléfono, dirección)
- ✅ Resumen con ISV 15%
- ✅ **Botón WhatsApp** con mensaje formateado
- ✅ Persistencia en localStorage

---

## 💬 Mensaje WhatsApp Generado

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

## 📁 Archivos Creados

```
template/
├── src/
│   ├── views/pages/ecommerce/
│   │   ├── catalog.vue          ✅ Catálogo de productos
│   │   └── cart.vue             ✅ Carrito con WhatsApp
│   ├── router/index.js          ✅ Rutas agregadas
│   └── assets/json/sidebar.json ✅ Menú actualizado
├── .env                         ✅ Variables configuradas
└── vite.config.js               ✅ Puerto 3001

Documentación:
├── GUIA_TIENDA_ONLINE_TEMPLATE.md  ✅ Guía completa
└── RESUMEN_TIENDA_ONLINE.md        ✅ Este archivo
```

---

## 🔌 API Endpoints

**Base URL**: `http://localhost:3000/api/v1/ecommerce`

```
GET /categories                # Listar categorías
GET /products/catalog          # Catálogo de productos
GET /products/:id              # Detalle de producto
```

**Parámetros del catálogo**:
```javascript
{
  page: 1,
  limit: 12,
  search: '',
  category_id: null,
  minPrice: null,
  maxPrice: null,
  inStock: false
}
```

---

## 🔧 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| No aparece en sidebar | Refresca navegador (Ctrl+F5) |
| No cargan productos | Verifica backend esté corriendo |
| Error de API | Revisa consola (F12) y backend logs |
| Carrito vacío tras recargar | Desactiva modo incógnito |

---

## 📊 Requisitos de Base de Datos

Tablas necesarias:
- ✅ `products` - Productos con stock
- ✅ `categories` - Categorías de productos

**Campos importantes en `products`**:
- `name` - Nombre
- `code` - Código
- `price_1` - Precio de venta
- `stock` - Cantidad disponible
- `image` - Ruta/URL imagen (opcional)
- `category_id` - FK a categories

---

## 🎨 Personalización Rápida

### Cambiar ISV (impuesto)
**Archivo**: `template/src/views/pages/ecommerce/cart.vue`
**Línea**: ~56
```javascript
tax() {
  return this.subtotal * 0.15; // ← Cambia 0.15
}
```

### Cambiar productos por página
**Archivo**: `template/src/views/pages/ecommerce/catalog.vue`
**Línea**: ~269
```javascript
itemsPerPage: 12, // ← Cambia este número
```

---

## 📖 Documentación Completa

Para más detalles, ver:
- **[GUIA_TIENDA_ONLINE_TEMPLATE.md](GUIA_TIENDA_ONLINE_TEMPLATE.md)**

---

## ✅ Lista de Verificación Pre-Uso

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Template corriendo en `http://localhost:3001`
- [ ] Número de WhatsApp configurado en `cart.vue`
- [ ] Productos con stock en base de datos
- [ ] Usuario autenticado en POS

---

## 🎉 ¡Listo para Usar!

Tu tienda en línea está completamente integrada en el POS.

**Próximos pasos**:
1. Inicia ambos servidores
2. Inicia sesión en el POS
3. Ve a "Tienda en Línea" en el sidebar
4. ¡Empieza a crear pre-pedidos! 🛒📱

---

**Versión**: 1.0
**Última actualización**: 19/12/2025
**Puerto**: 3001 (template) + 3000 (backend)
