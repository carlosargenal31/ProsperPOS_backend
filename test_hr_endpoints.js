// ===================================================================
// PROSPERPOS - Script de Prueba para Endpoints de RH
// ===================================================================
// Este script verifica que todos los endpoints del módulo de RH
// estén funcionando correctamente
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

// Función para imprimir con color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para realizar login y obtener token
async function login() {
  try {
    log('\n📝 Intentando hacer login...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    authToken = response.data.data.token;
    log('✅ Login exitoso!', 'green');
    return true;
  } catch (error) {
    log('❌ Error en login: ' + (error.response?.data?.message || error.message), 'red');
    log('⚠️  Por favor asegúrate de que:', 'yellow');
    log('   1. El backend esté corriendo (npm run dev)', 'yellow');
    log('   2. Exista un usuario admin@example.com con password admin123', 'yellow');
    return false;
  }
}

// Función para probar endpoints
async function testEndpoint(method, url, data = null, description) {
  try {
    const config = {
      headers: { 'Authorization': `Bearer ${authToken}` }
    };

    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${url}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${url}`, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(`${BASE_URL}${url}`, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(`${BASE_URL}${url}`, config);
    }

    log(`✅ ${method} ${url} - ${description}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ ${method} ${url} - ${description}`, 'red');
    log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

// Función principal de pruebas
async function runTests() {
  log('=================================================================', 'blue');
  log('PROSPERPOS - Prueba de Endpoints de Recursos Humanos', 'blue');
  log('=================================================================', 'blue');

  // 1. Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se puede continuar sin autenticación', 'red');
    return;
  }

  // 2. Probar Departamentos
  log('\n📁 PROBANDO ENDPOINTS DE DEPARTAMENTOS', 'blue');
  log('-----------------------------------------------------------------', 'blue');

  const departments = await testEndpoint('GET', '/departments', null, 'Listar departamentos');
  await testEndpoint('GET', '/departments/active', null, 'Listar departamentos activos');

  if (departments && departments.data && departments.data.length > 0) {
    const deptId = departments.data[0].id;
    await testEndpoint('GET', `/departments/${deptId}`, null, 'Obtener departamento por ID');
  }

  // 3. Probar Cargos/Puestos
  log('\n💼 PROBANDO ENDPOINTS DE CARGOS/PUESTOS', 'blue');
  log('-----------------------------------------------------------------', 'blue');

  const positions = await testEndpoint('GET', '/positions', null, 'Listar cargos');
  await testEndpoint('GET', '/positions/active', null, 'Listar cargos activos');

  if (positions && positions.data && positions.data.length > 0) {
    const posId = positions.data[0].id;
    await testEndpoint('GET', `/positions/${posId}`, null, 'Obtener cargo por ID');

    if (positions.data[0].department_id) {
      await testEndpoint('GET', `/positions/department/${positions.data[0].department_id}`, null, 'Listar cargos por departamento');
    }
  }

  // 4. Probar Empleados
  log('\n👥 PROBANDO ENDPOINTS DE EMPLEADOS', 'blue');
  log('-----------------------------------------------------------------', 'blue');

  const employees = await testEndpoint('GET', '/employees', null, 'Listar empleados');
  await testEndpoint('GET', '/employees/active', null, 'Listar empleados activos');

  // 5. Crear un empleado de prueba
  log('\n➕ PROBANDO CREACIÓN DE EMPLEADO', 'blue');
  log('-----------------------------------------------------------------', 'blue');

  const newEmployee = {
    codigo: 'EMP-TEST-001',
    nombre: 'Juan',
    apellido: 'Pérez Test',
    email: `test-${Date.now()}@example.com`,
    telefono: '9999-9999',
    department_id: departments?.data?.[0]?.id || null,
    position_id: positions?.data?.[0]?.id || null,
    fecha_ingreso: '2025-01-01',
    salario: 15000.00,
    is_active: true
  };

  const createdEmployee = await testEndpoint('POST', '/employees', newEmployee, 'Crear empleado de prueba');

  // 6. Actualizar el empleado de prueba
  if (createdEmployee && createdEmployee.data && createdEmployee.data.id) {
    log('\n✏️  PROBANDO ACTUALIZACIÓN DE EMPLEADO', 'blue');
    log('-----------------------------------------------------------------', 'blue');

    const employeeId = createdEmployee.data.id;
    const updateData = {
      ...newEmployee,
      apellido: 'Pérez Test Actualizado',
      salario: 16000.00
    };

    await testEndpoint('PUT', `/employees/${employeeId}`, updateData, 'Actualizar empleado');

    // 7. Obtener el empleado actualizado
    const updatedEmployee = await testEndpoint('GET', `/employees/${employeeId}`, null, 'Obtener empleado actualizado');

    // 8. Eliminar el empleado de prueba
    log('\n🗑️  PROBANDO ELIMINACIÓN DE EMPLEADO', 'blue');
    log('-----------------------------------------------------------------', 'blue');

    await testEndpoint('DELETE', `/employees/${employeeId}`, null, 'Eliminar empleado de prueba');

    // Verificar que fue eliminado (soft delete)
    await testEndpoint('GET', `/employees/${employeeId}`, null, 'Verificar eliminación');
  }

  // Resumen
  log('\n=================================================================', 'blue');
  log('PRUEBAS COMPLETADAS', 'green');
  log('=================================================================', 'blue');
  log('\n✅ Si todos los tests pasaron, el módulo de RH está funcionando correctamente!', 'green');
  log('⚠️  Si hubo errores, revisa los mensajes anteriores para más detalles.', 'yellow');
  log('\n', 'reset');
}

// Ejecutar las pruebas
runTests().catch(error => {
  log('\n❌ Error fatal en las pruebas:', 'red');
  console.error(error);
  process.exit(1);
});
