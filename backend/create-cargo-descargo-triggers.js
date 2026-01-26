require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos'
};

async function createCargoDescargoTriggers() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);

    console.log('Creando triggers para actualización automática de stock...\n');

    // Trigger para INSERTAR detalles de cargo/descargo
    console.log('1. Creando trigger: after_cargo_descargo_detail_insert');
    await connection.query(`
      DROP TRIGGER IF EXISTS after_cargo_descargo_detail_insert
    `);

    await connection.query(`
      CREATE TRIGGER after_cargo_descargo_detail_insert
      AFTER INSERT ON cargo_descargo_details
      FOR EACH ROW
      BEGIN
        DECLARE doc_type VARCHAR(20);
        DECLARE doc_status VARCHAR(20);
        DECLARE doc_warehouse INT;

        -- Obtener tipo, estado y bodega del documento
        SELECT document_type, status, warehouse_id
        INTO doc_type, doc_status, doc_warehouse
        FROM cargo_descargo
        WHERE id = NEW.cargo_descargo_id;

        -- Solo actualizar stock si el documento está PROCESADO
        IF doc_status = 'PROCESADO' THEN
          IF doc_type = 'CARGO' THEN
            -- CARGO: Aumentar stock
            UPDATE stock
            SET quantity = quantity + NEW.quantity,
                updated_at = NOW()
            WHERE product_id = NEW.product_id
              AND warehouse_id = doc_warehouse;

            -- Si no existe registro de stock, crear uno
            IF ROW_COUNT() = 0 THEN
              INSERT INTO stock (product_id, warehouse_id, quantity, created_at, updated_at)
              VALUES (NEW.product_id, doc_warehouse, NEW.quantity, NOW(), NOW());
            END IF;

          ELSEIF doc_type = 'DESCARGO' THEN
            -- DESCARGO: Disminuir stock
            UPDATE stock
            SET quantity = quantity - NEW.quantity,
                updated_at = NOW()
            WHERE product_id = NEW.product_id
              AND warehouse_id = doc_warehouse;

            -- Si no existe registro de stock, crear uno con cantidad negativa
            IF ROW_COUNT() = 0 THEN
              INSERT INTO stock (product_id, warehouse_id, quantity, created_at, updated_at)
              VALUES (NEW.product_id, doc_warehouse, -NEW.quantity, NOW(), NOW());
            END IF;
          END IF;
        END IF;
      END
    `);
    console.log('   ✓ Trigger creado exitosamente\n');

    // Trigger para ACTUALIZAR documentos cuando cambian a PROCESADO
    console.log('2. Creando trigger: after_cargo_descargo_update');
    await connection.query(`
      DROP TRIGGER IF EXISTS after_cargo_descargo_update
    `);

    await connection.query(`
      CREATE TRIGGER after_cargo_descargo_update
      AFTER UPDATE ON cargo_descargo
      FOR EACH ROW
      BEGIN
        -- Solo procesar si cambió de otro estado a PROCESADO
        IF OLD.status != 'PROCESADO' AND NEW.status = 'PROCESADO' THEN
          -- Actualizar stock para cada detalle del documento
          IF NEW.document_type = 'CARGO' THEN
            -- CARGO: Aumentar stock
            UPDATE stock s
            INNER JOIN cargo_descargo_details d ON d.product_id = s.product_id
            SET s.quantity = s.quantity + d.quantity,
                s.updated_at = NOW()
            WHERE d.cargo_descargo_id = NEW.id
              AND s.warehouse_id = NEW.warehouse_id;

            -- Insertar registros de stock para productos que no existen
            INSERT INTO stock (product_id, warehouse_id, quantity, created_at, updated_at)
            SELECT d.product_id, NEW.warehouse_id, d.quantity, NOW(), NOW()
            FROM cargo_descargo_details d
            LEFT JOIN stock s ON s.product_id = d.product_id AND s.warehouse_id = NEW.warehouse_id
            WHERE d.cargo_descargo_id = NEW.id
              AND s.id IS NULL;

          ELSEIF NEW.document_type = 'DESCARGO' THEN
            -- DESCARGO: Disminuir stock
            UPDATE stock s
            INNER JOIN cargo_descargo_details d ON d.product_id = s.product_id
            SET s.quantity = s.quantity - d.quantity,
                s.updated_at = NOW()
            WHERE d.cargo_descargo_id = NEW.id
              AND s.warehouse_id = NEW.warehouse_id;

            -- Insertar registros de stock para productos que no existen (cantidad negativa)
            INSERT INTO stock (product_id, warehouse_id, quantity, created_at, updated_at)
            SELECT d.product_id, NEW.warehouse_id, -d.quantity, NOW(), NOW()
            FROM cargo_descargo_details d
            LEFT JOIN stock s ON s.product_id = d.product_id AND s.warehouse_id = NEW.warehouse_id
            WHERE d.cargo_descargo_id = NEW.id
              AND s.id IS NULL;
          END IF;
        END IF;
      END
    `);
    console.log('   ✓ Trigger creado exitosamente\n');

    // Trigger para CANCELAR documentos - revertir movimientos
    console.log('3. Creando trigger: after_cargo_descargo_cancel');
    await connection.query(`
      DROP TRIGGER IF EXISTS after_cargo_descargo_cancel
    `);

    await connection.query(`
      CREATE TRIGGER after_cargo_descargo_cancel
      AFTER UPDATE ON cargo_descargo
      FOR EACH ROW
      BEGIN
        -- Solo procesar si cambió de PROCESADO a CANCELADO
        IF OLD.status = 'PROCESADO' AND NEW.status = 'CANCELADO' THEN
          -- Revertir movimientos de stock
          IF NEW.document_type = 'CARGO' THEN
            -- Si fue CARGO, ahora restar lo que se había sumado
            UPDATE stock s
            INNER JOIN cargo_descargo_details d ON d.product_id = s.product_id
            SET s.quantity = s.quantity - d.quantity,
                s.updated_at = NOW()
            WHERE d.cargo_descargo_id = NEW.id
              AND s.warehouse_id = NEW.warehouse_id;

          ELSEIF NEW.document_type = 'DESCARGO' THEN
            -- Si fue DESCARGO, ahora sumar lo que se había restado
            UPDATE stock s
            INNER JOIN cargo_descargo_details d ON d.product_id = s.product_id
            SET s.quantity = s.quantity + d.quantity,
                s.updated_at = NOW()
            WHERE d.cargo_descargo_id = NEW.id
              AND s.warehouse_id = NEW.warehouse_id;
          END IF;
        END IF;
      END
    `);
    console.log('   ✓ Trigger creado exitosamente\n');

    console.log('✓ Todos los triggers fueron creados exitosamente');
    console.log('\nResumen:');
    console.log('  - after_cargo_descargo_detail_insert: Actualiza stock al insertar detalles');
    console.log('  - after_cargo_descargo_update: Actualiza stock cuando documento cambia a PROCESADO');
    console.log('  - after_cargo_descargo_cancel: Revierte movimientos cuando documento se CANCELA');

  } catch (error) {
    console.error('Error durante la creación de triggers:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la creación de triggers
createCargoDescargoTriggers();
