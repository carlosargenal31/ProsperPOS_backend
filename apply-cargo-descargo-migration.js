const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyMigration() {
  let connection;

  try {
    console.log('🔄 Conectando a la base de datos...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conexión establecida');
    console.log('🚀 Ejecutando migración de Cargo/Descargo...');

    // Crear tabla principal cargo_descargo
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cargo_descargo (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_number VARCHAR(50) UNIQUE NOT NULL,
        document_type ENUM('CARGO', 'DESCARGO') NOT NULL,
        movement_type ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA') NOT NULL,
        warehouse_id INT,
        warehouse_to_id INT NULL,
        issuer VARCHAR(255),
        concept TEXT,
        registration_date DATE NOT NULL,
        registered_by INT,
        subtotal DECIMAL(15,2) DEFAULT 0.00,
        tax_amount DECIMAL(15,2) DEFAULT 0.00,
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        status ENUM('BORRADOR', 'PROCESADO', 'CANCELADO') DEFAULT 'BORRADOR',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
        FOREIGN KEY (warehouse_to_id) REFERENCES warehouses(id) ON DELETE SET NULL,
        FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_document_number (document_number),
        INDEX idx_document_type (document_type),
        INDEX idx_warehouse (warehouse_id),
        INDEX idx_status (status),
        INDEX idx_registration_date (registration_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla cargo_descargo creada');

    // Crear tabla de detalles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cargo_descargo_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cargo_descargo_id INT NOT NULL,
        product_id INT NOT NULL,
        product_code VARCHAR(100),
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit_cost DECIMAL(15,2) DEFAULT 0.00,
        total_cost DECIMAL(15,2) DEFAULT 0.00,
        warehouse_location VARCHAR(255),
        sub_warehouse VARCHAR(255),
        current_stock DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cargo_descargo_id) REFERENCES cargo_descargo(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        INDEX idx_cargo_descargo (cargo_descargo_id),
        INDEX idx_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla cargo_descargo_details creada');

    // Eliminar trigger si existe
    await connection.query('DROP TRIGGER IF EXISTS after_cargo_descargo_process');
    console.log('🔧 Trigger anterior eliminado (si existía)');

    // Crear trigger para actualizar inventario
    await connection.query(`
      CREATE TRIGGER after_cargo_descargo_process
      AFTER UPDATE ON cargo_descargo
      FOR EACH ROW
      BEGIN
          DECLARE v_product_id INT;
          DECLARE v_quantity DECIMAL(10,2);
          DECLARE v_warehouse_id INT;
          DECLARE done INT DEFAULT FALSE;

          DECLARE product_cursor CURSOR FOR
              SELECT product_id, quantity
              FROM cargo_descargo_details
              WHERE cargo_descargo_id = NEW.id;

          DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

          IF OLD.status = 'BORRADOR' AND NEW.status = 'PROCESADO' THEN
              SET v_warehouse_id = NEW.warehouse_id;

              OPEN product_cursor;

              read_loop: LOOP
                  FETCH product_cursor INTO v_product_id, v_quantity;
                  IF done THEN
                      LEAVE read_loop;
                  END IF;

                  IF NEW.document_type = 'CARGO' OR NEW.movement_type = 'ENTRADA' THEN
                      INSERT INTO stock (warehouse_id, product_id, quantity, created_at, updated_at)
                      VALUES (v_warehouse_id, v_product_id, v_quantity, NOW(), NOW())
                      ON DUPLICATE KEY UPDATE
                          quantity = quantity + v_quantity,
                          updated_at = NOW();

                  ELSEIF NEW.document_type = 'DESCARGO' OR NEW.movement_type = 'SALIDA' THEN
                      UPDATE stock
                      SET quantity = quantity - v_quantity,
                          updated_at = NOW()
                      WHERE warehouse_id = v_warehouse_id
                        AND product_id = v_product_id;
                  END IF;
              END LOOP;

              CLOSE product_cursor;
          END IF;
      END
    `);
    console.log('✅ Trigger after_cargo_descargo_process creado');

    console.log('');
    console.log('✨ ¡Migración completada exitosamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('   ✓ Tabla cargo_descargo');
    console.log('   ✓ Tabla cargo_descargo_details');
    console.log('   ✓ Trigger after_cargo_descargo_process');
    console.log('');
    console.log('🎉 ¡Ya puedes usar el módulo de Manejo de Inventario!');

  } catch (error) {
    console.error('❌ Error al aplicar la migración:', error.message);
    console.error('');
    console.error('Detalles:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('');
      console.log('👋 Conexión cerrada');
    }
  }
}

applyMigration();
