/**
 * ===================================================================
 * PROSPERPOS - SERVICIO DE REPORTE DE PÉRDIDAS Y GANANCIAS
 * ===================================================================
 *
 * Este servicio calcula ingresos, gastos y utilidades netas para
 * generar el reporte de Pérdidas y Ganancias (Profit & Loss Report)
 */

const db = require('../utils/database');
const logger = require('../utils/logger');

class ProfitLossService {
  /**
   * Obtener reporte de Pérdidas y Ganancias
   * @param {Object} filters - Filtros para el reporte
   * @returns {Object} Datos del reporte estructurados por período
   */
  static async getReport(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        branch_id = null,
        group_by = 'month' // hour, day, week, month, total
      } = filters;

      logger.info(`📊 Generando reporte P&L: ${date_from} a ${date_to}, agrupado por: ${group_by}`);

      // Validar fechas
      if (!date_from || !date_to) {
        throw new Error('Las fechas son requeridas');
      }

      // Generar períodos según el tipo de agrupación
      const periods = this._generatePeriods(date_from, date_to, group_by);

      // Obtener datos para cada período
      const reportData = [];
      for (const periodInfo of periods) {
        const data = await this._getPeriodData(
          periodInfo.start,
          periodInfo.end,
          branch_id,
          periodInfo.hour || null
        );
        reportData.push({
          period: periodInfo.label,
          start_date: periodInfo.start,
          end_date: periodInfo.end,
          ...data
        });
      }

      // Calcular totales generales
      const totals = this._calculateTotals(reportData);

