// ===================================================================
// PROSPERPOS - CONTROLADOR DE DASHBOARD
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

/**
 * Obtener estadísticas generales del dashboard
 */
exports.getStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Fechas por defecto: mes actual (desde el día 1 hasta hoy)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateFrom = date_from || firstDayOfMonth.toISOString().split('T')[0];
    const dateTo = date_to || now.toISOString().split('T')[0];

    // Consulta para ventas totales (facturas cobradas)
    const [salesStats] = await db.execute(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(AVG(total), 0) as average_amount
      FROM invoices
      WHERE DATE(issue_date) BETWEEN ? AND ?
        AND payment_status = 'paid'
        AND deleted_at IS NULL
    `, [dateFrom, dateTo]);

    // Consulta para devoluciones de ventas (facturas devueltas)
    const [salesReturnsStats] = await db.execute(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(total), 0) as total_amount
      FROM invoices
      WHERE DATE(issue_date) BETWEEN ? AND ?
        AND payment_status = 'returned'
        AND deleted_at IS NULL
    `, [dateFrom, dateTo]);

    // Consulta para compras totales
    const [purchasesStats] = await db.execute(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM purchases_documents
      WHERE DATE(purchase_date) BETWEEN ? AND ?
        AND status != 'Returned'
        AND deleted_at IS NULL
    `, [dateFrom, dateTo]);

    // Consulta para devoluciones de compras (usando la columna 'total' en lugar de 'total_amount')
    const [purchaseReturnsStats] = await db.execute(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(total), 0) as total_amount
      FROM purchase_returns
      WHERE DATE(emission_date) BETWEEN ? AND ?
        AND deleted_at IS NULL
    `, [dateFrom, dateTo]);

    // Calcular porcentajes de cambio (comparar con período anterior)
    const daysDiff = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24));
    const previousDateFrom = new Date(new Date(dateFrom) - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const previousDateTo = dateFrom;

    // Ventas del período anterior
    const [previousSalesStats] = await db.execute(`
      SELECT COALESCE(SUM(total), 0) as total_amount
      FROM invoices
      WHERE DATE(issue_date) BETWEEN ? AND ?
        AND payment_status = 'paid'
        AND deleted_at IS NULL
    `, [previousDateFrom, previousDateTo]);

    // Calcular porcentaje de cambio
    const previousAmount = previousSalesStats ? parseFloat(previousSalesStats.total_amount || 0) : 0;
    const currentAmount = salesStats ? parseFloat(salesStats.total_amount || 0) : 0;
    const salesChange = previousAmount > 0
      ? ((currentAmount - previousAmount) / previousAmount * 100).toFixed(1)
      : 0;

    return sendSuccessResponse(res, {
      sales: {
        total_count: salesStats ? salesStats.total_count : 0,
        total_amount: salesStats ? parseFloat(salesStats.total_amount) : 0,
        average_amount: salesStats ? parseFloat(salesStats.average_amount) : 0,
        change_percentage: parseFloat(salesChange)
      },
      sales_returns: {
        total_count: salesReturnsStats ? salesReturnsStats.total_count : 0,
        total_amount: salesReturnsStats ? parseFloat(salesReturnsStats.total_amount) : 0
      },
      purchases: {
        total_count: purchasesStats ? purchasesStats.total_count : 0,
        total_amount: purchasesStats ? parseFloat(purchasesStats.total_amount) : 0
      },
      purchase_returns: {
        total_count: purchaseReturnsStats ? purchaseReturnsStats.total_count : 0,
        total_amount: purchaseReturnsStats ? parseFloat(purchaseReturnsStats.total_amount) : 0
      },
      date_range: {
        from: dateFrom,
        to: dateTo
      }
    });

  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    return sendErrorResponse(res, 500, 'Error al obtener estadísticas del dashboard');
  }
};

/**
 * Obtener datos para el gráfico de ventas y compras
 */
