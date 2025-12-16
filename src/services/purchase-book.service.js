// ===================================================================
// PROSPERPOS - SERVICIO DE LIBRO DE COMPRAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class PurchaseBookService {
  /**
   * Obtener reporte del libro de compras con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos del libro de compras
   */
  static async getPurchaseBook(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        supplier_id,
        payment_status,
        show_only_returns = false
      } = filters;

      let whereConditions = ['p.deleted_at IS NULL'];
      const params = [];

      // Filtro de fechas
      if (date_from) {
        whereConditions.push('DATE(p.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(p.purchase_date) <= ?');
        params.push(date_to);
      }

      // Filtro de proveedor
      if (supplier_id) {
        whereConditions.push('p.supplier_name = ?');
        params.push(supplier_id);
      }

      // Filtro de estado de pago (solo Completed y Returned permitidos)
      if (payment_status && payment_status.length > 0) {
        if (Array.isArray(payment_status)) {
          // Filtrar solo estados válidos
          const validStatuses = payment_status.filter(status =>
            ['Completed', 'Returned'].includes(status)
          );
          if (validStatuses.length > 0) {
            const placeholders = validStatuses.map(() => '?').join(',');
            whereConditions.push(`p.status IN (${placeholders})`);
            params.push(...validStatuses);
          }
        } else if (['Completed', 'Returned'].includes(payment_status)) {
          whereConditions.push('p.status = ?');
          params.push(payment_status);
        }
      }

      // Filtro de solo devoluciones
      if (show_only_returns === true || show_only_returns === 'true') {
        whereConditions.push('p.status = ?');
        params.push('Returned');
      }

      const whereClause = whereConditions.join(' AND ');

      // Query para obtener compras y devoluciones como filas separadas
      const query = `
        SELECT
          p.id,
          DATE_FORMAT(p.purchase_date, '%d/%m/%Y %H:%i:%S') as fecha,
          p.purchase_date as fecha_raw,
          COALESCE(p.purchase_number, CONCAT('COMP-', LPAD(p.id, 6, '0'))) as numero_factura,
          COALESCE(p.supplier_name, 'N/A') as proveedor,
          COALESCE(p.supplier_id_number, '') as rtn_proveedor,
          COALESCE(p.net_amount, 0) as subtotal,
          COALESCE(p.discount_amount, 0) as descuento,
          COALESCE(p.surcharge_amount, 0) as recargo,
          COALESCE(p.tax_amount, 0) as isv,
          COALESCE(p.total_amount, 0) as total,
          CASE
            WHEN p.status = 'Returned' THEN 'DEVUELTO'
            WHEN p.status = 'Completed' THEN 'COMPLETADO'
            ELSE UPPER(p.status)
          END as estatus,
          p.status as estatus_raw,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as usuario,
          'COMPRA' as tipo_fila

        FROM purchases_documents p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE ${whereClause}

        UNION ALL

        SELECT
          CONCAT('DEV-', pr.id) as id,
          DATE_FORMAT(pr.emission_date, '%d/%m/%Y %H:%i:%S') as fecha,
          pr.emission_date as fecha_raw,
          CONCAT('DEVOLUCION-', LPAD(pr.id, 6, '0')) as numero_factura,
          COALESCE(p.supplier_name, 'N/A') as proveedor,
          COALESCE(p.supplier_id_number, '') as rtn_proveedor,
          -COALESCE(pr.subtotal, 0) as subtotal,
          -COALESCE(pr.discount, 0) as descuento,
          0 as recargo,
          -COALESCE(pr.tax, 0) as isv,
          -COALESCE(pr.total, 0) as total,
          CONCAT('NC-', COALESCE(pr.credit_note_number, LPAD(pr.id, 6, '0')), ' - FAC: ', COALESCE(p.purchase_number, CONCAT('COMP-', LPAD(p.id, 6, '0')))) as estatus,
          'Returned' as estatus_raw,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as usuario,
          'DEVOLUCION' as tipo_fila

        FROM purchase_returns pr
        LEFT JOIN purchases_documents p ON pr.purchase_id = p.id
        LEFT JOIN users u ON pr.created_by = u.id
        WHERE pr.deleted_at IS NULL
        AND DATE(pr.emission_date) >= ?
        AND DATE(pr.emission_date) <= ?

        ORDER BY fecha_raw DESC
      `;

      // Agregar parámetros para la segunda parte del UNION (devoluciones)
      const allParams = [...params, date_from || '1900-01-01', date_to || '2100-12-31'];

      const purchases = await db.execute(query, allParams);

      // Calcular totales generales separando compras de devoluciones
      const totals = {
        total_registros: purchases.length,
        total_compras: 0,
        total_devoluciones: 0,
        subtotal_total: 0,
        descuento_total: 0,
        recargo_total: 0,
        isv_total: 0,
        total_total: 0,
        total_devuelto: 0
      };

      purchases.forEach(purchase => {
        // Contar compras vs devoluciones
        if (purchase.tipo_fila === 'COMPRA') {
          totals.total_compras += 1;
        } else if (purchase.tipo_fila === 'DEVOLUCION') {
          totals.total_devoluciones += 1;
          // Total devuelto es el valor absoluto del total de devoluciones
          totals.total_devuelto += Math.abs(parseFloat(purchase.total || 0));
        }

        totals.subtotal_total += parseFloat(purchase.subtotal || 0);
        totals.descuento_total += parseFloat(purchase.descuento || 0);
        totals.recargo_total += parseFloat(purchase.recargo || 0);
        totals.isv_total += parseFloat(purchase.isv || 0);
        totals.total_total += parseFloat(purchase.total || 0);
      });

      // Redondear totales a 2 decimales
      Object.keys(totals).forEach(key => {
        if (!['total_registros', 'total_compras', 'total_devoluciones'].includes(key)) {
          totals[key] = parseFloat(totals[key].toFixed(2));
        }
      });

      return {
        purchases,
        totals,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          supplier_id: supplier_id || null,
          payment_status: payment_status || null,
          show_only_returns: show_only_returns || false
        }
      };
    } catch (error) {
      logger.error('Error in PurchaseBookService.getPurchaseBook:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen agrupado del libro de compras
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} groupBy - Campo por el cual agrupar (day, week, month, warehouse, supplier)
   * @returns {Promise<Object>} Resumen agrupado
   */
  static async getPurchaseBookSummary(filters = {}, groupBy = 'day') {
    try {
      const {
        date_from,
        date_to,
        supplier_id,
        payment_status
      } = filters;

      let whereConditions = ['p.deleted_at IS NULL'];
      const params = [];

      // Filtro de fechas
      if (date_from) {
        whereConditions.push('DATE(p.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(p.purchase_date) <= ?');
        params.push(date_to);
      }

      // Filtro de proveedor
      if (supplier_id) {
        whereConditions.push('p.supplier_name = ?');
        params.push(supplier_id);
      }

      // Filtro de estado de pago
      if (payment_status && payment_status.length > 0) {
        if (Array.isArray(payment_status)) {
          const placeholders = payment_status.map(() => '?').join(',');
          whereConditions.push(`p.payment_status IN (${placeholders})`);
          params.push(...payment_status);
        } else {
          whereConditions.push('p.payment_status = ?');
          params.push(payment_status);
        }
      }

      const whereClause = whereConditions.join(' AND ');

      let groupByClause, selectClause;

      switch (groupBy) {
        case 'day':
          selectClause = `DATE(p.purchase_date) as group_key, DATE_FORMAT(p.purchase_date, '%d/%m/%Y') as group_label`;
          groupByClause = 'DATE(p.purchase_date)';
          break;
        case 'week':
          selectClause = `YEARWEEK(p.purchase_date) as group_key, CONCAT('Semana ', WEEK(p.purchase_date), ' - ', YEAR(p.purchase_date)) as group_label`;
          groupByClause = 'YEARWEEK(p.purchase_date)';
          break;
        case 'month':
          selectClause = `DATE_FORMAT(p.purchase_date, '%Y-%m') as group_key, DATE_FORMAT(p.purchase_date, '%M %Y') as group_label`;
          groupByClause = 'DATE_FORMAT(p.purchase_date, \'%Y-%m\')';
          break;
        case 'supplier':
          selectClause = `p.supplier_name as group_key, p.supplier_name as group_label`;
          groupByClause = 'p.supplier_name';
          break;
        default:
          selectClause = `DATE(p.purchase_date) as group_key, DATE_FORMAT(p.purchase_date, '%d/%m/%Y') as group_label`;
          groupByClause = 'DATE(p.purchase_date)';
      }

      const query = `
        SELECT
          ${selectClause},
          COUNT(*) as total_compras,
          COALESCE(SUM(p.net_amount), 0) as subtotal_total,
          COALESCE(SUM(p.tax_amount), 0) as isv_total,
          COALESCE(SUM(p.total_amount), 0) as total_total
        FROM purchases_documents p
        WHERE ${whereClause}
        GROUP BY ${groupByClause}
        ORDER BY group_key DESC
      `;

      const summary = await db.execute(query, params);

      // Calcular gran total
      const grandTotal = {
        total_compras: 0,
        subtotal_total: 0,
        isv_total: 0,
        total_total: 0
      };

      summary.forEach(row => {
        grandTotal.total_compras += parseInt(row.total_compras || 0);
        grandTotal.subtotal_total += parseFloat(row.subtotal_total || 0);
        grandTotal.isv_total += parseFloat(row.isv_total || 0);
        grandTotal.total_total += parseFloat(row.total_total || 0);
      });

      // Redondear totales
      grandTotal.subtotal_total = parseFloat(grandTotal.subtotal_total.toFixed(2));
      grandTotal.isv_total = parseFloat(grandTotal.isv_total.toFixed(2));
      grandTotal.total_total = parseFloat(grandTotal.total_total.toFixed(2));

      return {
        summary,
        grandTotal,
        groupBy
      };
    } catch (error) {
      logger.error('Error in PurchaseBookService.getPurchaseBookSummary:', error);
      throw error;
    }
  }

  /**
   * Exportar libro de compras a formato Excel/CSV
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos formateados para exportación
   */
  static async exportPurchaseBook(filters = {}) {
    try {
      const { purchases, totals } = await this.getPurchaseBook(filters);

      // Formatear datos para exportación
      const exportData = purchases.map(purchase => ({
        'Fecha': purchase.fecha,
        'Número Factura': purchase.numero_factura,
        'Proveedor': purchase.proveedor,
        'RTN': purchase.rtn_proveedor,
        'Subtotal': purchase.subtotal,
        'Descuento': purchase.descuento,
        'Recargo': purchase.recargo,
        'ISV': purchase.isv,
        'Total': purchase.total,
        'Estatus': purchase.estatus,
        'Usuario': purchase.usuario
      }));

      return {
        data: exportData,
        totals,
        filename: `libro_compras_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      logger.error('Error in PurchaseBookService.exportPurchaseBook:', error);
      throw error;
    }
  }

  /**
   * Exportar libro de compras a PDF
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} res - Response object de Express
   */
  static async exportPurchaseBookPDF(filters = {}, res) {
    try {
      const { purchases, totals } = await this.getPurchaseBook(filters);

      // Importar PDFKit
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({
        margin: 30,
        size: 'LETTER',
        layout: 'landscape'
      });

      // Obtener información de la compañía
      const [companyInfo] = await db.execute('SELECT * FROM company_info LIMIT 1');
      const company = companyInfo[0] || {};

      // Configurar headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=libro-compras-${filters.date_from || 'inicio'}-${filters.date_to || 'fin'}.pdf`
      );

      doc.pipe(res);

      // Función auxiliar para formatear moneda
      const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        return `L ${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
      };

      // Función auxiliar para formatear fecha
      const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return dateStr.split(' ')[0]; // Solo la parte de la fecha
      };

      // Colores similares al libro de ventas
      const primaryColor = '#4472C4';
      const headerBg = '#4472C4';
      const rowEvenBg = '#F2F2F2';

      // ENCABEZADO
      doc.fontSize(16).font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(company.business_description || company.description || 'ProsperPOS', { align: 'center' });

      doc.fontSize(10).font('Helvetica')
        .fillColor('black')
        .text(`RTN: ${company.rtn || 'N/A'} | Tel: ${company.telefono || 'N/A'}`, { align: 'center' });

      doc.moveDown(0.5);

      doc.fontSize(14).font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('LIBRO DE COMPRAS', { align: 'center' });

      doc.fontSize(10).font('Helvetica')
        .fillColor('black')
        .text(`Período: ${filters.date_from || 'Inicio'} a ${filters.date_to || 'Fin'}`, { align: 'center' });

      doc.moveDown(1);

      // TABLA DE COMPRAS
      const tableTop = doc.y;
      const colWidths = {
        fecha: 55,
        numero: 75,
        proveedor: 110,
        rtn: 75,
        subtotal: 50,
        descuento: 50,
        recargo: 50,
        isv: 50,
        total: 55,
        estatus: 80
      };

      let xPos = 30;

      // Encabezados de tabla con fondo azul
      doc.rect(xPos, tableTop, 720, 20).fillColor(headerBg).fill();

      doc.fontSize(8).font('Helvetica-Bold').fillColor('white');

      doc.text('FECHA', xPos + 2, tableTop + 5, { width: colWidths.fecha, align: 'center' });
      xPos += colWidths.fecha;

      doc.text('NÚMERO', xPos + 2, tableTop + 5, { width: colWidths.numero, align: 'center' });
      xPos += colWidths.numero;

      doc.text('PROVEEDOR', xPos + 2, tableTop + 5, { width: colWidths.proveedor, align: 'center' });
      xPos += colWidths.proveedor;

      doc.text('RTN', xPos + 2, tableTop + 5, { width: colWidths.rtn, align: 'center' });
      xPos += colWidths.rtn;

      doc.text('SUBTOTAL', xPos + 2, tableTop + 5, { width: colWidths.subtotal, align: 'center' });
      xPos += colWidths.subtotal;

      doc.text('DESCUENTO', xPos + 2, tableTop + 5, { width: colWidths.descuento, align: 'center' });
      xPos += colWidths.descuento;

      doc.text('RECARGO', xPos + 2, tableTop + 5, { width: colWidths.recargo, align: 'center' });
      xPos += colWidths.recargo;

      doc.text('ISV', xPos + 2, tableTop + 5, { width: colWidths.isv, align: 'center' });
      xPos += colWidths.isv;

      doc.text('TOTAL', xPos + 2, tableTop + 5, { width: colWidths.total, align: 'center' });
      xPos += colWidths.total;

      doc.text('ESTATUS', xPos + 2, tableTop + 5, { width: colWidths.estatus, align: 'center' });

      // Datos de la tabla
      let yPos = tableTop + 22;
      doc.font('Helvetica').fontSize(7);

      purchases.forEach((purchase, index) => {
        // Verificar si necesitamos nueva página
        if (yPos > 520) {
          doc.addPage({ margin: 30, size: 'LETTER', layout: 'landscape' });
          yPos = 30;

          // Re-dibujar encabezados
          xPos = 30;
          doc.rect(xPos, yPos, 720, 20).fillColor(headerBg).fill();
          doc.fontSize(8).font('Helvetica-Bold').fillColor('white');

          doc.text('FECHA', xPos + 2, yPos + 5, { width: colWidths.fecha, align: 'center' });
          xPos += colWidths.fecha;
          doc.text('NÚMERO', xPos + 2, yPos + 5, { width: colWidths.numero, align: 'center' });
          xPos += colWidths.numero;
          doc.text('PROVEEDOR', xPos + 2, yPos + 5, { width: colWidths.proveedor, align: 'center' });
          xPos += colWidths.proveedor;
          doc.text('RTN', xPos + 2, yPos + 5, { width: colWidths.rtn, align: 'center' });
          xPos += colWidths.rtn;
          doc.text('SUBTOTAL', xPos + 2, yPos + 5, { width: colWidths.subtotal, align: 'center' });
          xPos += colWidths.subtotal;
          doc.text('DESCUENTO', xPos + 2, yPos + 5, { width: colWidths.descuento, align: 'center' });
          xPos += colWidths.descuento;
          doc.text('RECARGO', xPos + 2, yPos + 5, { width: colWidths.recargo, align: 'center' });
          xPos += colWidths.recargo;
          doc.text('ISV', xPos + 2, yPos + 5, { width: colWidths.isv, align: 'center' });
          xPos += colWidths.isv;
          doc.text('TOTAL', xPos + 2, yPos + 5, { width: colWidths.total, align: 'center' });
          xPos += colWidths.total;
          doc.text('ESTATUS', xPos + 2, yPos + 5, { width: colWidths.estatus, align: 'center' });

          yPos += 22;
          doc.font('Helvetica').fontSize(7);
        }

        // Fondo alternado para filas
        if (index % 2 === 0) {
          doc.rect(30, yPos - 2, 720, 14).fillColor(rowEvenBg).fill();
        }

        // Color especial para devoluciones
        if (purchase.tipo_fila === 'DEVOLUCION') {
          doc.fillColor('#DC143C'); // Rojo para devoluciones
        } else {
          doc.fillColor('black');
        }

        xPos = 30;

        doc.text(formatDate(purchase.fecha), xPos + 2, yPos, { width: colWidths.fecha, align: 'center' });
        xPos += colWidths.fecha;

        doc.text(purchase.numero_factura || 'N/A', xPos + 2, yPos, { width: colWidths.numero, align: 'left' });
        xPos += colWidths.numero;

        doc.text(purchase.proveedor || 'N/A', xPos + 2, yPos, { width: colWidths.proveedor, align: 'left' });
        xPos += colWidths.proveedor;

        doc.text(purchase.rtn_proveedor || '', xPos + 2, yPos, { width: colWidths.rtn, align: 'center' });
        xPos += colWidths.rtn;

        doc.text(formatCurrency(purchase.subtotal), xPos + 2, yPos, { width: colWidths.subtotal, align: 'right' });
        xPos += colWidths.subtotal;

        doc.text(formatCurrency(purchase.descuento), xPos + 2, yPos, { width: colWidths.descuento, align: 'right' });
        xPos += colWidths.descuento;

        doc.text(formatCurrency(purchase.recargo), xPos + 2, yPos, { width: colWidths.recargo, align: 'right' });
        xPos += colWidths.recargo;

        doc.text(formatCurrency(purchase.isv), xPos + 2, yPos, { width: colWidths.isv, align: 'right' });
        xPos += colWidths.isv;

        doc.text(formatCurrency(purchase.total), xPos + 2, yPos, { width: colWidths.total, align: 'right' });
        xPos += colWidths.total;

        doc.text(purchase.estatus || '', xPos + 2, yPos, { width: colWidths.estatus, align: 'center' });

        yPos += 14;
      });

      // TOTALES
      doc.moveDown(1);
      yPos = doc.y + 10;

      doc.rect(30, yPos, 720, 20).fillColor(headerBg).fill();
      doc.fontSize(9).font('Helvetica-Bold').fillColor('white');

      doc.text('TOTALES', 35, yPos + 5);

      xPos = 30 + colWidths.fecha + colWidths.numero + colWidths.proveedor + colWidths.rtn;
      doc.text(formatCurrency(totals.subtotal_total), xPos + 2, yPos + 5, { width: colWidths.subtotal, align: 'right' });
      xPos += colWidths.subtotal;

      doc.text(formatCurrency(totals.descuento_total), xPos + 2, yPos + 5, { width: colWidths.descuento, align: 'right' });
      xPos += colWidths.descuento;

      doc.text(formatCurrency(totals.recargo_total), xPos + 2, yPos + 5, { width: colWidths.recargo, align: 'right' });
      xPos += colWidths.recargo;

      doc.text(formatCurrency(totals.isv_total), xPos + 2, yPos + 5, { width: colWidths.isv, align: 'right' });
      xPos += colWidths.isv;

      doc.text(formatCurrency(totals.total_total), xPos + 2, yPos + 5, { width: colWidths.total, align: 'right' });

      // Resumen adicional
      yPos += 30;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
      doc.text(`Total de Compras: ${totals.total_compras}`, 35, yPos);
      doc.text(`Total de Devoluciones: ${totals.total_devoluciones}`, 250, yPos);
      doc.text(`Total Devuelto: ${formatCurrency(totals.total_devuelto)}`, 450, yPos);

      // Pie de página
      doc.fontSize(8).font('Helvetica').fillColor('gray');
      doc.text(
        `Generado el ${new Date().toLocaleString('es-HN')} por ProsperPOS`,
        30,
        550,
        { align: 'center', width: 720 }
      );

      // Finalizar PDF
      doc.end();

    } catch (error) {
      logger.error('Error in PurchaseBookService.exportPurchaseBookPDF:', error);
      throw error;
    }
  }
}

module.exports = PurchaseBookService;