      return {
        periods: reportData,
        totals,
        filters: {
          date_from,
          date_to,
          branch_id
        },
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Error generando reporte P&L:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de un período específico
   * @private
   */
  static async _getPeriodData(dateFrom, dateTo, branchId, hour = null) {
    try {
      // Construir condición de sucursal
      let branchCondition = '';
      const params = [dateFrom, dateTo];

      if (branchId) {
        branchCondition = 'AND i.branch_id = ?';
        params.push(branchId);
      }

      // Construir condición de hora si se especifica
      let hourCondition = '';
      if (hour !== null) {
        hourCondition = `AND HOUR(i.issue_date) = ${hour}`;
      }

      // =========================================
      // INGRESOS (INCOME)
      // =========================================

      // 1. Ventas (Sales) - Facturas pagadas
      const salesResult = await db.execute(`
        SELECT COALESCE(SUM(total), 0) as amount
        FROM invoices i
        WHERE DATE(i.issue_date) BETWEEN ? AND ?
          ${hourCondition}
          AND i.payment_status = 'paid'
          AND i.deleted_at IS NULL
          ${branchCondition}
      `, params);
      const salesIncome = parseFloat(salesResult[0]?.amount || 0);

      // 2. Servicios (Services) - Recargos/Fletes de facturas
      const serviceResult = await db.execute(`
        SELECT COALESCE(SUM(shipping_cost), 0) as amount
        FROM invoices i
        WHERE DATE(i.issue_date) BETWEEN ? AND ?
          ${hourCondition}
          AND i.payment_status = 'paid'
          AND i.deleted_at IS NULL
          ${branchCondition}
      `, params);
      const serviceIncome = parseFloat(serviceResult[0]?.amount || 0);

      // 3. Devoluciones de Compras (Purchase Returns) - Son un ingreso
      let purchaseReturnsBranchCondition = '';
      const purchaseReturnsParams = [dateFrom, dateTo];
      if (branchId) {
        purchaseReturnsBranchCondition = 'AND pr.branch_id = ?';
        purchaseReturnsParams.push(branchId);
      }

      const purchaseReturnsResult = await db.execute(`
        SELECT COALESCE(SUM(total), 0) as amount
        FROM purchase_returns pr
        WHERE DATE(pr.emission_date) BETWEEN ? AND ?
          AND pr.deleted_at IS NULL
          ${purchaseReturnsBranchCondition}
      `, purchaseReturnsParams);
      const purchaseReturnsIncome = parseFloat(purchaseReturnsResult[0]?.amount || 0);

      // Total Ingresos
      const totalIncome = salesIncome + serviceIncome + purchaseReturnsIncome;
      const grossProfit = totalIncome;

      // =========================================
      // GASTOS (EXPENSES)
      // =========================================

      // 1. Costo de Ventas (Sales Cost) - Compras
      let purchasesBranchCondition = '';
      const purchasesParams = [dateFrom, dateTo];
      if (branchId) {
        purchasesBranchCondition = 'AND pd.branch_id = ?';
        purchasesParams.push(branchId);
      }

      const purchasesResult = await db.execute(`
        SELECT COALESCE(SUM(total_amount), 0) as amount
        FROM purchases_documents pd
        WHERE DATE(pd.purchase_date) BETWEEN ? AND ?
          AND pd.status != 'Returned'
          AND pd.deleted_at IS NULL
          ${purchasesBranchCondition}
      `, purchasesParams);
      const purchasesExpense = parseFloat(purchasesResult[0]?.amount || 0);

      // 2. Devoluciones de Ventas (Sales Returns) - Son un gasto
      const salesReturnsResult = await db.execute(`
        SELECT COALESCE(SUM(total), 0) as amount
        FROM invoices i
        WHERE DATE(i.issue_date) BETWEEN ? AND ?
          ${hourCondition}
          AND i.payment_status = 'returned'
          AND i.deleted_at IS NULL
          ${branchCondition}
      `, params);
      const salesReturnsExpense = parseFloat(salesReturnsResult[0]?.amount || 0);

      // Total Gastos
      const totalExpenses = purchasesExpense + salesReturnsExpense;

      // =========================================
      // UTILIDAD NETA (NET PROFIT)
      // =========================================
      const netProfit = grossProfit - totalExpenses;

      return {
        income: {
          sales: salesIncome,
          service: serviceIncome,
          purchase_returns: purchaseReturnsIncome,
          total: totalIncome
        },
        gross_profit: grossProfit,
        expenses: {
          sales_cost: purchasesExpense,
          sales_returns: salesReturnsExpense,
          total: totalExpenses
        },
        net_profit: netProfit
      };

    } catch (error) {
      logger.error('Error obteniendo datos del período:', error);
      throw error;
    }
  }

  /**
   * Generar períodos según el tipo
   * @private
   */
  static _generatePeriods(dateFrom, dateTo, periodType) {
    const periods = [];
    const start = new Date(dateFrom + 'T00:00:00');
    const end = new Date(dateTo + 'T23:59:59');

    switch (periodType) {
      case 'total':
        // Un solo período con todo el rango
        periods.push({
          label: `${this._formatDate(start)} - ${this._formatDate(end)}`,
          start: dateFrom,
          end: dateTo
        });
        break;

      case 'hour':
        // Generar períodos por hora (solo para mismo día)
        if (dateFrom === dateTo) {
          for (let hour = 0; hour < 24; hour++) {
            const hourStart = new Date(start);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(start);
            hourEnd.setHours(hour, 59, 59, 999);

            periods.push({
              label: `${hour.toString().padStart(2, '0')}:00`,
              start: dateFrom,
              end: dateTo,
              hour: hour
            });
          }
        } else {
          // Si es más de un día, agrupar por día
          return this._generatePeriods(dateFrom, dateTo, 'day');
        }
        break;

      case 'day':
      case 'daily':
        // Generar un período por cada día
        let currentDate = new Date(start);
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          periods.push({
            label: this._formatDate(currentDate),
            start: dateStr,
            end: dateStr
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;

      case 'week':
      case 'weekly':
        // Generar períodos semanales
        let weekStart = new Date(start);
        while (weekStart <= end) {
          let weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          if (weekEnd > end) weekEnd = new Date(end);

          periods.push({
            label: `${this._formatDate(weekStart)} - ${this._formatDate(weekEnd)}`,
            start: weekStart.toISOString().split('T')[0],
            end: weekEnd.toISOString().split('T')[0]
          });

          weekStart.setDate(weekStart.getDate() + 7);
        }
        break;

      case 'year':
      case 'yearly':
        // Generar períodos anuales (un período por cada año completo)
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
          // Determinar inicio y fin del año dentro del rango
          const yearStart = new Date(year, 0, 1); // 1 de enero
          const yearEnd = new Date(year, 11, 31, 23, 59, 59); // 31 de diciembre

          // Ajustar si el inicio del año está antes del rango
          const periodStart = yearStart < start ? start : yearStart;
          // Ajustar si el fin del año está después del rango
          const periodEnd = yearEnd > end ? end : yearEnd;

          periods.push({
            label: `${year}`,
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          });
        }
        break;

      case 'month':
      case 'monthly':
      default:
        // Generar períodos mensuales SOLO para los meses dentro del rango
        const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        let current = new Date(startMonth);

        while (current <= endMonth) {
          // Determinar inicio y fin del mes
          const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
          const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

          // Ajustar si el inicio del mes es antes del rango
          const periodStart = monthStart < start ? start : monthStart;
          // Ajustar si el fin del mes es después del rango
          const periodEnd = monthEnd > end ? end : monthEnd;

          periods.push({
            label: this._formatMonth(current),
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          });

          current.setMonth(current.getMonth() + 1);
        }
        break;
    }

    return periods;
  }

  /**
   * Calcular totales generales
   * @private
   */
  static _calculateTotals(reportData) {
    const totals = {
      income: {
        sales: 0,
        service: 0,
        purchase_returns: 0,
        total: 0
      },
      gross_profit: 0,
      expenses: {
        sales_cost: 0,
        sales_returns: 0,
        total: 0
      },
      net_profit: 0
    };

    reportData.forEach(period => {
      totals.income.sales += period.income.sales;
      totals.income.service += period.income.service;
      totals.income.purchase_returns += period.income.purchase_returns;
      totals.income.total += period.income.total;
      totals.gross_profit += period.gross_profit;
      totals.expenses.sales_cost += period.expenses.sales_cost;
      totals.expenses.sales_returns += period.expenses.sales_returns;
      totals.expenses.total += period.expenses.total;
      totals.net_profit += period.net_profit;
    });

    return totals;
  }

  /**
   * Formatear fecha para etiquetas
   * @private
   */
  static _formatDate(date) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  /**
   * Formatear mes para etiquetas
   * @private
   */
  static _formatMonth(date) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

module.exports = ProfitLossService;
