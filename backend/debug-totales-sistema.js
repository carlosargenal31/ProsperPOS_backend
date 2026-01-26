const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function debugTotalesSistema() {
  try {
    console.log('🔐 Iniciando sesión...');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // Obtener sesiones
    const sessionsResponse = await axios.get(`${API_URL}/cash-register/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sessions = sessionsResponse.data.data;
    const openSession = sessions.find(s => s.status === 'ABIERTA');

    if (!openSession) {
      console.log('❌ No hay cajas abiertas');
      return;
    }

    console.log(`📦 Caja: ${openSession.consecutive}`);
    console.log(`   Apertura: L ${openSession.opening_amount}\n`);

    // Obtener detalles
    const sessionDetailResponse = await axios.get(
      `${API_URL}/cash-register/sessions/${openSession.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const sessionDetail = sessionDetailResponse.data.data;

    console.log('📊 TOTALES DEL SISTEMA (BACKEND):');
    console.log('========================================');
    console.log('systemTotals:', JSON.stringify(sessionDetail.system_totals, null, 2));

    console.log('\n🧮 VALIDACIÓN MATEMÁTICA:');
    console.log('========================================');
    const st = sessionDetail.system_totals;
    const suma = parseFloat(st.total_card_credit || 0) +
                 parseFloat(st.total_card_debit || 0) +
                 parseFloat(st.total_cash || 0) +
                 parseFloat(st.total_transfer || 0) +
                 parseFloat(st.total_credit_note || 0) +
                 parseFloat(st.total_check || 0) +
                 parseFloat(st.total_link_payment || 0);

    console.log(`Tarj. Crédito:  L ${st.total_card_credit || 0}`);
    console.log(`Tarj. Débito:   L ${st.total_card_debit || 0}`);
    console.log(`Efectivo:       L ${st.total_cash || 0}`);
    console.log(`Transferencia:  L ${st.total_transfer || 0}`);
    console.log(`Link Pago:      L ${st.total_link_payment || 0}`);
    console.log(`Nota Crédito:   L ${st.total_credit_note || 0}`);
    console.log(`Cheque:         L ${st.total_check || 0}`);
    console.log(`─────────────────────────────`);
    console.log(`Suma manual:    L ${suma.toFixed(2)}`);
    console.log(`Total general:  L ${st.total_general || 0}`);
    console.log(`Diferencia:     L ${(suma - st.total_general).toFixed(2)}`);

    if (Math.abs(suma - st.total_general) > 0.01) {
      console.log('\n⚠️  ¡HAY UNA DISCREPANCIA!');
    } else {
      console.log('\n✅ Los totales coinciden');
    }

    // Calcular ventas del día
    const apertura = parseFloat(openSession.opening_amount || 0);
    const totalGeneral = parseFloat(st.total_general || 0);
    const ventasDelDia = totalGeneral - apertura;

    console.log('\n💰 CÁLCULO DE VENTAS DEL DÍA:');
    console.log('========================================');
    console.log(`Total General:  L ${totalGeneral.toFixed(2)}`);
    console.log(`- Apertura:     L ${apertura.toFixed(2)}`);
    console.log(`─────────────────────────────`);
    console.log(`= VENTAS DÍA:   L ${ventasDelDia.toFixed(2)}`);

    // Validar que coincide con la suma de ventas
    const efectivoSinApertura = parseFloat(st.total_cash || 0) - apertura;
    const sumaVentas = parseFloat(st.total_card_credit || 0) +
                       parseFloat(st.total_card_debit || 0) +
                       efectivoSinApertura +
                       parseFloat(st.total_transfer || 0) +
                       parseFloat(st.total_link_payment || 0) +
                       parseFloat(st.total_credit_note || 0) +
                       parseFloat(st.total_check || 0);

    console.log('\n🔍 VERIFICACIÓN ALTERNATIVA:');
    console.log('========================================');
    console.log(`Tarj. Crédito:       L ${(st.total_card_credit || 0)}`);
    console.log(`Tarj. Débito:        L ${(st.total_card_debit || 0)}`);
    console.log(`Efectivo (sin apert):L ${efectivoSinApertura.toFixed(2)}`);
    console.log(`Transferencia:       L ${(st.total_transfer || 0)}`);
    console.log(`Link Pago:           L ${(st.total_link_payment || 0)}`);
    console.log(`─────────────────────────────`);
    console.log(`Suma de ventas:      L ${sumaVentas.toFixed(2)}`);
    console.log(`Ventas calculadas:   L ${ventasDelDia.toFixed(2)}`);

    if (Math.abs(sumaVentas - ventasDelDia) > 0.01) {
      console.log('\n⚠️  ¡NO COINCIDEN LAS VENTAS!');
    } else {
      console.log('\n✅ Las ventas coinciden correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugTotalesSistema();
