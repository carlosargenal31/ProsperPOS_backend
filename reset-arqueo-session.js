const mysql = require('mysql2/promise');

async function resetArqueoSession() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Reseteando sesión de arqueo...\n');

    // 1. Eliminar denominaciones existentes
    await connection.query('DELETE FROM cash_register_denominations WHERE session_id = 5');
    console.log('✓ Denominaciones eliminadas');

    // 2. Eliminar pagos bancarios existentes
    await connection.query('DELETE FROM cash_register_bank_payments WHERE session_id = 5');
    console.log('✓ Pagos bancarios eliminados');

    // 3. Resetear valores de la sesión a cero/inicial
    await connection.query(`
      UPDATE cash_register_sessions SET
        total_card = 0.00,
        total_cash = 0.00,
        total_transfer = 0.00,
        total_sum = 0.00,
        final_total = 3400.00,
        total_by_count = 0.00,
        difference = 0.00,
        date_to = NULL,
        time_to = NULL,
        status = 'ABIERTA'
      WHERE id = 5
    `);
    console.log('✓ Sesión reseteada');

    // 4. Mostrar estado actual
    const [session] = await connection.query('SELECT * FROM cash_register_sessions WHERE id = 5');
    console.log('\nEstado actual de la sesión:');
    console.log('  - opening_amount:', session[0].opening_amount);
    console.log('  - total_cash:', session[0].total_cash);
    console.log('  - total_by_count:', session[0].total_by_count);
    console.log('  - total_by_system:', session[0].total_by_system);
    console.log('  - final_total:', session[0].final_total);
    console.log('  - difference:', session[0].difference);
    console.log('  - status:', session[0].status);

    console.log('\n✅ Sesión reseteada correctamente. Puedes probar nuevamente.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetArqueoSession();
