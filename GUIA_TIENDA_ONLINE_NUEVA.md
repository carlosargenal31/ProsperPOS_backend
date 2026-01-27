# Guía de la Nueva Tienda Online - ProsperPOS

## 🎨 Cambios Realizados

He rediseñado completamente tu tienda online con un estilo moderno inspirado en **Centro de Cerámicas**, pero manteniendo los colores de tu marca ProsperPOS (#FF9F43 como color principal).

## 📋 Archivos Creados/Modificados

### Nuevos Archivos Creados:

1. **`template/src/views/shop/home.vue`**
   - Página de inicio moderna con hero section
   - Carrusel automático de productos destacados
   - Secciones de categorías destacadas
   - Grid de inspiración por ambientes
   - Sección de últimos materiales
   - Footer completo con información de contacto
   - Botón flotante de WhatsApp

2. **`template/src/views/shop/catalog-new.vue`** (reemplazó catalog.vue)
   - Diseño de catálogo completamente renovado
   - Filtros laterales elegantes (Categoría, Color, Características, Simulación)
   - Grid de productos moderno con hover effects
   - Tabs para Porcelanato y Cerámica
   - Paginación mejorada
   - Vista rápida de productos

3. **`template/src/views/shop/product-detail-new.vue`**
   - Página de detalle premium
   - Galería de imágenes sticky
   - Precio destacado con gradiente
   - Selector de cantidad mejorado
   - Especificaciones en tabla
   - Productos relacionados
   - Navegación previa/siguiente

4. **`template/src/assets/css/shop-theme.css`**
   - Variables CSS globales
   - Colores de tu marca
   - Utilidades CSS reutilizables
   - Estilos responsivos

### Archivos Modificados:

1. **`template/src/router/index.js`**
   - Nuevas rutas: `/shop/home`, `/shop/catalog`, `/shop/product/:id`
   - Rutas legacy con redirección automática
   - Backward compatibility con `/ecommerce/*`

2. **`template/src/main.js`**
   - Importación de `shop-theme.css`

### Archivos de Respaldo:

- **`template/src/views/shop/catalog-backup.vue`** - Tu catálogo original

## 🚀 Cómo Usar

### 1. Acceder a la Tienda

Las nuevas URLs son:

- **Página de Inicio**: `http://localhost:3001/shop/home`
- **Catálogo**: `http://localhost:3001/shop/catalog`
- **Detalle de Producto**: `http://localhost:3001/shop/product/[ID]`
- **Carrito**: `http://localhost:3001/shop/cart`
- **Login**: `http://localhost:3001/shop/login`

### 2. Compatibilidad

Las URLs antiguas siguen funcionando con redirección automática:

- `/ecommerce/catalog` → `/shop/catalog`
- `/ecommerce/product/:id` → `/shop/product/:id`

## 🎨 Características del Diseño

### Página de Inicio (home.vue)

#### **Navegación Superior**
- Logo y marca ProsperPOS
- Menú de navegación (Inicio, Productos, Ambientes, Accesorios, Contacto)
- Botón de carrito con contador
- Botón de login

#### **Hero Section con Carrusel**
- 3 slides rotativos automáticos
- Gradiente de fondo moderno
- Botones CTA grandes
- Cambio automático cada 5 segundos

#### **Categorías Destacadas**
- Grid de 4 columnas responsivo
- Imágenes grandes con overlay
- Efecto hover con zoom
- Botones para ver cada categoría

#### **Productos Destacados**
- Carrusel horizontal
- Navegación con flechas
- Cards de producto elegantes
- Enlace directo a detalle

#### **Inspiración por Ambientes**
- Grid personalizado (tipo Pinterest)
- Diferentes tamaños de cards
- Overlay con nombre del ambiente

#### **Últimos Materiales**
- Sección de Cerámica y Porcelanato
- Diseño lado a lado
- Descripción detallada
- Botones de acción

#### **Footer**
- Información de la empresa
- Enlaces rápidos
- Datos de contacto
- Copyright

#### **WhatsApp Flotante**
- Botón fixed en esquina inferior derecha
- Color verde característico de WhatsApp
- Efecto hover con escala

### Catálogo (catalog.vue)

#### **Barra Lateral de Filtros**
- **Búsqueda**: Input con icono
- **Categoría**: Radio buttons para selección única
- **Color**: Swatches de colores clickeables (9 colores)
- **Características**: Checkboxes múltiples
- **Simulación**: Radio buttons
- Botón "Limpiar filtros"

#### **Área de Productos**
- Tabs: "Catálogo Porcelanato" / "Catálogo Cerámica"
- Dropdown de ordenamiento
- Grid responsivo (4 columnas en desktop, 2 en tablet, 1 en móvil)
- Cards de producto con:
  - Imagen con hover zoom
  - Overlay con botón "Vista Rápida"
  - Nombre del producto
  - Precio destacado
  - Botón agregar al carrito circular
  - Badge "Agotado" si no hay stock

#### **Paginación**
- Números de página
- Botones anterior/siguiente
- Página activa destacada

### Detalle de Producto (product-detail-new.vue)

#### **Breadcrumb**
- Navegación: Inicio > Productos > [Nombre del Producto]
- Botones Previo/Próximo

#### **Galería de Imágenes**
- Imagen principal grande
- Badge de disponibilidad (verde/rojo)
- Sticky al hacer scroll
- Thumbnails (si hay múltiples imágenes)

#### **Información del Producto**
- Badges de categoría y marca
- Título grande
- Código del producto
- **Precio**: Fondo con gradiente morado/azul, texto blanco, grande
- Información de stock con iconos
- Descripción completa
- Selector de cantidad con +/- buttons
- Botón "Agregar al Carrito" grande
- Mensaje de éxito al agregar
- Tabla de especificaciones
- Features (Retiro en tienda, Envío a domicilio)

#### **Productos Relacionados**
- Carrusel horizontal
- 5-6 productos sugeridos
- Mismo diseño que catálogo

## 🎨 Colores de la Marca

Los colores se definen en `shop-theme.css`:

```css
--primary-color: #FF9F43;      /* Naranja ProsperPOS */
--primary-dark: #e68a2e;       /* Naranja oscuro */
--primary-light: #ffb366;      /* Naranja claro */
--secondary-color: #667eea;    /* Morado/azul */
--secondary-dark: #5568d3;
```

## 📱 Responsive Design

Todos los componentes son completamente responsivos:

- **Desktop**: Grid de 4 columnas, menú completo
- **Tablet**: Grid de 2-3 columnas, menú adaptado
- **Mobile**: 1 columna, menú hamburguesa (hay que implementar)

## 🔧 Personalización

### Cambiar Colores

Edita `template/src/assets/css/shop-theme.css`:

```css
:root {
  --primary-color: #TU_COLOR;
  --primary-dark: #TU_COLOR_OSCURO;
}
```

### Agregar Más Slides al Hero

En `home.vue`, edita el array `heroSlides`:

```javascript
const heroSlides = [
  {
    title: 'TU TÍTULO',
    subtitle: 'TU SUBTÍTULO',
    buttonText: 'TU BOTÓN',
    link: '/shop/catalog',
    image: '/ruta-a-tu-imagen.jpg'
  },
  // ... más slides
]
```

### Cambiar Categorías Destacadas

En `home.vue`, edita el array `featuredCategories`:

```javascript
const featuredCategories = [
  {
    id: 1,
    name: 'Nombre de Categoría',
    image: '/ruta-a-imagen.jpg'
  },
  // ... más categorías
]
```

## 📂 Estructura de Imágenes

Las imágenes de productos se esperan en:
```
/uploads/products/[nombre-imagen.jpg]
```

Para placeholders, usa:
```
/placeholder-product.svg
/placeholder-hero-1.jpg
/placeholder-bathroom.jpg
etc.
```

## 🛠️ Próximos Pasos Recomendados

1. **Agregar imágenes reales** a las secciones de hero, categorías y ambientes
2. **Implementar menú hamburguesa** para móvil
3. **Conectar filtros** del catálogo con el backend
4. **Agregar galería de imágenes** múltiples en detalle de producto
5. **Implementar búsqueda predictiva** (autocomplete)
6. **Agregar sistema de reviews** en detalle de producto
7. **Crear página de wishlist** (lista de deseos)
8. **Implementar comparador** de productos

## 🐛 Testing

Para probar la tienda:

1. Inicia el servidor de desarrollo:
   ```bash
   cd template
   npm run dev
   ```

2. Navega a: `http://localhost:3001/shop/home`

3. Prueba:
   - Navegación entre páginas
   - Filtros en el catálogo
   - Agregar productos al carrito
   - Cambio de cantidad en detalle
   - Responsive en diferentes tamaños

## 📝 Notas Importantes

- **LocalStorage**: El carrito se guarda en localStorage (temporal)
- **Rutas legacy**: Las URLs `/ecommerce/*` redirigen a `/shop/*`
- **Backend**: Asegúrate de que tu API esté corriendo en `http://localhost:3000`
- **Frontend**: El template corre en `http://localhost:3001`
- **Imágenes**: Las rutas esperan el formato: `http://localhost:3000/uploads/products/[nombre]` o configura `VITE_API_URL`

## 🎯 Inspiración del Diseño

El diseño está inspirado en:
- **Centro de Cerámicas** (estructura, navegación, filtros)
- **Mantiene tu identidad de marca** (colores ProsperPOS)
- **Mejores prácticas** de e-commerce moderno
- **UX optimizada** para conversión

---

**¿Necesitas ayuda?** Revisa este documento o pregúntame sobre cualquier aspecto del diseño.

**Creado con ❤️ por Claude Code**