exports.getSalesAndPurchasesChart = async (req, res) => {
  try {
    const { period = '1M', date_from, date_to } = req.query;

    let dateFrom, dateTo, groupBy;

    // Determinar el rango de fechas y agrupación según el período
    switch(period) {
      case '1D': // 1 día - agrupar por hora (últimas 24 horas de hoy)
        const today = new Date();
        dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString().split('T')[0];
        groupBy = 'HOUR';
        break;
      case '1S': // 1 semana - agrupar por día
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        groupBy = 'DAY';
        break;
      case '1M': // 1 mes - agrupar por día
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        groupBy = 'DAY';
        break;
      case '3M': // 3 meses - agrupar por mes
        dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        groupBy = 'MONTH';
        break;
      case '6M': // 6 meses - agrupar por mes
        dateFrom = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        groupBy = 'MONTH';
        break;
      case '1A': // 1 año - agrupar por mes
      default:
        dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        groupBy = 'MONTH';
        break;
    }

    // Usar fechas personalizadas si se proporcionan (no cambiar el groupBy)
    if (date_from) dateFrom = date_from;
    if (date_to) dateTo = date_to;

    logger.info(`📅 Period: ${period}, GroupBy: ${groupBy}`);
    logger.info(`📅 Date range: ${dateFrom} to ${dateTo}`);

    let salesQuery, purchasesQuery;

    // Construir query según la agrupación
    if (groupBy === 'HOUR') {
      salesQuery = `
        SELECT
          HOUR(issue_date) as hour,
          DATE(issue_date) as date,
          COUNT(*) as count,
          COALESCE(SUM(total), 0) as amount
        FROM invoices
        WHERE DATE(issue_date) BETWEEN ? AND ?
          AND payment_status = 'paid'
          AND deleted_at IS NULL
        GROUP BY DATE(issue_date), HOUR(issue_date)
        ORDER BY date ASC, hour ASC
      `;

      purchasesQuery = `
        SELECT
          HOUR(purchase_date) as hour,
          DATE(purchase_date) as date,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as amount
        FROM purchases_documents
        WHERE DATE(purchase_date) BETWEEN ? AND ?
          AND status != 'Returned'
          AND deleted_at IS NULL
        GROUP BY DATE(purchase_date), HOUR(purchase_date)
        ORDER BY date ASC, hour ASC
      `;
    } else if (groupBy === 'DAY') {
      salesQuery = `
        SELECT
          DATE(issue_date) as date,
          COUNT(*) as count,
          COALESCE(SUM(total), 0) as amount
        FROM invoices
        WHERE DATE(issue_date) BETWEEN ? AND ?
          AND payment_status = 'paid'
          AND deleted_at IS NULL
        GROUP BY DATE(issue_date)
        ORDER BY date ASC
      `;

      purchasesQuery = `
        SELECT
          DATE(purchase_date) as date,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as amount
        FROM purchases_documents
        WHERE DATE(purchase_date) BETWEEN ? AND ?
          AND status != 'Returned'
          AND deleted_at IS NULL
        GROUP BY DATE(purchase_date)
        ORDER BY date ASC
      `;
    } else { // MONTH
      salesQuery = `
        SELECT
          YEAR(issue_date) as year,
          MONTH(issue_date) as month,
          COUNT(*) as count,
          COALESCE(SUM(total), 0) as amount
        FROM invoices
        WHERE DATE(issue_date) BETWEEN ? AND ?
          AND payment_status = 'paid'
          AND deleted_at IS NULL
        GROUP BY YEAR(issue_date), MONTH(issue_date)
        ORDER BY YEAR(issue_date) ASC, MONTH(issue_date) ASC
      `;

      purchasesQuery = `
        SELECT
          YEAR(purchase_date) as year,
          MONTH(purchase_date) as month,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as amount
        FROM purchases_documents
        WHERE DATE(purchase_date) BETWEEN ? AND ?
          AND status != 'Returned'
          AND deleted_at IS NULL
        GROUP BY YEAR(purchase_date), MONTH(purchase_date)
        ORDER BY YEAR(purchase_date) ASC, MONTH(purchase_date) ASC
      `;
    }

    // Ejecutar queries - db.execute() ya retorna solo las filas (sin destructurar)
    let salesData = [];
    let purchasesData = [];

    try {
      salesData = await db.execute(salesQuery, [dateFrom, dateTo]) || [];
      logger.info('✅ Sales query executed successfully, rows:', salesData.length);
    } catch (error) {
      logger.error('❌ Error in sales query:', error.message);
      logger.error('Query:', salesQuery);
      logger.error('Params:', [dateFrom, dateTo]);
    }

    try {
      purchasesData = await db.execute(purchasesQuery, [dateFrom, dateTo]) || [];
      logger.info('✅ Purchases query executed successfully, rows:', purchasesData.length);
    } catch (error) {
      logger.error('❌ Error in purchases query:', error.message);
      logger.error('Query:', purchasesQuery);
      logger.error('Params:', [dateFrom, dateTo]);
    }

    return sendSuccessResponse(res, {
      sales: salesData,
      purchases: purchasesData,
      period,
      groupBy,
      date_range: {
        from: dateFrom,
        to: dateTo
      }
    });

  } catch (error) {
    logger.error('Error getting sales and purchases chart data:', error);
    return sendErrorResponse(res, 500, 'Error al obtener datos del gráfico');
  }
};

