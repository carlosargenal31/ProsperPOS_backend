#!/usr/bin/env node

// ===================================================================
// PROSPERPOS - SERVIDOR PRINCIPAL CON MIGRACIONES AUTOMÁTICAS
// ===================================================================

require('dotenv').config();
const { app, initializeApp } = require('./app');
const logger = require('./src/utils/logger');

// ===================================================================
// CONFIGURACIÓN DEL SERVIDOR
// ===================================================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===================================================================
// MANEJO DE ERRORES NO CAPTURADOS
// ===================================================================

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  console.error('💥 Uncaught Exception! Shutting down...');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  console.error('💥 Unhandled Rejection! Shutting down...');
  if (global.server) {
    global.server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// ===================================================================
// FUNCIÓN DE INICIO
// ===================================================================

async function startServer() {
  try {
    console.log('🚀 Iniciando ProsperPOS Backend...');
    
    // Inicializar aplicación (incluyendo migraciones de BD)
    const initializedApp = await initializeApp();
    
    // Iniciar servidor
    const server = initializedApp.listen(PORT, () => {
      console.log('');
      console.log('🚀 ===============================================');
      console.log(`📊 ProsperPOS Backend iniciado correctamente`);
      console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📖 API Info: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`⚙️ Entorno: ${NODE_ENV}`);
      console.log(`🕐 Hora de inicio: ${new Date().toLocaleString()}`);
      console.log('🚀 ===============================================');
      console.log('');
      
      // Información adicional para desarrollo
      if (NODE_ENV === 'development') {
        console.log('🛠️ MODO DESARROLLO - Información útil:');
        console.log('   📁 Logs: ./logs/');
        console.log('   📁 Uploads: ./uploads/');
        console.log('   🔧 Variables: .env');
        console.log('   🔍 Endpoints principales:');
        console.log('      POST /api/v1/auth/login - Iniciar sesión');
        console.log('      GET  /api/v1/users - Listar usuarios');
        console.log('      GET  /api/v1/products - Listar productos');
        console.log('      GET  /api/v1/categories - Listar categorías');
        console.log('      GET  /api/v1/customers - Listar clientes');
        console.log('      GET  /api/v1/suppliers - Listar proveedores');
        console.log('   📝 Credenciales por defecto:');
        console.log('      Username: admin@prosperpos.com');
        console.log('      Password: Admin1234');
        console.log('');
      }
      
      logger.info(`Servidor iniciado exitosamente en puerto ${PORT}`, {
        environment: NODE_ENV,
        port: PORT,
        timestamp: new Date().toISOString()
      });
    });

    // Guardar referencia global del servidor
    global.server = server;

    // Configurar timeout del servidor
    server.timeout = 30000; // 30 segundos
    server.keepAliveTimeout = 5000; // 5 segundos
    server.headersTimeout = 6000; // 6 segundos

    // Manejo de señales del sistema para cierre graceful
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} recibido - Iniciando cierre graceful del servidor`);
      console.log(`\n🔨 ${signal} recibido. Cerrando servidor gracefully...`);
      
      server.close((err) => {
        if (err) {
          logger.error('Error durante el cierre del servidor:', err);
          console.error('❌ Error al cerrar servidor:', err.message);
          process.exit(1);
        }
        
        console.log('✅ Servidor cerrado correctamente');
        logger.info('Servidor cerrado correctamente');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('Forzando cierre del servidor después de timeout');
        console.error('⏰ Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    logger.error('Error crítico al iniciar servidor:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Mostrar ayuda para errores comunes
    if (error.message.includes('EADDRINUSE')) {
      console.error(`\n💡 El puerto ${PORT} ya está en uso. Prueba:`);
      console.error(`   - Cambiar el puerto: PORT=3001 npm start`);
      console.error(`   - Cerrar el proceso: lsof -ti:${PORT} | xargs kill`);
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      console.error('\n💡 Error de base de datos. Verifica:');
      console.error('   - Variables de entorno en .env');
      console.error('   - Conexión a MySQL/Supabase');
      console.error('   - Credenciales de acceso');
    }
    
    process.exit(1);
  }
}

// ===================================================================
// INFORMACIÓN DE AYUDA
// ===================================================================

function showStartupInfo() {
  if (NODE_ENV === 'development') {
    console.log('');
    console.log('📋 ProsperPOS - Sistema de Punto de Venta');
    console.log('   Version: 1.0.0');
    console.log('   Autor: Tu nombre');
    console.log('   Descripción: Backend API con migraciones automáticas');
    console.log('');
  }
}

// ===================================================================
// MANEJO DE VARIABLES DE ENTORNO
// ===================================================================

function validateEnvironment() {
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Revisa tu archivo .env');
    process.exit(1);
  }
  
  // Advertencias para variables opcionales
  const optionalVars = {
    'DB_PASSWORD': 'contraseña de base de datos',
    'FRONTEND_URL': 'URL del frontend para CORS',
    'LOG_LEVEL': 'nivel de logging'
  };
  
  Object.entries(optionalVars).forEach(([varName, description]) => {
    if (!process.env[varName]) {
      logger.warn(`Variable opcional no definida: ${varName} (${description})`);
    }
  });
}

// ===================================================================
// INICIALIZACIÓN
// ===================================================================

if (require.main === module) {
  // Mostrar información inicial
  showStartupInfo();
  
  // Validar variables de entorno
  validateEnvironment();
  
  // Iniciar servidor
  startServer().catch(error => {
    console.error('💥 Error fatal al inicializar:', error);
    process.exit(1);
  });
}

module.exports = startServer;
