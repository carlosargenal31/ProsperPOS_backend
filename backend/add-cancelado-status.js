// ===================================================================
// Script para agregar el estado 'cancelado' a la tabla orders
// ===================================================================

const db = require('./src/utils/database');
const logger = require('./src/utils/logger');

async function addCanceladoStatus() {
  try {
    console.log('Agregando estado "cancelado" a la tabla orders...');

    // Modificar el ENUM para incluir 'cancelado'
    await db.query(`
      ALTER TABLE orders
      MODIFY COLUMN status ENUM('pendiente', 'cotizado', 'cobrado', 'cancelado')
      DEFAULT 'pendiente'
    `);

    console.log('✓ Estado "cancelado" agregado correctamente');

    // También actualizar la tabla order_status_history
    console.log('\nActualizando tabla order_status_history...');

    await db.query(`
      ALTER TABLE order_status_history
      MODIFY COLUMN previous_status ENUM('pendiente', 'cotizado', 'cobrado', 'cancelado') NOT NULL
    `);

    await db.query(`
      ALTER TABLE order_status_history
      MODIFY COLUMN new_status ENUM('pendiente', 'cotizado', 'cobrado', 'cancelado') NOT NULL
    `);

    console.log('✓ Tabla order_status_history actualizada correctamente');

    console.log('\n¡Estado "cancelado" agregado exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error al agregar estado "cancelado":', error.message);
    process.exit(1);
  }
}

addCanceladoStatus();