/**
 * Obtener información general (proveedores, clientes, pedidos)
 */
exports.getOverallInfo = async (req, res) => {
  try {
    // Contar proveedores activos
    const [suppliersCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM suppliers
      WHERE is_active = 1
        AND deleted_at IS NULL
    `);

    // Contar clientes activos
    const [customersCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE is_active = 1
    `);

    // Contar ventas (facturas emitidas)
    const [salesCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM invoices
      WHERE deleted_at IS NULL
    `);

    return sendSuccessResponse(res, {
      suppliers: suppliersCount.count || 0,
      customers: customersCount.count || 0,
      sales: salesCount.count || 0
    });

  } catch (error) {
    logger.error('Error getting overall info:', error);
    return sendErrorResponse(res, 500, 'Error al obtener información general');
  }
};

/**
 * Obtener productos más vendidos
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 5, period = 'today' } = req.query;
    const limitNum = parseInt(limit) || 5;

    let dateCondition = 'DATE(i.issue_date) = CURDATE()';

    if (period === 'week') {
      dateCondition = 'i.issue_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateCondition = 'i.issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const products = await db.execute(`
      SELECT
        p.id,
        p.name,
        p.code,
        p.image,
        p.price_1 as price,
        SUM(ii.quantity) as total_sold,
        COUNT(DISTINCT i.id) as sales_count,
        SUM(ii.line_total) as total_revenue
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      INNER JOIN products p ON ii.product_id = p.id
      WHERE ${dateCondition}
        AND i.payment_status = 'paid'
        AND i.deleted_at IS NULL
      GROUP BY p.id, p.name, p.code, p.image, p.price_1
      ORDER BY total_sold DESC
      LIMIT ${limitNum}
    `);

    return sendSuccessResponse(res, products);

  } catch (error) {
    logger.error('Error getting top selling products:', error);
    return sendErrorResponse(res, 500, 'Error al obtener productos más vendidos');
  }
};

/**
 * Obtener productos con bajo stock
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit);

    const [products] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.code,
        p.stock as current_stock,
        10 as minimum_stock
      FROM products p
      WHERE p.stock <= 10 AND p.stock > 0
      ORDER BY p.stock ASC
      LIMIT ${limitNum}
    `);

    return sendSuccessResponse(res, products);

  } catch (error) {
    logger.error('Error getting low stock products:', error);
    return sendErrorResponse(res, 500, 'Error al obtener productos con bajo stock');
  }
};

/**
 * Obtener ventas recientes
 */
