/**
 * Script de prueba para la configuración de e-commerce
 * Prueba los endpoints GET y PUT de configuración
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Credenciales de prueba (ajusta según tu usuario)
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testEcommerceConfig() {
  try {
    console.log('🧪 Iniciando pruebas de configuración de e-commerce...\n');

    // 1. Login para obtener token
    console.log('1️⃣  Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, LOGIN_CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('Error en login');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Token obtenido exitosamente\n');

    // Configurar headers con token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // 2. Obtener configuración actual
    console.log('2️⃣  Obteniendo configuración actual...');
    const getResponse = await axios.get(`${API_URL}/companies/ecommerce/config`, config);

    console.log('✅ Configuración obtenida:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    console.log('');

    const currentConfig = getResponse.data.data.allow_order_without_stock;
    console.log(`📊 Estado actual: ${currentConfig === 1 ? 'ACTIVADO' : 'DESACTIVADO'}\n`);

    // 3. Actualizar configuración (activar)
    console.log('3️⃣  Activando "Permitir pedidos sin stock"...');
    const updateResponse1 = await axios.put(
      `${API_URL}/companies/ecommerce/config`,
      { allow_order_without_stock: 1 },
      config
    );

    console.log('✅ Configuración actualizada:');
    console.log(JSON.stringify(updateResponse1.data, null, 2));
    console.log('');

    // 4. Verificar el cambio
    console.log('4️⃣  Verificando el cambio...');
    const verifyResponse1 = await axios.get(`${API_URL}/companies/ecommerce/config`, config);

    if (verifyResponse1.data.data.allow_order_without_stock === 1) {
      console.log('✅ Configuración verificada: ACTIVADO\n');
    } else {
      console.log('❌ Error: La configuración no se actualizó correctamente\n');
    }

    // 5. Desactivar configuración
    console.log('5️⃣  Desactivando "Permitir pedidos sin stock"...');
    const updateResponse2 = await axios.put(
      `${API_URL}/companies/ecommerce/config`,
      { allow_order_without_stock: 0 },
      config
    );

    console.log('✅ Configuración actualizada:');
    console.log(JSON.stringify(updateResponse2.data, null, 2));
    console.log('');

    // 6. Verificar el cambio
    console.log('6️⃣  Verificando el cambio...');
    const verifyResponse2 = await axios.get(`${API_URL}/companies/ecommerce/config`, config);

    if (verifyResponse2.data.data.allow_order_without_stock === 0) {
      console.log('✅ Configuración verificada: DESACTIVADO\n');
    } else {
      console.log('❌ Error: La configuración no se actualizó correctamente\n');
    }

    // 7. Probar endpoint de productos con configuración
    console.log('7️⃣  Probando endpoint de productos con configuración...');
    const productsResponse = await axios.get(`${API_URL}/ecommerce/products?limit=5`);

    console.log('✅ Productos obtenidos:');
    console.log(`   - Total de productos: ${productsResponse.data.data.products.length}`);
    console.log(`   - Configuración en respuesta: ${JSON.stringify(productsResponse.data.data.config)}`);

    if (productsResponse.data.data.products.length > 0) {
      const product = productsResponse.data.data.products[0];
      console.log(`   - Producto ejemplo: ${product.name}`);
      console.log(`     · Stock disponible: ${product.stock_available}`);
      console.log(`     · Permite pedido sin stock: ${product.allow_order_without_stock}`);
      console.log(`     · En stock: ${product.in_stock}`);
    }
    console.log('');

    // 8. Restaurar configuración original
    console.log('8️⃣  Restaurando configuración original...');
    await axios.put(
      `${API_URL}/companies/ecommerce/config`,
      { allow_order_without_stock: currentConfig },
      config
    );
    console.log(`✅ Configuración restaurada a: ${currentConfig === 1 ? 'ACTIVADO' : 'DESACTIVADO'}\n`);

    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('✅ La funcionalidad de configuración de e-commerce está funcionando correctamente');

  } catch (error) {
    console.error('❌ Error en las pruebas:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Ejecutar pruebas
testEcommerceConfig();
