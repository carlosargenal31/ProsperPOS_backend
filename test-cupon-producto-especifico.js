/**
 * SCRIPT DE PRUEBA - CUPÓN CON PRODUCTO ESPECÍFICO
 * Verifica que los cupones se apliquen SOLO al producto seleccionado
 */

const axios = require('axios');
const db = require('./src/utils/database');

const BASE_URL = 'http://localhost:3000/api/v1';

// Credenciales
const credentials = {
  email: 'admin@prosperpos.com',
  password: 'admin123'
};

let authToken = '';

async function authenticate() {
  try {
    console.log('🔐 Autenticando...');
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Autenticación exitosa\n');
      return true;
    } else {
      console.error('❌ Error en autenticación:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de autenticación:', error.response?.data || error.message);
    return false;
  }
}

async function getProductInfo() {
  try {
    console.log('📦 Obteniendo información de productos...');

    // Buscar productos de la categoría CERAMICA PARA PISO
    const query = `
      SELECT
        p.id,
        p.code,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.subcategory_id,
        s.name AS subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE c.name LIKE '%CERAMICA%PISO%'
      LIMIT 5
    `;

    const products = await db.query(query);

    if (products.length === 0) {
      console.log('⚠️  No se encontraron productos de cerámica');
      return null;
    }

    console.log(`✅ Encontrados ${products.length} productos:\n`);
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. [${p.code}] ${p.name}`);
      console.log(`   Categoría: ${p.category_name} (ID: ${p.category_id})`);
      console.log(`   Subcategoría: ${p.subcategory_name || 'N/A'} (ID: ${p.subcategory_id || 'N/A'})\n`);
    });

    return products[0]; // Retornar el primer producto
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    return null;
  }
}

async function createCouponWithSpecificProduct(product) {
  try {
    console.log('📝 Creando cupón para producto específico...');
    console.log(`   Producto: ${product.name} (ID: ${product.id})`);
    console.log(`   Categoría: ${product.category_name} (ID: ${product.category_id})`);
    console.log(`   Subcategoría: ${product.subcategory_name} (ID: ${product.subcategory_id})\n`);

    // Obtener el siguiente código
    const codeResponse = await axios.get(`${BASE_URL}/coupons/next-code`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const nextCode = codeResponse.data.data.codigo;

    // Crear cupón con producto específico
    const couponData = {
      codigo: nextCode,
      nombre: `DESC. SOLO ${product.name}`,
      tipo_descuento: 'porcentaje',
      valor_descuento: 5.00,
      limitar_fecha: false,
      tipo_aplicacion: 'grupo',
      // IMPORTANTE: Estamos seleccionando un producto específico
      // Aunque también enviamos categoría y subcategoría (porque el usuario las seleccionó en la UI)
      categoria_id: product.category_id,
      subcategoria_id: product.subcategory_id,
      producto_id: product.id, // Este es el campo clave
      suspendida: false,
      is_active: true,
      aplica_lunes: true,
      aplica_martes: true,
      aplica_miercoles: true,
      aplica_jueves: true,
      aplica_viernes: true,
      aplica_sabado: true,
      aplica_domingo: true
    };

    console.log('Datos del cupón:', JSON.stringify(couponData, null, 2));

    const response = await axios.post(`${BASE_URL}/coupons`, couponData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Cupón creado exitosamente\n');
      return response.data.data;
    } else {
      console.error('❌ Error al crear cupón:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al crear cupón:', error.response?.data || error.message);
    return null;
  }
}

async function verifyCouponInDatabase(couponId) {
  try {
    console.log('🔍 Verificando cupón en base de datos...\n');

    const query = `
      SELECT
        id,
        codigo,
        nombre,
        tipo_aplicacion,
        grupo_id AS categoria_id,
        subgrupo_id AS subcategoria_id,
        articulo_id AS producto_id,
        tipo_descuento,
        valor_descuento
      FROM coupons
      WHERE id = ?
    `;

    const coupons = await db.query(query, [couponId]);

    if (coupons.length === 0) {
      console.log('❌ Cupón no encontrado');
      return null;
    }

    const coupon = coupons[0];
    console.log('Cupón en BD:');
    console.log(`  ID: ${coupon.id}`);
    console.log(`  Código: ${coupon.codigo}`);
    console.log(`  Nombre: ${coupon.nombre}`);
    console.log(`  Tipo Aplicación: ${coupon.tipo_aplicacion}`);
    console.log(`  Categoría ID: ${coupon.categoria_id}`);
    console.log(`  Subcategoría ID: ${coupon.subcategoria_id}`);
    console.log(`  🎯 Producto ID: ${coupon.producto_id} ${coupon.producto_id ? '✅' : '❌'}`);
    console.log(`  Tipo Descuento: ${coupon.tipo_descuento}`);
    console.log(`  Valor: ${coupon.valor_descuento}%\n`);

    return coupon;
  } catch (error) {
    console.error('❌ Error verificando cupón:', error);
    return null;
  }
}

async function testCouponApplication(couponCode, products) {
  try {
    console.log(`🧪 Probando aplicación del cupón "${couponCode}"...\n`);

    // Crear un carrito con varios productos de la misma categoría
    const cartData = {
      code: couponCode,
      cart: {
        items: products.map((p, idx) => ({
          product_id: p.id,
          name: p.name,
          price: 100.00 + (idx * 10), // Precios diferentes
          quantity: 1,
          category_id: p.category_id,
          subcategory_id: p.subcategory_id
        }))
      }
    };

    console.log('Productos en el carrito:');
    cartData.cart.items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [ID:${item.product_id}] ${item.name} - L${item.price}`);
    });
    console.log('');

    const response = await axios.post(
      'http://localhost:3000/api/v1/ecommerce/cart/validate-coupon',
      cartData
    );

    if (response.data.success) {
      const result = response.data.data.coupon;
      console.log('✅ CUPÓN APLICADO:');
      console.log(`   Código: ${result.code}`);
      console.log(`   Descuento: L${result.discount_amount.toFixed(2)}`);
      console.log('');

      // Calcular cuántos productos obtuvieron descuento
      const totalCart = cartData.cart.items.reduce((sum, item) => sum + item.price, 0);
      console.log(`   Total Carrito: L${totalCart.toFixed(2)}`);
      console.log(`   ¿Aplicó solo al producto específico? ${result.discount_amount < totalCart ? '✅ SÍ' : '❌ NO (aplicó a todos)'}`);

      return true;
    }
  } catch (error) {
    console.log('❌ Error al aplicar cupón:', error.response?.data?.message || error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PRUEBA: CUPÓN CON PRODUCTO ESPECÍFICO');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Autenticar
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('Abortando pruebas.');
    process.exit(1);
  }

  // 2. Obtener productos de prueba
  const product = await getProductInfo();
  if (!product) {
    console.log('No se pudo obtener información de productos.');
    process.exit(1);
  }

  // 3. Obtener más productos de la misma categoría para el carrito
  const query = `
    SELECT id, code, name, category_id, subcategory_id
    FROM products
    WHERE category_id = ? AND subcategory_id = ?
    LIMIT 3
  `;
  const allProducts = await db.query(query, [product.category_id, product.subcategory_id]);

  // 4. Crear cupón con producto específico
  const coupon = await createCouponWithSpecificProduct(product);
  if (!coupon) {
    console.log('No se pudo crear el cupón.');
    process.exit(1);
  }

  // 5. Verificar en base de datos
  await new Promise(resolve => setTimeout(resolve, 1000));
  const dbCoupon = await verifyCouponInDatabase(coupon.id);
  if (!dbCoupon) {
    console.log('No se pudo verificar el cupón en BD.');
    process.exit(1);
  }

  if (!dbCoupon.producto_id) {
    console.log('⚠️ ¡PROBLEMA DETECTADO! El producto_id NO se guardó en la base de datos.');
    console.log('   Esto explica por qué el cupón se aplica a toda la categoría.');
  } else {
    console.log('✅ El producto_id SÍ se guardó correctamente.');
  }

  // 6. Probar aplicación del cupón
  console.log('\n' + '═'.repeat(60) + '\n');
  await testCouponApplication(coupon.codigo, allProducts);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   PRUEBA COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(0);
}

main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
