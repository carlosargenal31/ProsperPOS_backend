# Banner Principal - COMPLETADO ✅

## Implementación Completada

Se ha implementado completamente la funcionalidad de **Banner Principal** para la Tienda en Línea, permitiendo gestionar hasta 3 imágenes con títulos, subtítulos y botones.

## 🎯 Características Implementadas

### 1. Base de Datos
- ✅ Tabla `banners` ya existía en la base de datos
- ✅ 3 registros iniciales creados (slots para 3 banners)
- Estructura de la tabla:
  - `id` - ID del banner (1, 2, 3)
  - `title` - Título del banner
  - `description` - Subtítulo (mapeado como `subtitle` en frontend)
  - `image_url` - URL de la imagen en Google Cloud Storage
  - `link_url` - URL del enlace (mapeado como `button_link` en frontend)
  - `button_text` - Texto del botón
  - `position` - Orden del banner (mapeado como `sort_order` en frontend)
  - `is_active` - Si el banner está activo

### 2. Backend API

#### Archivos Creados:

**Service Layer:**
- `backend/src/services/banner.service.js`
  - Lógica de negocio para gestionar banners
  - Integración con Google Cloud Storage
  - Métodos:
    - `getAllBanners()` - Obtener todos los banners
    - `getBannerById(id)` - Obtener banner específico
    - `uploadBannerImage(buffer, id, options)` - Subir imagen a GCS
    - `deleteBannerImage(id)` - Eliminar imagen de GCS
    - `updateBannersConfiguration(banners)` - Actualizar textos y enlaces
    - `getActiveBanners()` - Obtener banners activos para la tienda

**Controller Layer:**
- `backend/src/controllers/banner.controller.js`
  - Validación de requests
  - Manejo de errores
  - Límite de 3 banners máximo
  - Validación de tipos de archivo (JPG, PNG, WebP)
  - Validación de tamaño (máximo 5MB)

**Routes:**
- `backend/src/routes/banner.routes.js`
  - Todas las rutas requieren autenticación
  - Endpoints disponibles:
    - `GET /api/v1/banners` - Listar todos los banners
    - `GET /api/v1/banners/active` - Listar banners activos
    - `POST /api/v1/banners/upload` - Subir imagen
    - `DELETE /api/v1/banners/:id/image` - Eliminar imagen
    - `PUT /api/v1/banners` - Actualizar configuración

**Registro:**
- `backend/src/routes/index.js` - Banner routes registradas

### 3. Frontend

**Página de Gestión:**
- `template/src/views/pages/tienda-online/banner.vue`
  - Interface completa para gestionar 3 banners
  - Características:
    - Upload de imágenes con barra de progreso
    - Preview en tiempo real de cada banner
    - Campos editables: título, subtítulo, texto del botón, enlace
    - Botón de eliminar imagen
    - Botón "Guardar Todo" para actualizar configuración
    - Vista previa en vivo con carousel animado
    - Auto-rotación cada 3 segundos en el preview

## 📋 Endpoints de la API

### GET /api/v1/banners
Obtener todos los banners (gestión)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "VANGUARDISTAS",
      "subtitle": "DE LAS TENDENCIAS EN ESTILOS Y DISEÑOS",
      "image_url": "https://storage.googleapis.com/bucket/banners/banner_1_xxx.jpg",
      "button_link": "/shop/catalog",
      "button_text": "EXPLORAR AHORA",
      "sort_order": 1,
      "is_active": 1
    }
  ]
}
```

### GET /api/v1/banners/active
Obtener banners activos (para mostrar en tienda)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    // Solo banners con is_active = 1 y que tengan imagen
  ]
}
```

### POST /api/v1/banners/upload
Subir imagen de banner a Google Cloud Storage

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
image: [archivo]
banner_id: 1  // (1, 2, o 3)
```

**Validaciones:**
- Tipo de archivo: JPG, PNG, WebP
- Tamaño máximo: 5MB
- Banner ID: debe ser 1, 2, o 3

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket/banners/banner_1_xxx.jpg",
    "bannerId": 1
  },
  "message": "Imagen subida exitosamente"
}
```

### DELETE /api/v1/banners/:id/image
Eliminar imagen de un banner

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Imagen eliminada exitosamente"
}
```

### PUT /api/v1/banners
Actualizar configuración de banners (títulos, enlaces, etc.)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "banners": [
    {
      "id": 1,
      "title": "VANGUARDISTAS",
      "subtitle": "DE LAS TENDENCIAS EN ESTILOS Y DISEÑOS",
      "button_text": "EXPLORAR AHORA",
      "button_link": "/shop/catalog",
      "is_active": true,
      "sort_order": 1
    },
    {
      "id": 2,
      "title": "...",
      "subtitle": "...",
      "button_text": "...",
      "button_link": "...",
      "is_active": true,
      "sort_order": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuración actualizada exitosamente"
}
```

## 🚀 Flujo de Uso

### Gestionar Banners desde ProsperPOS:

1. **Acceder:**
   - Login en ProsperPOS
   - Click en "Tienda en Línea" del sidebar
   - Click en "Banner Principal"

