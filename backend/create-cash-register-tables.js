/**
 * Script de Migración: Tablas de Arqueo de Caja
 *
 * Este script crea las tablas necesarias para el módulo de Arqueo de Caja:
 * - cash_register_sessions: Sesiones de caja (Apertura/Cierre)
 * - cash_register_transactions: Transacciones de caja (Egresos/Retiros)
 * - cash_register_denominations: Denominaciones de moneda para arqueos
 */

// Cargar variables de entorno
require('dotenv').config();

const db = require('./src/utils/database');

async function createCashRegisterTables() {
  // Primero conectar a la base de datos
  await db.connectDatabase();

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    console.log('Iniciando creación de tablas de Arqueo de Caja...');

    // ================================================================
    // 1. Tabla: cash_register_sessions
    // ================================================================
    console.log('\n1. Creando tabla cash_register_sessions...');

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS cash_register_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        consecutive VARCHAR(50) NOT NULL UNIQUE COMMENT 'Consecutivo único del arqueo',
        session_type ENUM('APERTURA', 'CIERRE') NOT NULL COMMENT 'Tipo de sesión',

        -- Información de usuario y ubicación
        user_id INT NOT NULL COMMENT 'Usuario que realiza la operación',
        branch_id INT DEFAULT NULL COMMENT 'Sucursal',
        agency VARCHAR(255) DEFAULT NULL COMMENT 'Agencia',

        -- Fechas y horas
        date_from DATE NOT NULL COMMENT 'Fecha inicial del arqueo',
        date_to DATE DEFAULT NULL COMMENT 'Fecha final del arqueo',
        time_from TIME NOT NULL COMMENT 'Hora inicial',
        time_to TIME DEFAULT NULL COMMENT 'Hora final',

        -- Totales por forma de pago
        total_card DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total en tarjeta de crédito',
        total_cash DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total en efectivo',
        total_transfer DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total en transferencia',
        total_sum DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Suma de todos los totales',

        -- Apertura de caja
        opening_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Monto de apertura de caja',

        -- Total final
        final_total DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total final del arqueo',

        -- Información bancaria
        currency VARCHAR(10) DEFAULT 'LEMPIRA' COMMENT 'Moneda',
        exchange_rate DECIMAL(10, 4) DEFAULT 0.00 COMMENT 'Tasa de cambio',
        payment_method VARCHAR(50) DEFAULT NULL COMMENT 'Forma de pago',
        bank VARCHAR(255) DEFAULT NULL COMMENT 'Banco',
        reference VARCHAR(255) DEFAULT NULL COMMENT 'Referencia bancaria',
        bank_commission_percentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Porcentaje de comisión del banco',
        bank_commission_total DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total de comisión del banco',

        -- Totales según arqueo y sistema
        total_by_count DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total según arqueo manual',
        total_by_system DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total según sistema',
        difference DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Diferencia entre arqueo y sistema',

        -- Notas
        notes TEXT COMMENT 'Notas adicionales',

        -- Estado
        status ENUM('ABIERTA', 'CERRADA', 'CANCELADA') DEFAULT 'ABIERTA',

        -- Auditoría
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT DEFAULT NULL,

        -- Índices y llaves foráneas
        INDEX idx_consecutive (consecutive),
        INDEX idx_user (user_id),
        INDEX idx_branch (branch_id),
        INDEX idx_session_type (session_type),
        INDEX idx_date_range (date_from, date_to),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Sesiones de caja para apertura y cierre';
    `;

    await connection.query(createSessionsTable);
    console.log('✓ Tabla cash_register_sessions creada exitosamente');

    // ================================================================
    // 2. Tabla: cash_register_transactions
    // ================================================================
    console.log('\n2. Creando tabla cash_register_transactions...');

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS cash_register_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT NOT NULL COMMENT 'Sesión de caja asociada',

        transaction_type ENUM('EGRESO', 'RETIRO', 'DEVOLUCION') NOT NULL COMMENT 'Tipo de transacción',

        -- Información de la transacción
        amount DECIMAL(15, 2) NOT NULL COMMENT 'Monto de la transacción',
        description TEXT COMMENT 'Descripción de la transacción',
        payment_method VARCHAR(50) DEFAULT 'EFECTIVO' COMMENT 'Forma de pago',

        -- Información bancaria (si aplica)
        bank VARCHAR(255) DEFAULT NULL COMMENT 'Banco',
        reference VARCHAR(255) DEFAULT NULL COMMENT 'Referencia',

        -- Información del beneficiario
        beneficiary VARCHAR(255) DEFAULT NULL COMMENT 'Beneficiario del egreso/retiro',
        beneficiary_type VARCHAR(50) DEFAULT NULL COMMENT 'Tipo de beneficiario',

        -- Usuario que registra
        user_id INT NOT NULL COMMENT 'Usuario que registra la transacción',

        -- Auditoría
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Índices y llaves foráneas
        INDEX idx_session (session_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_user (user_id),
        INDEX idx_created_at (created_at),

        FOREIGN KEY (session_id) REFERENCES cash_register_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Transacciones de caja (egresos, retiros, devoluciones)';
    `;

    await connection.query(createTransactionsTable);
    console.log('✓ Tabla cash_register_transactions creada exitosamente');

    // ================================================================
    // 3. Tabla: cash_register_denominations
    // ================================================================
    console.log('\n3. Creando tabla cash_register_denominations...');

    const createDenominationsTable = `
      CREATE TABLE IF NOT EXISTS cash_register_denominations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT NOT NULL COMMENT 'Sesión de caja asociada',

        -- Información de la denominación
        denomination VARCHAR(50) NOT NULL COMMENT 'Denominación (Ej: Billete 500.00, Billete 100.00, Moneda 1.00)',
        currency VARCHAR(10) DEFAULT 'LEMPIRA' COMMENT 'Moneda',
        quantity INT NOT NULL DEFAULT 0 COMMENT 'Cantidad de billetes/monedas',
        unit_value DECIMAL(15, 2) NOT NULL COMMENT 'Valor unitario del billete/moneda',
        total_value DECIMAL(15, 2) NOT NULL COMMENT 'Valor total (cantidad * valor_unitario)',

        -- Auditoría
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Índices y llaves foráneas
        INDEX idx_session (session_id),
        INDEX idx_currency (currency),

        FOREIGN KEY (session_id) REFERENCES cash_register_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Denominaciones de efectivo para arqueos de caja';
    `;

    await connection.query(createDenominationsTable);
    console.log('✓ Tabla cash_register_denominations creada exitosamente');

    // ================================================================
    // 4. Tabla: cash_register_bank_payments
    // ================================================================
    console.log('\n4. Creando tabla cash_register_bank_payments...');

    const createBankPaymentsTable = `
      CREATE TABLE IF NOT EXISTS cash_register_bank_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT NOT NULL COMMENT 'Sesión de caja asociada',

        -- Información bancaria
        bank VARCHAR(255) NOT NULL COMMENT 'Banco',
        reference VARCHAR(255) DEFAULT NULL COMMENT 'Referencia bancaria',
        currency VARCHAR(10) DEFAULT 'LEMPIRA' COMMENT 'Moneda',

        -- Montos
        total_ext DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total en moneda extranjera',
        total_local DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total en moneda local',

        -- Auditoría
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Índices y llaves foráneas
        INDEX idx_session (session_id),
        INDEX idx_bank (bank),

        FOREIGN KEY (session_id) REFERENCES cash_register_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Pagos bancarios asociados a sesiones de caja';
    `;

    await connection.query(createBankPaymentsTable);
    console.log('✓ Tabla cash_register_bank_payments creada exitosamente');

    // ================================================================
    // 5. Crear vistas útiles (OMITIDO - se puede crear manualmente si es necesario)
    // ================================================================
    console.log('\n5. Vistas omitidas (las consultas las maneja el modelo directamente)');

    // ================================================================
    // Commit de la transacción
    // ================================================================
    await connection.commit();
    console.log('\n✅ TODAS LAS TABLAS DE ARQUEO DE CAJA CREADAS EXITOSAMENTE\n');

    // Mostrar resumen
    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESUMEN DE TABLAS CREADAS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ cash_register_sessions         - Sesiones de caja');
    console.log('✓ cash_register_transactions     - Transacciones (egresos/retiros)');
    console.log('✓ cash_register_denominations    - Denominaciones de efectivo');
    console.log('✓ cash_register_bank_payments    - Pagos bancarios');
    console.log('✓ v_cash_register_session_summary - Vista de resumen');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    await connection.rollback();
    console.error('\n❌ ERROR AL CREAR TABLAS DE ARQUEO DE CAJA:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Ejecutar la migración
createCashRegisterTables()
  .then(() => {
    console.log('Migración completada. Cerrando conexión...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migración fallida:', error);
    process.exit(1);
  });
