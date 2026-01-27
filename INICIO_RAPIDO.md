# 🚀 Inicio Rápido - ProsperPOS

## 📍 Puertos Configurados

| Aplicación | Puerto | Descripción |
|------------|--------|-------------|
| Backend | **3000** | API compartida |
| POS | **3001** | Sistema de Punto de Venta |
| E-commerce | **3002** | Tienda Online |

---

## 🎯 Pasos para Iniciar

### 1️⃣ Iniciar el Backend (OBLIGATORIO)

```bash
cd backend
npm start
```

✅ El backend debe estar corriendo en `http://localhost:3000`

---

### 2️⃣ Iniciar el POS (Opcional)

```bash
cd template
npm run dev
```

✅ El POS estará disponible en `http://localhost:3001`

**Login**: http://localhost:3001/vue/template/

---

### 3️⃣ Iniciar la Tienda Online (Opcional)

```bash
cd ecommerce
npm run dev
```

✅ La tienda online estará disponible en `http://localhost:3002`

**Página de inicio**: http://localhost:3002/home

---

## 🌐 URLs Importantes

### POS (Puerto 3001)
- Login: http://localhost:3001/vue/template/
- Dashboard: http://localhost:3001/dashboard

### E-commerce (Puerto 3002)
- Inicio: http://localhost:3002/home
- Catálogo: http://localhost:3002/catalog
- Producto: http://localhost:3002/product/:id
- Carrito: http://localhost:3002/cart

### Backend (Puerto 3000)
- API POS: http://localhost:3000/api/v1/*
- API E-commerce: http://localhost:3000/api/v1/ecommerce/*

---

## ⚙️ Configuración

### Variables de Entorno

#### Backend - backend/.env
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=prosperpos
```

#### POS - template/.env
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_URL=http://localhost:3000
VITE_UPLOAD_URL=http://localhost:3000/uploads
```

#### E-commerce - ecommerce/.env
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_URL=http://localhost:3000
VITE_UPLOAD_URL=http://localhost:3000/uploads
```

---

## 🐛 Solución de Problemas

### ❌ Error: Cannot connect to backend

**Solución**: Asegúrate de que el backend esté corriendo:
```bash
cd backend
npm start
```

### ❌ Error: Port 3001 already in use

**Solución**: Cierra la aplicación que está usando el puerto:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3001 | xargs kill
```

### ❌ Error: Port 3002 already in use

**Solución**: Cierra la aplicación que está usando el puerto:
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3002 | xargs kill
```

### ❌ Error: Module not found

**Solución**: Instala las dependencias:
```bash
# Para POS
cd template
npm install

# Para E-commerce
cd ecommerce
npm install

# Para Backend
cd backend
npm install
```

---

## 📚 Documentación Completa

- **[NUEVA_ESTRUCTURA_ECOMMERCE.md](NUEVA_ESTRUCTURA_ECOMMERCE.md)** - Guía completa de la nueva estructura
- **[GUIA_TIENDA_ONLINE_NUEVA.md](GUIA_TIENDA_ONLINE_NUEVA.md)** - Detalles del diseño de la tienda

---

## ✨ ¡Listo!

Ahora tienes:
- ✅ POS corriendo en puerto **3001**
- ✅ E-commerce corriendo en puerto **3002**
- ✅ Backend compartido en puerto **3000**
- ✅ CSS completamente separado
- ✅ Cero conflictos entre aplicaciones

---

**Creado con ❤️ por Claude Code**
