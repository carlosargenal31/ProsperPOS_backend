# Sistema de Manuales de Usuario - ProsperPOS

## Descripción General

Se ha implementado un sistema de manuales de usuario que permite descargar diferentes manuales según el rol del usuario autenticado. El sistema funciona de la siguiente manera:

### Características Principales

1. **Filtrado por Rol**: Cada manual se muestra solo a los usuarios con el rol correspondiente
2. **Descarga Automática**: Al hacer clic en un manual, se descarga automáticamente el archivo PDF
3. **Integración con Tienda Online**: Los manuales de e-commerce aparecen en el módulo de Tienda en Línea

## Manuales Implementados

### 1. Sección "Ayuda" (Sidebar Principal)

Los siguientes manuales aparecen en la sección de "Ayuda" del menú principal:

| Manual | Visible Para | Archivo PDF |
|--------|--------------|-------------|
| Manual de Usuario - Administrador | Super Admin, Administrador | `manual-administrador.pdf` |
| Manual de Usuario - Vendedor | Vendedor (cashier) | `manual-vendedor.pdf` |
| Manual de Usuario - Personal de Bodega | Almacenista (warehouse) | `manual-bodega.pdf` |

### 2. Módulo de Tienda en Línea

Los siguientes manuales aparecen en la sección de "Acciones" del módulo de Tienda en Línea (debajo de "Ver Tienda Online"):

| Manual | Archivo PDF |
|--------|-------------|
| Manual de Tienda en Línea (Vista Cliente) | `manual-tienda-online-cliente.pdf` |
| Manual de Gestión de Tienda en Línea | `manual-tienda-online-gestion.pdf` |

## Cómo Agregar los Archivos PDF

### Paso 1: Preparar los Archivos PDF

Crea o obtén los siguientes archivos PDF:

1. `manual-administrador.pdf` - Manual para administradores
2. `manual-vendedor.pdf` - Manual para vendedores
3. `manual-bodega.pdf` - Manual para personal de bodega
4. `manual-tienda-online-cliente.pdf` - Guía de uso de la tienda para clientes
5. `manual-tienda-online-gestion.pdf` - Guía de gestión de tienda online

### Paso 2: Colocar los Archivos

Coloca los archivos PDF en la siguiente ubicación:

```
template/public/manuales/
```

**IMPORTANTE**: Los nombres de los archivos deben ser exactamente como se muestran arriba (con guiones y en minúsculas).

### Paso 3: Verificar la Estructura de Carpetas

La estructura debe quedar así:

```
template/
  └── public/
      └── manuales/
          ├── README.md
          ├── manual-administrador.pdf
          ├── manual-vendedor.pdf
          ├── manual-bodega.pdf
          ├── manual-tienda-online-cliente.pdf
          └── manual-tienda-online-gestion.pdf
```

## Cómo Funciona

### Para Usuarios

1. **Inicio de Sesión**: El usuario inicia sesión con sus credenciales
2. **Navegación**: Va a la sección "Ayuda" en el menú lateral
3. **Visualización**: Solo ve el manual correspondiente a su rol
4. **Descarga**: Al hacer clic en el manual, se descarga automáticamente

### Ejemplos por Rol

#### Usuario Administrador
- Ve: "Manual de Usuario - Administrador"
- No ve: Manuales de vendedor ni bodega

#### Usuario Vendedor
- Ve: "Manual de Usuario - Vendedor"
- No ve: Manuales de administrador ni bodega

#### Usuario de Bodega
- Ve: "Manual de Usuario - Personal de Bodega"
- No ve: Manuales de administrador ni vendedor

#### Módulo de Tienda en Línea
- Todos los usuarios que accedan a este módulo ven ambos manuales de e-commerce

## Archivos Modificados

### Archivos Creados

1. `template/public/manuales/README.md` - Documentación de la carpeta de manuales
2. `template/src/utils/manual-download.js` - Utilidad para descargar manuales

### Archivos Modificados

1. `template/src/assets/json/sidebar.json` - Configuración del menú con manuales
2. `template/src/views/layouts/vertical-sidebar.vue` - Lógica para filtrar y descargar manuales
3. `template/src/views/layouts/tienda-online-sidebar.vue` - Manuales en módulo de tienda

## Detalles Técnicos

### Configuración en sidebar.json

Los manuales se configuran con las siguientes propiedades:

```json
{
  "menuValue": "Manual de Usuario - Administrador",
  "icon": "ti ti-file-text",
  "isManual": true,
  "manualFile": "manual-administrador.pdf",
  "requiredRoles": ["super_admin", "admin"],
  "hasSubRoute": false,
  "showSubRoute": false
}
```

**Propiedades importantes:**
- `isManual: true` - Identifica el item como un manual
- `manualFile` - Nombre del archivo PDF
- `requiredRoles` - Array de roles que pueden ver este manual

### Utilidades de Descarga

El archivo `manual-download.js` proporciona las siguientes funciones:

- `downloadManual(manualFile)` - Descarga un manual
- `manualExists(manualFile)` - Verifica si existe un manual
- `openManual(manualFile)` - Abre un manual en nueva pestaña

## Solución de Problemas

### El manual no se descarga

1. Verifica que el archivo PDF existe en `template/public/manuales/`
2. Verifica que el nombre del archivo es exacto (incluyendo mayúsculas/minúsculas)
3. Verifica que el archivo tiene permisos de lectura

### El manual no aparece en el menú

1. Verifica que el usuario tiene el rol correcto
2. Verifica que estás usando el slug correcto del rol (ej: `cashier` para vendedor, no `vendedor`)
3. Revisa la consola del navegador por errores

### Error al hacer clic en el manual

1. Abre la consola del navegador (F12)
2. Busca errores relacionados con la descarga
3. Verifica la ruta del archivo en la red del navegador

## Próximos Pasos

1. Crear los archivos PDF de los manuales
2. Colocarlos en `template/public/manuales/`
3. Probar con diferentes usuarios y roles
4. Verificar que las descargas funcionen correctamente

## Notas Adicionales

- Los manuales se descargan directamente, no se abren en el navegador
- Si deseas cambiar este comportamiento para que se abran en nueva pestaña, usa `openManual()` en lugar de `downloadManual()`
- Puedes agregar más manuales siguiendo el mismo patrón en `sidebar.json`
- Los nombres de archivos deben ser únicos y descriptivos

## Roles del Sistema

Para referencia, estos son los roles (slugs) disponibles:

- `super_admin` - Super Administrador
- `admin` - Administrador
- `manager` - Gerente
- `cashier` - Vendedor
- `warehouse` - Almacenista
- `accountant` - Contador
- `viewer` - Visor
