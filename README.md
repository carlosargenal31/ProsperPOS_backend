# 🏪 ProsperPOS - Sistema de Punto de Venta y Tienda Online

Sistema completo de gestión de ventas con POS integrado y tienda online moderna.

---

## 🎯 Estructura del Proyecto

```
ProsperPOS/
├── backend/          # API Backend (Puerto 3000)
├── template/         # POS - Punto de Venta (Puerto 3001)
└── ecommerce/        # Tienda Online (Puerto 3002)
```

---

## 🚀 Inicio Rápido

### 1. Backend (Requerido)
```bash
cd backend
npm start
```
✅ Backend en: http://localhost:3000

### 2. POS - Sistema de Ventas
```bash
cd template
npm run dev
```
✅ POS en: http://localhost:3001

### 3. Tienda Online
```bash
cd ecommerce
npm run dev
```
✅ E-commerce en: http://localhost:3002

---

## 📦 Aplicaciones

### 🖥️ Backend (Puerto 3000)
- API REST compartida
- Base de datos MySQL
- Autenticación JWT
- Endpoints para POS y E-commerce

### 💼 POS - Template (Puerto 3001)
- Sistema de punto de venta completo
- Gestión de inventario
- Reportes y estadísticas
- Control de usuarios y permisos
- Impresión de tickets

**URL de acceso**: http://localhost:3001/vue/template/

### 🛒 E-commerce (Puerto 3002)
- Tienda online moderna
- Catálogo de productos
- Carrito de compras
- Sistema de checkout
- Diseño responsivo

**URL de acceso**: http://localhost:3002/home

---

## 📍 Puertos

| Aplicación | Puerto | URL |
|------------|--------|-----|
| Backend | 3000 | http://localhost:3000 |
| POS | 3001 | http://localhost:3001 |
| E-commerce | 3002 | http://localhost:3002 |

---

## 🔧 Configuración

### Variables de Entorno

Cada aplicación tiene su archivo `.env`:

- `backend/.env` - Configuración del servidor y base de datos
- `template/.env` - Configuración del POS
- `ecommerce/.env` - Configuración de la tienda online

---

## 📚 Documentación

- **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** - Guía de inicio rápido
- **[NUEVA_ESTRUCTURA_ECOMMERCE.md](NUEVA_ESTRUCTURA_ECOMMERCE.md)** - Detalles de la arquitectura
- **[GUIA_TIENDA_ONLINE_NUEVA.md](GUIA_TIENDA_ONLINE_NUEVA.md)** - Guía del e-commerce

---

## 🎨 Características

### POS
- ✅ Ventas rápidas
- ✅ Control de inventario
- ✅ Gestión de clientes
- ✅ Reportes detallados
- ✅ Múltiples usuarios
- ✅ Impresión de tickets

### E-commerce
- ✅ Diseño moderno
- ✅ Filtros avanzados
- ✅ Carrito de compras
- ✅ Búsqueda de productos
- ✅ Responsive design
- ✅ WhatsApp flotante

---

## 🛠️ Tecnologías

### Frontend
- Vue 3
- Vite
- Bootstrap 5
- Axios
- Vue Router

### Backend
- Node.js
- Express
- MySQL
- JWT

---

## 📞 Soporte

Para reportar problemas o sugerencias, consulta la documentación en la carpeta raíz.

---

## ✨ Ventajas de la Arquitectura

✅ **Separación total**: POS y E-commerce completamente independientes
✅ **Sin conflictos**: CSS y configuraciones separadas
✅ **Escalable**: Cada app puede crecer sin afectar la otra
✅ **Backend compartido**: Una sola API y base de datos
✅ **Fácil deployment**: Deploya cada app por separado

---

**Desarrollado con ❤️ usando Claude Code**
