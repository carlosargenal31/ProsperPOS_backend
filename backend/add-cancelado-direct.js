// ===================================================================
// Script para agregar el estado 'cancelado' - Conexión directa
// ===================================================================

const mysql = require('mysql2/promise');

async function addCanceladoStatus() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');

    // Conexión directa
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✓ Conectado a la base de datos\n');
    console.log('Agregando estado "cancelado" a la tabla orders...');

    // Modificar el ENUM para incluir 'cancelado'
    await connection.execute(`
      ALTER TABLE orders
      MODIFY COLUMN status ENUM('pendiente', 'cotizado', 'cobrado', 'cancelado')
      DEFAULT 'pendiente'
    `);

    console.log('✓ Estado "cancelado" agregado correctamente a la tabla orders');

    // También actualizar la tabla order_status_history
    console.log('\nActualizando tabla order_status_history...');

    await connection.execute(`
      ALTER TABLE order_status_history
      MODIFY COLUMN previous_status ENUM('pendiente', 'cotizado', 'cobrado', 'cancelado') NOT NULL
    `);

    console.log('✓ Campo previous_status actualizado');

    await connection.execute(`
      ALTER TABLE order_status_history
      MODIFY COLUMN new_status ENUM('pendiente', 'cotizado', 'cobrado', 'cancelado') NOT NULL
    `);

    console.log('✓ Campo new_status actualizado');

    console.log('\n✅ ¡Estado "cancelado" agregado exitosamente!');
    console.log('\nAhora puedes usar el estado "cancelado" en:');
    console.log('  - Template Admin: http://localhost:3001/vue/template/tienda-online/pedidos');
    console.log('  - Ecommerce Cliente: http://localhost:5173/profile');

  } catch (error) {
    console.error('\n❌ Error al agregar estado "cancelado":');
    console.error('Mensaje:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Error de acceso a la base de datos.');
      console.error('Verifica las credenciales en este script.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n⚠️  Base de datos "prosperpos" no encontrada.');
      console.error('Verifica que la base de datos existe.');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada.');
    }
  }
}

addCanceladoStatus();