exports.getRecentSales = async (req, res) => {
  try {
    const { limit = 5, period = 'week' } = req.query;
    const limitNum = parseInt(limit);

    let dateCondition = 'i.issue_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';

    if (period === 'today') {
      dateCondition = 'DATE(i.issue_date) = CURDATE()';
    } else if (period === 'month') {
      dateCondition = 'i.issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const [sales] = await db.query(`
      SELECT
        i.id,
        i.invoice_number,
        i.total,
        i.payment_status as status,
        i.issue_date as created_at,
        c.nombre as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE ${dateCondition}
        AND i.deleted_at IS NULL
      ORDER BY i.issue_date DESC
      LIMIT ${limitNum}
    `);

    return sendSuccessResponse(res, sales);

  } catch (error) {
    logger.error('Error getting recent sales:', error);
    return sendErrorResponse(res, 500, 'Error al obtener ventas recientes');
  }
};

/**
 * Obtener mejores clientes
 */
exports.getTopCustomers = async (req, res) => {
  try {
    const { limit = 5, date_from, date_to } = req.query;
    const limitNum = parseInt(limit) || 5;

    // Fechas por defecto: mes actual (desde el día 1 hasta hoy)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateFrom = date_from || firstDayOfMonth.toISOString().split('T')[0];
    const dateTo = date_to || now.toISOString().split('T')[0];

    // db.execute() ya devuelve el array de resultados directamente (no desestructurar)
    const customers = await db.execute(`
      SELECT
        c.id,
        c.nombre as name,
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(i.total), 0) as total_spent
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.deleted_at IS NULL
        AND i.payment_status = 'paid'
        AND c.is_active = 1
        AND i.issue_date >= ?
        AND i.issue_date <= ?
      GROUP BY c.id, c.nombre
      HAVING total_invoices > 0
      ORDER BY total_spent DESC
      LIMIT ${limitNum}
    `, [dateFrom + ' 00:00:00', dateTo + ' 23:59:59']);

    logger.info(`✅ Top customers query returned ${customers.length} customers`);

    return sendSuccessResponse(res, customers);

  } catch (error) {
    logger.error('Error getting top customers:', error);
    return sendErrorResponse(res, 500, 'Error al obtener mejores clientes');
  }
};

/**
 * Obtener resumen de clientes (primera vez vs recurrentes)
 */
exports.getCustomersOverview = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    // Calcular fechas usando JavaScript para mayor claridad
    const now = new Date();
    let daysBack = 7; // Default semanal

    if (period === 'today') {
      daysBack = 1;
    } else if (period === 'month') {
      daysBack = 30;
    }

    // Período actual
    const currentStartDate = new Date(now);
    currentStartDate.setDate(currentStartDate.getDate() - daysBack);
    const currentStartStr = currentStartDate.toISOString().split('T')[0] + ' 00:00:00';
    const currentEndStr = now.toISOString().split('T')[0] + ' 23:59:59';

    // Período anterior (para comparación)
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysBack);
    const previousStartStr = previousStartDate.toISOString().split('T')[0] + ' 00:00:00';
    const previousEndStr = previousEndDate.toISOString().split('T')[0] + ' 23:59:59';

    logger.info(`📊 Resumen de Clientes - Período: ${period} (${daysBack} días)`);
    logger.info(`📊 Actual: ${currentStartStr} a ${currentEndStr}`);
    logger.info(`📊 Anterior: ${previousStartStr} a ${previousEndStr}`);

    // Obtener clientes del período actual con conteo de facturas EN el período
    const currentCustomers = await db.execute(`
      SELECT
        c.id,
        c.nombre,
        COUNT(DISTINCT i.id) as invoices_in_period
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.issue_date >= ?
        AND i.issue_date <= ?
        AND i.deleted_at IS NULL
        AND i.payment_status = 'paid'
      GROUP BY c.id, c.nombre
    `, [currentStartStr, currentEndStr]);

    logger.info(`📊 Clientes en período actual: ${currentCustomers.length}`);

    // Clasificar clientes en primera vez vs recurrentes
    // Primera vez: cliente que compró SOLO 1 VEZ en el período
    // Recurrente: cliente que compró 2 O MÁS VECES en el período
    let firstTime = 0;
    let returning = 0;

    for (const customer of currentCustomers) {
      const purchasesInPeriod = parseInt(customer.invoices_in_period) || 0;

      if (purchasesInPeriod > 1) {
        returning++;
        logger.debug(`  Recurrente: ${customer.nombre} (${purchasesInPeriod} facturas)`);
      } else {
        firstTime++;
        logger.debug(`  Primera vez: ${customer.nombre} (${purchasesInPeriod} factura)`);
      }
    }

    logger.info(`📊 Primera vez: ${firstTime}, Recurrentes: ${returning}`);

    // Calcular porcentajes (comparado con período anterior)
    const previousCustomers = await db.execute(`
      SELECT
        c.id,
        COUNT(DISTINCT i.id) as invoices_in_period
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.issue_date >= ?
        AND i.issue_date <= ?
        AND i.deleted_at IS NULL
        AND i.payment_status = 'paid'
      GROUP BY c.id
    `, [previousStartStr, previousEndStr]);

    logger.info(`📊 Clientes en período anterior: ${previousCustomers.length}`);

    let previousFirstTime = 0;
    let previousReturning = 0;

    for (const customer of previousCustomers) {
      const purchasesInPeriod = parseInt(customer.invoices_in_period) || 0;

      if (purchasesInPeriod > 1) {
        previousReturning++;
      } else {
        previousFirstTime++;
      }
    }

    logger.info(`📊 Anterior - Primera vez: ${previousFirstTime}, Recurrentes: ${previousReturning}`);

    // Calcular cambio porcentual
    const firstTimePercentage = previousFirstTime > 0
      ? Math.round(((firstTime - previousFirstTime) / previousFirstTime) * 100)
      : (firstTime > 0 ? 100 : 0);

    const returningPercentage = previousReturning > 0
      ? Math.round(((returning - previousReturning) / previousReturning) * 100)
      : (returning > 0 ? 100 : 0);

    // Calcular porcentaje del total para los gráficos
    const total = firstTime + returning;
    const firstTimeChartPercentage = total > 0 ? Math.round((firstTime / total) * 100) : 0;
    const returningChartPercentage = total > 0 ? Math.round((returning / total) * 100) : 0;

    return sendSuccessResponse(res, {
      first_time: firstTime,
      returning: returning,
      first_time_percentage: firstTimePercentage,
      returning_percentage: returningPercentage,
      first_time_chart_percentage: firstTimeChartPercentage,
      returning_chart_percentage: returningChartPercentage
    });

  } catch (error) {
    logger.error('Error getting customers overview:', error);
    return sendErrorResponse(res, 500, 'Error al obtener resumen de clientes');
  }
};

/**
 * Obtener estadísticas por categoría
 */
exports.getCategoryStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let dateCondition = 's.sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';

    if (period === 'today') {
      dateCondition = 'DATE(s.sale_date) = CURDATE()';
    } else if (period === 'month') {
      dateCondition = 's.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const [categories] = await db.execute(`
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT si.id) as sales_count,
        SUM(si.quantity) as total_quantity,
        COALESCE(SUM(si.total), 0) as total_revenue
      FROM categories c
      INNER JOIN products p ON c.id = p.category_id
      INNER JOIN sales_items si ON p.id = si.product_id
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE ${dateCondition}
        AND s.status = 'completed'
      GROUP BY c.id
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    // Contar categorías totales
    const [categoryCount] = await db.execute(`
      SELECT COUNT(*) as total FROM categories
    `);

    // Contar productos totales
    const [productCount] = await db.execute(`
      SELECT COUNT(*) as total FROM products
    `);

    return sendSuccessResponse(res, {
      categories,
      total_categories: categoryCount[0].total,
      total_products: productCount[0].total
    });

  } catch (error) {
    logger.error('Error getting category stats:', error);
    return sendErrorResponse(res, 'Error al obtener estadísticas por categoría', 500);
  }
};

