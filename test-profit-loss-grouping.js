/**
 * Script para probar la funcionalidad de agrupación del reporte P&L
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'admin123'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Error al hacer login:', error.message);
    throw error;
  }
}

async function testGrouping(token, groupBy, dateFrom, dateTo) {
  try {
    console.log(`\n🧪 Probando agrupación: ${groupBy} (${dateFrom} - ${dateTo})`);

    const response = await axios.get(`${BASE_URL}/profit-loss`, {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = response.data.data;
    console.log(`✅ Períodos generados: ${data.periods.length}`);
    console.log(`📊 Períodos:`);
    data.periods.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.period} (${p.start_date} - ${p.end_date})`);
      console.log(`      Ingresos: L ${p.income.total.toFixed(2)}`);
      console.log(`      Gastos: L ${p.expenses.total.toFixed(2)}`);
      console.log(`      Utilidad Neta: L ${p.net_profit.toFixed(2)}`);
    });

    return data;
  } catch (error) {
    console.error(`❌ Error en ${groupBy}:`, error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de agrupación P&L...\n');

  try {
    // Login
    const token = await login();
    console.log('✅ Login exitoso\n');

    // Test 1: Por mes (Nov-Dic 2025)
    await testGrouping(token, 'month', '2025-11-01', '2025-12-31');

    // Test 2: Por día (8-10 Dic 2025)
    await testGrouping(token, 'day', '2025-12-08', '2025-12-10');

    // Test 3: Por hora (Hoy)
    const today = new Date().toISOString().split('T')[0];
    await testGrouping(token, 'hour', today, today);

    // Test 4: Por semana (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    await testGrouping(token, 'week', dateFrom, today);

    // Test 5: Total (todo el rango)
    await testGrouping(token, 'total', '2025-01-01', '2025-12-31');

    console.log('\n✅ Todas las pruebas completadas\n');

  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
runTests();
