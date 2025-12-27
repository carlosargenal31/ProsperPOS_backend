// ===================================================================
// PROSPERPOS - MIGRADOR AUTOMÁTICO DE BASE DE DATOS
// ===================================================================

const db = require('./database');
const logger = require('./logger');

class DatabaseMigrator {
  
  static async runMigrations() {
    logger.info('🔄 Iniciando migraciones automáticas de base de datos...');

    try {
      await this.createTables();
      await this.createIndexes();
      await this.insertDefaultData();
      await this.addBranchIdToInvoices();
      await this.createInventoryAdjustmentTables();
      await this.moveMinMaxStockToStockTable();
      logger.info('✅ Migraciones completadas exitosamente');
    } catch (error) {
      logger.error('❌ Error en migraciones:', error);
      throw error;
    }
  }

  static async createTables() {
    const connection = await db.getConnection();
    
    try {
      // 1. Tabla de roles
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT NULL,
          permissions JSON NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          
          INDEX idx_roles_name (name),
          INDEX idx_roles_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 2. Tabla de tiendas
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS stores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(20) UNIQUE NOT NULL,
          address TEXT NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          country VARCHAR(100) DEFAULT 'Honduras',
          phone VARCHAR(20) NULL,
          email VARCHAR(100) NULL,
          manager_id INT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          
          INDEX idx_stores_code (code),
          INDEX idx_stores_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 3. Tabla de usuarios
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          phone VARCHAR(20) NULL,
          role_id INT NOT NULL,
          store_id INT NULL,
          avatar VARCHAR(255) NULL,
          is_active BOOLEAN DEFAULT TRUE,
          last_login TIMESTAMP NULL,
          failed_login_attempts INT DEFAULT 0,
          locked_until TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          created_by INT NULL,
          deleted_by INT NULL,
          
          INDEX idx_users_username (username),
          INDEX idx_users_email (email),
          INDEX idx_users_role_id (role_id),
          INDEX idx_users_store_id (store_id),
          INDEX idx_users_is_active (is_active),
          INDEX idx_users_deleted_at (deleted_at),
          
          FOREIGN KEY (role_id) REFERENCES roles(id),
          FOREIGN KEY (store_id) REFERENCES stores(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 4. Tabla de categorías
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(120) UNIQUE NOT NULL,
          description TEXT NULL,
          parent_id VARCHAR(36) NULL,
          image_url VARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          meta_title VARCHAR(150) NULL,
          meta_description VARCHAR(300) NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          
          INDEX idx_categories_slug (slug),
          INDEX idx_categories_parent_id (parent_id),
          INDEX idx_categories_is_active (is_active),
          INDEX idx_categories_sort_order (sort_order),
          
          FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 5. Tabla de marcas
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS brands (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(120) UNIQUE NOT NULL,
          description TEXT NULL,
          logo_url VARCHAR(500) NULL,
          website VARCHAR(255) NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          
          INDEX idx_brands_slug (slug),
          INDEX idx_brands_is_active (is_active),
          
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 6. Tabla de proveedores
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id VARCHAR(36) PRIMARY KEY,
          code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          company_name VARCHAR(150) NULL,
          email VARCHAR(100) NULL,
          phone VARCHAR(20) NULL,
          mobile VARCHAR(20) NULL,
          address TEXT NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          country VARCHAR(100) DEFAULT 'Honduras',
          postal_code VARCHAR(20) NULL,
          website VARCHAR(255) NULL,
          tax_number VARCHAR(50) NULL,
          rtn VARCHAR(14) NULL,
          credit_limit DECIMAL(15,2) DEFAULT 0,
          payment_terms INT DEFAULT 30,
          supplier_type ENUM('general', 'manufacturer', 'distributor') DEFAULT 'general',
          is_active BOOLEAN DEFAULT TRUE,
          notes TEXT NULL,
          contact_person VARCHAR(100) NULL,
          contact_phone VARCHAR(20) NULL,
          contact_email VARCHAR(100) NULL,
          bank_name VARCHAR(100) NULL,
          bank_account VARCHAR(50) NULL,
          bank_routing VARCHAR(50) NULL,
          image_url VARCHAR(500) NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          
          INDEX idx_suppliers_code (code),
          INDEX idx_suppliers_name (name),
          INDEX idx_suppliers_email (email),
          INDEX idx_suppliers_type (supplier_type),
          INDEX idx_suppliers_is_active (is_active),
          
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 7. Tabla de productos
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          barcode VARCHAR(100) NULL,
          sku VARCHAR(100) NULL,
          category_id INT NULL,
          brand_id INT NULL,
          supplier_id INT NULL,
          description TEXT NULL,
          unit VARCHAR(20) DEFAULT 'Unidad',
          min_stock INT DEFAULT 0,
          max_stock INT DEFAULT 1000,
          status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
          sale_price DECIMAL(15,2) DEFAULT 0,
          cost_price DECIMAL(15,2) DEFAULT 0,
          image VARCHAR(500) NULL,
          weight DECIMAL(10,3) NULL,
          dimensions VARCHAR(100) NULL,
          warranty_months INT NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          
          INDEX idx_products_code (code),
          INDEX idx_products_barcode (barcode),
          INDEX idx_products_sku (sku),
          INDEX idx_products_name (name),
          INDEX idx_products_category (category_id),
          INDEX idx_products_brand (brand_id),
          INDEX idx_products_supplier (supplier_id),
          INDEX idx_products_status (status),
          
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
          FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 8. Tabla de precios de productos
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS product_prices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          store_id INT NOT NULL,
          price_type ENUM('cost', 'sale', 'purchase', 'wholesale') NOT NULL,
          price DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          UNIQUE KEY unique_product_store_type (product_id, store_id, price_type),
          INDEX idx_prices_product (product_id),
          INDEX idx_prices_store (store_id),
          
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 9. Tabla de stock
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS stock (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          store_id INT NOT NULL,
          warehouse_id INT DEFAULT 1,
          quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
          reserved_quantity DECIMAL(15,3) DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          UNIQUE KEY unique_product_store_warehouse (product_id, store_id, warehouse_id),
          INDEX idx_stock_product (product_id),
          INDEX idx_stock_store (store_id),
          
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 10. Tabla de clientes
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          email VARCHAR(100) NULL,
          phone VARCHAR(20) NULL,
          document_type ENUM('cedula', 'pasaporte', 'rtn') DEFAULT 'cedula',
          document_number VARCHAR(50) NULL,
          address TEXT NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          postal_code VARCHAR(20) NULL,
          country VARCHAR(100) DEFAULT 'Honduras',
          birth_date DATE NULL,
          gender ENUM('M', 'F', 'Other') NULL,
          customer_type ENUM('individual', 'business') DEFAULT 'individual',
          company_name VARCHAR(150) NULL,
          tax_id VARCHAR(50) NULL,
          credit_limit DECIMAL(15,2) DEFAULT 0,
          status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
          notes TEXT NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          deleted_by INT NULL,
          
          INDEX idx_customers_email (email),
          INDEX idx_customers_phone (phone),
          INDEX idx_customers_document (document_type, document_number),
          INDEX idx_customers_type (customer_type),
          INDEX idx_customers_status (status),
          
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 11. Tabla de métodos de pago
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          code VARCHAR(20) UNIQUE NOT NULL,
          description TEXT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          requires_reference BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_payment_methods_code (code),
          INDEX idx_payment_methods_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 12. Tabla de ventas
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sale_number VARCHAR(50) UNIQUE NOT NULL,
          customer_id INT NULL,
          user_id INT NOT NULL,
          store_id INT NOT NULL,
          sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subtotal DECIMAL(15,2) NOT NULL,
          tax DECIMAL(15,2) DEFAULT 0,
          discount DECIMAL(15,2) DEFAULT 0,
          total DECIMAL(15,2) NOT NULL,
          status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'completed',
          payment_status ENUM('pending', 'paid', 'partial', 'refunded') DEFAULT 'paid',
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_sales_number (sale_number),
          INDEX idx_sales_customer (customer_id),
          INDEX idx_sales_user (user_id),
          INDEX idx_sales_store (store_id),
          INDEX idx_sales_date (sale_date),
          INDEX idx_sales_status (status),
          
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (store_id) REFERENCES stores(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 13. Tabla de items de venta
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sale_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity DECIMAL(15,3) NOT NULL,
          unit_price DECIMAL(15,2) NOT NULL,
          discount DECIMAL(15,2) DEFAULT 0,
          tax DECIMAL(15,2) DEFAULT 0,
          subtotal DECIMAL(15,2) NOT NULL,
          total DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_sale_items_sale (sale_id),
          INDEX idx_sale_items_product (product_id),
          
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 14. Tabla de compras
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS purchases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_number VARCHAR(50) UNIQUE NOT NULL,
          supplier_id INT NOT NULL,
          user_id INT NOT NULL,
          store_id INT NOT NULL,
          purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subtotal DECIMAL(15,2) NOT NULL,
          tax DECIMAL(15,2) DEFAULT 0,
          discount DECIMAL(15,2) DEFAULT 0,
          total DECIMAL(15,2) NOT NULL,
          status ENUM('pending', 'received', 'partial', 'cancelled') DEFAULT 'pending',
          payment_status ENUM('pending', 'paid', 'partial') DEFAULT 'pending',
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_purchases_number (purchase_number),
          INDEX idx_purchases_supplier (supplier_id),
          INDEX idx_purchases_user (user_id),
          INDEX idx_purchases_store (store_id),
          INDEX idx_purchases_date (purchase_date),
          INDEX idx_purchases_status (status),
          
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (store_id) REFERENCES stores(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 15. Tabla de items de compra
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS purchase_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity DECIMAL(15,3) NOT NULL,
          unit_price DECIMAL(15,2) NOT NULL,
          discount DECIMAL(15,2) DEFAULT 0,
          tax DECIMAL(15,2) DEFAULT 0,
          subtotal DECIMAL(15,2) NOT NULL,
          total DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_purchase_items_purchase (purchase_id),
          INDEX idx_purchase_items_product (product_id),
          
          FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      logger.info('✅ Todas las tablas creadas exitosamente');
      
    } finally {
      connection.release();
    }
  }

  static async createIndexes() {
    // Los índices ya están incluidos en CREATE TABLE
    logger.info('✅ Índices creados automáticamente');
  }

  static async insertDefaultData() {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insertar roles por defecto
      await connection.execute(`
        INSERT IGNORE INTO roles (id, name, description, is_active) VALUES 
        (1, 'admin', 'Administrador del sistema', TRUE),
        (2, 'manager', 'Gerente de tienda', TRUE),
        (3, 'cashier', 'Cajero', TRUE),
        (4, 'employee', 'Empleado', TRUE)
      `);

      // Insertar tienda por defecto
      await connection.execute(`
        INSERT IGNORE INTO stores (id, name, code, address, city, state, country, is_active) VALUES 
        (1, 'Tienda Principal', 'MAIN01', 'Centro Comercial, Local 123', 'Tegucigalpa', 'Francisco Morazán', 'Honduras', TRUE)
      `);

      // Insertar usuario admin por defecto
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await connection.execute(`
        INSERT IGNORE INTO users (
          username, email, password, first_name, last_name, 
          role_id, store_id, is_active
        ) VALUES (
          'admin@prosperpos.com',
          'admin@prosperpos.com', 
          ?,
          'Administrador',
          'Sistema',
          1,
          1,
          TRUE
        )
      `, [hashedPassword]);

      // Insertar métodos de pago por defecto
      await connection.execute(`
        INSERT IGNORE INTO payment_methods (id, name, code, is_active) VALUES 
        (1, 'Efectivo', 'CASH', TRUE),
        (2, 'Tarjeta de Crédito', 'CREDIT_CARD', TRUE),
        (3, 'Tarjeta de Débito', 'DEBIT_CARD', TRUE),
        (4, 'Transferencia', 'TRANSFER', TRUE)
      `);

      await connection.commit();
      logger.info('✅ Datos por defecto insertados');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addBranchIdToInvoices() {
    const connection = await db.getConnection();

    try {
      // Verificar si la columna branch_id ya existe
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'invoices'
        AND COLUMN_NAME = 'branch_id'
      `);

      if (columns.length === 0) {
        logger.info('🔧 Agregando columna branch_id a la tabla invoices...');

        // Agregar columna branch_id después de warehouse_id
        await connection.execute(`
          ALTER TABLE invoices
          ADD COLUMN branch_id INT DEFAULT 1 COMMENT 'ID de la sucursal (branches)'
          AFTER warehouse_id
        `);

        // Actualizar todos los registros existentes con branch_id = 1
        await connection.execute(`
          UPDATE invoices SET branch_id = 1 WHERE branch_id IS NULL
        `);

        // Crear índice para mejorar el rendimiento
        await connection.execute(`
          CREATE INDEX idx_invoices_branch_id ON invoices(branch_id)
        `);

        logger.info('✅ Columna branch_id agregada exitosamente a invoices');
      } else {
        logger.info('✅ Columna branch_id ya existe en invoices');
      }

    } catch (error) {
      logger.error('❌ Error al agregar branch_id a invoices:', error);
      // No lanzar el error para que la aplicación continúe
    } finally {
      connection.release();
    }
  }

  static async checkConnection() {
    try {
      const connection = await db.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      logger.info('✅ Conexión a base de datos verificada');
      return true;
    } catch (error) {
      logger.error('❌ Error de conexión a base de datos:', error);
      return false;
    }
  }

  /**
   * Crear tablas para el módulo de ajuste de inventario
   */
  static async createInventoryAdjustmentTables() {
    const connection = await db.getConnection();

    try {
      logger.info('📦 Creando tablas de ajuste de inventario...');

      // Tabla principal de ajustes de inventario
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS inventory_adjustments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          consecutive VARCHAR(50) NOT NULL UNIQUE,
          issue_date DATETIME NOT NULL,
          issuer VARCHAR(100) NOT NULL,
          warehouse_id INT NOT NULL,
          concept TEXT NULL,
          total_items INT DEFAULT 0,
          status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
          created_by INT NOT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,

          INDEX idx_inventory_adjustments_consecutive (consecutive),
          INDEX idx_inventory_adjustments_warehouse (warehouse_id),
          INDEX idx_inventory_adjustments_status (status),
          INDEX idx_inventory_adjustments_created_by (created_by),
          INDEX idx_inventory_adjustments_issue_date (issue_date),

          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      logger.info('✅ Tabla inventory_adjustments creada/verificada');

      // Tabla de detalles de ajustes de inventario
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS inventory_adjustment_details (
          id INT AUTO_INCREMENT PRIMARY KEY,
          adjustment_id INT NOT NULL,
          product_id INT NOT NULL,
          warehouse_id INT NOT NULL,
          quantity_before DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'Existencia teórica (stock anterior)',
          quantity_actual DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'Existencia física (cantidad contada)',
          quantity_new DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'Nueva cantidad (igual a quantity_actual)',
          difference DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'Diferencia (quantity_actual - quantity_before)',
          cost_unit DECIMAL(15,2) DEFAULT 0,
          cost_before DECIMAL(15,2) DEFAULT 0,
          cost_actual DECIMAL(15,2) DEFAULT 0,
          cost_new DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          INDEX idx_inventory_adjustment_details_adjustment (adjustment_id),
          INDEX idx_inventory_adjustment_details_product (product_id),
          INDEX idx_inventory_adjustment_details_warehouse (warehouse_id),

          FOREIGN KEY (adjustment_id) REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      logger.info('✅ Tabla inventory_adjustment_details creada/verificada');

      // Asegurar que la tabla stock tenga created_at y updated_at
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'stock'
          AND COLUMN_NAME IN ('created_at', 'updated_at')
      `);

      if (columns.length < 2) {
        logger.info('🔧 Agregando columnas created_at/updated_at a tabla stock...');

        try {
          await connection.execute(`
            ALTER TABLE stock
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          `);
          logger.info('✅ Columnas agregadas a stock');
        } catch (error) {
          // Si ya existen, ignorar el error
          if (!error.message.includes('Duplicate column name')) {
            throw error;
          }
        }
      }

      logger.info('✅ Tablas de ajuste de inventario listas');

    } catch (error) {
      logger.error('❌ Error al crear tablas de ajuste de inventario:', error);
      // No lanzar el error para que la aplicación continúe
    } finally {
      connection.release();
    }
  }

  static async moveMinMaxStockToStockTable() {
    const connection = await db.getConnection();

    try {
      logger.info('📦 Migrando min_stock y max_stock a la tabla stock...');

      // Verificar si las columnas ya existen en stock
      const [stockColumns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'stock'
          AND COLUMN_NAME IN ('min_stock', 'max_stock')
      `);

      if (stockColumns.length === 0) {
        // Agregar columnas min_stock y max_stock a la tabla stock
        logger.info('🔧 Agregando columnas min_stock y max_stock a tabla stock...');
        await connection.execute(`
          ALTER TABLE stock
          ADD COLUMN min_stock DECIMAL(15,3) DEFAULT 0,
          ADD COLUMN max_stock DECIMAL(15,3) DEFAULT 1000
        `);
        logger.info('✅ Columnas agregadas a stock');

        // Migrar datos existentes de products a stock
        logger.info('🔄 Migrando datos de products.min_stock y products.max_stock a stock...');
        await connection.execute(`
          UPDATE stock s
          INNER JOIN products p ON s.product_id = p.id
          SET s.min_stock = COALESCE(p.min_stock, 0),
              s.max_stock = COALESCE(p.max_stock, 1000)
          WHERE p.min_stock IS NOT NULL OR p.max_stock IS NOT NULL
        `);
        logger.info('✅ Datos migrados correctamente');
      } else {
        logger.info('✅ Columnas min_stock y max_stock ya existen en stock');
      }

      // Verificar si las columnas aún existen en products antes de eliminarlas
      const [productColumns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'products'
          AND COLUMN_NAME IN ('min_stock', 'max_stock')
      `);

      if (productColumns.length > 0) {
        logger.info('🔧 Eliminando columnas min_stock y max_stock de tabla products...');

        // Eliminar columnas una por una ya que MySQL no soporta DROP COLUMN IF EXISTS con múltiples columnas
        const columnNames = productColumns.map(col => col.COLUMN_NAME);

        for (const columnName of columnNames) {
          try {
            await connection.execute(`ALTER TABLE products DROP COLUMN ${columnName}`);
            logger.info(`✅ Columna ${columnName} eliminada de products`);
          } catch (error) {
            if (!error.message.includes("check that it exists")) {
              logger.error(`Error eliminando columna ${columnName}:`, error.message);
            }
          }
        }
      } else {
        logger.info('✅ Columnas min_stock y max_stock ya fueron eliminadas de products');
      }

      logger.info('✅ Migración de min_stock y max_stock completada');

    } catch (error) {
      logger.error('❌ Error al migrar min_stock y max_stock:', error);
      // No lanzar el error para que la aplicación continúe
    } finally {
      connection.release();
    }
  }
}

module.exports = DatabaseMigrator;