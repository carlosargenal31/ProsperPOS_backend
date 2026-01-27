# 🚀 Inicio Rápido - Nueva Tienda Online

## ✅ Todo está listo!

He rediseñado completamente tu tienda online con un estilo moderno inspirado en Centro de Cerámicas, manteniendo los colores de ProsperPOS.

## 📍 Puertos Configurados

- **Frontend (Template)**: `http://localhost:3001`
- **Backend (API)**: `http://localhost:3000`

## 🎯 Pasos para Iniciar

### 1. Iniciar el Backend

```bash
cd backend
npm start
```

El backend debe estar corriendo en `http://localhost:3000`

### 2. Iniciar el Frontend

```bash
cd template
npm run dev
```

El frontend estará disponible en `http://localhost:3001`

### 3. Acceder a la Tienda

Abre tu navegador y visita:

**🏠 Página de Inicio**: http://localhost:3001/shop/home

## 🎨 Nuevas Páginas

| Página | URL |
|--------|-----|
| Inicio | `/shop/home` |
| Catálogo | `/shop/catalog` |
| Detalle de Producto | `/shop/product/:id` |
| Carrito | `/shop/cart` |
| Login | `/shop/login` |

## ⚙️ Configuración de Variables de Entorno

El archivo `template/.env` ya está configurado correctamente:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_URL=http://localhost:3000
VITE_UPLOAD_URL=http://localhost:3000/uploads
```

## 🎨 Características del Diseño

### Página de Inicio
- ✅ Hero section con carrusel automático
- ✅ Categorías destacadas (4 columnas)
- ✅ Productos destacados en carrusel
- ✅ Grid de inspiración por ambientes
- ✅ Sección de materiales (Cerámica/Porcelanato)
- ✅ Footer completo
- ✅ Botón flotante de WhatsApp

### Catálogo
- ✅ Filtros laterales elegantes
- ✅ Swatches de colores clickeables (9 colores)
- ✅ Grid responsivo de productos
- ✅ Tabs: Porcelanato / Cerámica
- ✅ Vista rápida en overlay
- ✅ Paginación con números

### Detalle de Producto
- ✅ Galería sticky
- ✅ Precio en gradiente destacado
- ✅ Badges de disponibilidad
- ✅ Selector de cantidad moderno
- ✅ Tabla de especificaciones
- ✅ Productos relacionados

## 🎨 Colores de Marca

Los colores están configurados en `template/src/assets/css/shop-theme.css`:

```css
--primary-color: #FF9F43;      /* Naranja ProsperPOS */
--primary-dark: #e68a2e;       /* Naranja oscuro */
--secondary-color: #667eea;    /* Morado/azul para acentos */
```

## 🔧 Compatibilidad

Las URLs antiguas siguen funcionando con redirección automática:

- `/ecommerce/catalog` → `/shop/catalog`
- `/ecommerce/product/:id` → `/shop/product/:id`
- `/ecommerce/cart` → `/shop/cart`

## 📁 Archivos Importantes

### Nuevos Archivos Creados:
- `template/src/views/shop/home.vue` - Página de inicio
- `template/src/views/shop/catalog.vue` - Catálogo renovado
- `template/src/views/shop/product-detail-new.vue` - Detalle premium
- `template/src/assets/css/shop-theme.css` - Estilos globales

### Archivos Modificados:
- `template/src/router/index.js` - Rutas actualizadas
- `template/src/main.js` - Importación de estilos
- `template/.env` - Variables de entorno

### Respaldos:
- `template/src/views/shop/catalog-backup.vue` - Catálogo original

## 🧪 Prueba la Tienda

1. Visita: http://localhost:3001/shop/home
2. Navega por las diferentes secciones
3. Prueba los filtros en el catálogo
4. Agrega productos al carrito
5. Verifica el diseño en móvil (responsive)

## 📚 Documentación Completa

Para más detalles, consulta:
- **[GUIA_TIENDA_ONLINE_NUEVA.md](GUIA_TIENDA_ONLINE_NUEVA.md)** - Guía completa con personalización

## 🐛 Solución de Problemas

### Error: Cannot GET /shop/home

**Solución**: Asegúrate de que estás accediendo al puerto 3001:
```
http://localhost:3001/shop/home
```

### Las imágenes no cargan

**Solución**: Verifica que el backend esté corriendo en el puerto 3000:
```bash
cd backend
npm start
```

### Error al cargar productos

**Solución**: Verifica las variables de entorno en `template/.env`:
```env
VITE_API_URL=http://localhost:3000
```

## ✨ Próximos Pasos

1. **Agregar imágenes reales** a las secciones de hero y categorías
2. **Personalizar contenidos** (textos, imágenes, productos destacados)
3. **Configurar WhatsApp** con tu número real
4. **Probar en producción** cuando esté listo

## 📞 Contacto y Soporte

Si tienes dudas o necesitas ayuda, revisa la documentación completa en [GUIA_TIENDA_ONLINE_NUEVA.md](GUIA_TIENDA_ONLINE_NUEVA.md)

---

**¡Tu tienda online está lista para usar!** 🎉

Creado con ❤️ por Claude Code
