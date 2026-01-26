/**
 * SCRIPT DE PRUEBA - CUPONES CON DÍAS DE LA SEMANA
 * Prueba la funcionalidad de días de la semana en cupones
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Credenciales de prueba
const credentials = {
  email: 'admin@prosperpos.com',
  password: 'admin123'
};

let authToken = '';

/**
 * Función para autenticarse y obtener token
 */
async function authenticate() {
  try {
    console.log('🔐 Autenticando...');
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Autenticación exitosa');
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

/**
 * Crear un cupón de prueba con días de la semana específicos
 */
async function createTestCoupon() {
  try {
    console.log('\n📝 Creando cupón de prueba...');

    // Obtener el siguiente código
    const codeResponse = await axios.get(`${BASE_URL}/coupons/next-code`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const nextCode = codeResponse.data.data.codigo;

    // Crear cupón que solo aplica de lunes a viernes
    const couponData = {
      codigo: nextCode,
      nombre: 'DESCUENTO DIAS LABORALES',
      tipo_descuento: 'monto',
      valor_descuento: 50.00,
      limitar_fecha: false,
      tipo_aplicacion: 'grupo',
      categoria_id: 1,
      aplica_lunes: true,
      aplica_martes: true,
      aplica_miercoles: true,
      aplica_jueves: true,
      aplica_viernes: true,
      aplica_sabado: false,  // No aplica sábado
      aplica_domingo: false, // No aplica domingo
      suspendida: false,
      is_active: true
    };

    console.log('Datos del cupón:', JSON.stringify(couponData, null, 2));

    const response = await axios.post(`${BASE_URL}/coupons`, couponData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Cupón creado exitosamente:', response.data.data.codigo);
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

/**
 * Validar el cupón creado
 */
async function validateCoupon(code) {
  try {
    console.log(`\n🔍 Validando cupón ${code}...`);

    const response = await axios.get(`${BASE_URL}/coupons/validate/${code}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Cupón validado:', response.data);
    return true;
  } catch (error) {
    console.log('⚠️  Cupón no válido:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Obtener y mostrar el cupón creado
 */
async function getCoupon(id) {
  try {
    console.log(`\n📋 Obteniendo detalles del cupón ID ${id}...`);

    const response = await axios.get(`${BASE_URL}/coupons/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const coupon = response.data.data;
      console.log('✅ Cupón obtenido:');
      console.log('   Código:', coupon.codigo);
      console.log('   Nombre:', coupon.nombre);
      console.log('   Días activos:');
      console.log('     Lunes:', coupon.aplica_lunes ? '✅' : '❌');
      console.log('     Martes:', coupon.aplica_martes ? '✅' : '❌');
      console.log('     Miércoles:', coupon.aplica_miercoles ? '✅' : '❌');
      console.log('     Jueves:', coupon.aplica_jueves ? '✅' : '❌');
      console.log('     Viernes:', coupon.aplica_viernes ? '✅' : '❌');
      console.log('     Sábado:', coupon.aplica_sabado ? '✅' : '❌');
      console.log('     Domingo:', coupon.aplica_domingo ? '✅' : '❌');
      return coupon;
    } else {
      console.error('❌ Error al obtener cupón:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al obtener cupón:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   PRUEBA DE CUPONES CON DÍAS DE LA SEMANA');
  console.log('═══════════════════════════════════════════════════════\n');

  // Autenticar
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('\n❌ No se pudo autenticar. Abortando pruebas.');
    return;
  }

  // Crear cupón de prueba
  const coupon = await createTestCoupon();
  if (!coupon) {
    console.log('\n❌ No se pudo crear el cupón. Abortando pruebas.');
    return;
  }

  // Esperar un poco para que se guarde en la BD
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Obtener detalles del cupón
  await getCoupon(coupon.id);

  // Validar el cupón
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado

  console.log(`\n📅 Hoy es: ${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek]}`);

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log('ℹ️  El cupón NO debería ser válido hoy (fin de semana)');
  } else {
    console.log('ℹ️  El cupón DEBERÍA ser válido hoy (día laboral)');
  }

  await validateCoupon(coupon.codigo);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   PRUEBAS COMPLETADAS');
  console.log('═══════════════════════════════════════════════════════');
}

// Ejecutar
main().catch(console.error);