/**
 * Obtener transacciones recientes
 */
exports.getRecentTransactions = async (req, res) => {
  try {
    const { type = 'sales', limit = 5 } = req.query;

    let query, params = [parseInt(limit)];

    switch(type) {
      case 'sales':
        query = `
          SELECT
            s.id,
            s.sale_number as reference,
            s.sale_date as date,
            s.total,
            s.status,
            c.nombre as customer_name
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
          ORDER BY s.sale_date DESC
          LIMIT ?
        `;
        break;

      case 'purchases':
        query = `
          SELECT
            p.id,
            p.purchase_number as reference,
            p.purchase_date as date,
            p.total_amount as total,
            p.status,
            p.supplier_name
          FROM purchases_documents p
          ORDER BY p.purchase_date DESC
          LIMIT ?
        `;
        break;

      default:
        query = `
          SELECT
            s.id,
            s.sale_number as reference,
            s.sale_date as date,
            s.total,
            s.status,
            c.nombre as customer_name
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
          ORDER BY s.sale_date DESC
          LIMIT ?
        `;
    }

    const [transactions] = await db.execute(query, params);

    return sendSuccessResponse(res, transactions);

  } catch (error) {
    logger.error('Error getting recent transactions:', error);
    return sendErrorResponse(res, 'Error al obtener transacciones recientes', 500);
  }
};

/**
 * Obtener categorías más vendidas
 */
exports.getTopCategories = async (req, res) => {
  try {
    const { limit = 5, period = 'week' } = req.query;
    const limitNum = parseInt(limit) || 5;

    let dateCondition = 'DATE(i.issue_date) = CURDATE()';

    if (period === 'week') {
      dateCondition = 'i.issue_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateCondition = 'i.issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    logger.info(`📊 Getting top categories with period: ${period}, limit: ${limitNum}`);

    const categories = await db.execute(`
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT ii.product_id) as products_count,
        SUM(ii.quantity) as total_sold,
        SUM(ii.line_total) as total_revenue
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      INNER JOIN products p ON ii.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE ${dateCondition}
        AND i.payment_status = 'paid'
        AND i.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
      LIMIT ${limitNum}
    `);

    logger.info(`✅ Top categories query returned ${categories.length} categories`);

    return sendSuccessResponse(res, categories);

  } catch (error) {
    logger.error('Error getting top categories:', error);
    return sendErrorResponse(res, 'Error al obtener categorías más vendidas', 500);
  }
};
