# ProsperPOS Backend

Sistema de Punto de Venta con Facturación Electrónica para Honduras.

## 🚀 Características

- ✅ Autenticación JWT
- ✅ Gestión de inventario
- ✅ Punto de venta (POS)
- ✅ Facturación electrónica
- ✅ Reportes y dashboard
- ✅ Multi-tienda
- ✅ Roles y permisos

## 🛠️ Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** MySQL
- **Autenticación:** JWT
- **Documentación:** API REST

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd prosperpos-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones (si aplica)
npm run db:migrate

# Iniciar servidor
npm run dev
```

## 🌐 Endpoints principales

- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/products` - Listar productos
- `POST /api/v1/sales` - Crear venta
- `GET /api/v1/reports/sales` - Reporte de ventas

## 📝 Documentación

La documentación completa de la API estará disponible en:
`http://localhost:3000/api/docs`

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 🚀 Despliegue

```bash
# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.