2. **Subir Imagen:**
   - Click en "Subir Imagen" o "Cambiar Imagen"
   - Seleccionar archivo (JPG, PNG o WebP, máx 5MB)
   - Esperar a que suba (se muestra progress bar)
   - La imagen se guarda automáticamente en Google Cloud Storage
   - El preview se actualiza en tiempo real

3. **Configurar Textos:**
   - Llenar campos: Título, Subtítulo, Texto del Botón, Enlace
   - Ver cambios en el preview en vivo
   - Click en "Guardar Todo" para persistir los cambios

4. **Eliminar Imagen:**
   - Click en botón de basura (trash icon)
   - Confirmar eliminación
   - La imagen se elimina de Google Cloud Storage

5. **Vista Previa:**
   - El carousel inferior muestra cómo se verán los banners
   - Auto-rotación cada 3 segundos
   - Click en los dots para cambiar manualmente

## 🎨 Integración con Tienda Online

Los banners configurados se pueden mostrar en el homepage de la tienda online de la siguiente manera:

```javascript
// En shop/home.vue o donde se muestre el carousel
const loadBanners = async () => {
  const response = await fetch('http://localhost:3000/api/v1/banners/active')
  const data = await response.json()

  if (data.success) {
    heroSlides.value = data.data.map(banner => ({
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.button_text,
      buttonLink: banner.button_link,
      image: banner.image_url
    }))
  }
}
```

## 🔧 Mapeo de Campos

| Frontend        | Backend       | Nota                              |
|-----------------|---------------|-----------------------------------|
| title           | title         | Título del banner                 |
| subtitle        | description   | Subtítulo/descripción             |
| button_text     | button_text   | Texto del botón                   |
| button_link     | link_url      | URL del enlace                    |
| image_url       | image_url     | URL en Google Cloud Storage       |
| sort_order      | position      | Orden de visualización            |
| is_active       | is_active     | Si está activo                    |

## 📁 Estructura de Archivos

```
backend/
├── src/
│   ├── controllers/
│   │   └── banner.controller.js      ✅ Nuevo
│   ├── services/
│   │   └── banner.service.js         ✅ Nuevo
│   ├── routes/
│   │   ├── banner.routes.js          ✅ Nuevo
│   │   └── index.js                  📝 Modificado
│   └── utils/
│       └── google-cloud-storage.js   ✅ Ya existía
│
template/
└── src/
    └── views/
        └── pages/
            └── tienda-online/
                └── banner.vue        📝 Completamente implementado
```

## ✨ Características Técnicas

### Google Cloud Storage
- Las imágenes se suben a la carpeta `banners/` en el bucket
- Nombre del archivo: `banner_{id}_{timestamp}.{ext}`
- URL pública generada automáticamente
- Al eliminar, se borra tanto de GCS como de la BD

### Upload con Progress
- Usa XMLHttpRequest para mostrar progreso
- Progress bar animado
- Validación de tipo y tamaño antes de subir

### Vue 3 Composition API
- Reactive refs para estado
- Computed properties para banners activos
- onMounted/onUnmounted para lifecycle
- Auto-rotación del preview con setInterval

## 🐛 Validaciones y Errores

### Validaciones Backend:
- ✅ Archivo es imagen válida
- ✅ Tamaño no excede 5MB
- ✅ Banner ID es 1, 2, o 3
- ✅ Usuario autenticado
- ✅ Máximo 3 banners

### Validaciones Frontend:
- ✅ Archivo es imagen
- ✅ Tamaño máximo 5MB
- ✅ Campos de texto con maxlength

### Manejo de Errores:
- Toast notifications para errores y éxitos
- Logs en consola para debugging
- Mensajes descriptivos

## 📊 Estado Actual

| Componente              | Estado | Notas                                    |
|-------------------------|--------|------------------------------------------|
| Base de datos           | ✅ OK  | Tabla banners con 3 registros            |
| Backend Service         | ✅ OK  | Servicio completo con GCS                |
| Backend Controller      | ✅ OK  | Validaciones y manejo de errores         |
| Backend Routes          | ✅ OK  | 5 endpoints registrados                  |
| Frontend Interface      | ✅ OK  | Gestión completa de 3 banners            |
| Google Cloud Storage    | ✅ OK  | Integración funcionando                  |
| Upload con Progress     | ✅ OK  | XHR con barra de progreso                |
| Preview en Vivo         | ✅ OK  | Carousel con auto-rotación               |

## 🎉 ¡Listo para Usar!

El sistema de Banner Principal está completamente implementado y funcional. Puedes:

1. Subir hasta 3 imágenes
2. Configurar títulos, subtítulos y botones
3. Ver preview en tiempo real
4. Las imágenes se guardan en Google Cloud Storage
5. Todo está integrado con el sistema de autenticación

### Próximos Pasos Sugeridos:
- Integrar los banners activos en el homepage de la tienda (shop/home.vue)
- Agregar opciones de alineación de texto (izquierda, centro, derecha)
- Agregar opciones de tamaño de imagen (cover, contain, etc.)
- Agregar campo para color de fondo del carousel
