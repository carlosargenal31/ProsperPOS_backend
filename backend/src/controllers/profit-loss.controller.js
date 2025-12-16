/**
 * ===================================================================
 * PROSPERPOS - CONTROLADOR DE REPORTE DE PÉRDIDAS Y GANANCIAS
 * ===================================================================
 */

const ProfitLossService = require('../services/profit-loss.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const db = require('../utils/database');

/**
 * Obtener reporte de Pérdidas y Ganancias
 */
exports.getReport = async (req, res) => {
  try {
    const { date_from, date_to, branch_id, group_by = 'month' } = req.query;

    // Validar que se proporcionaron las fechas
    if (!date_from || !date_to) {
      return sendErrorResponse(res, 400, 'Las fechas inicial y final son requeridas');
    }

    logger.info(`📊 Solicitud de reporte P&L: ${date_from} a ${date_to}, group_by: ${group_by}`);

    const report = await ProfitLossService.getReport({
      date_from,
      date_to,
      branch_id: branch_id || null,
      group_by
    });

    return sendSuccessResponse(res, report, 'Reporte generado exitosamente');

  } catch (error) {
    logger.error('Error en getReport:', error);
    return sendErrorResponse(res, 500, error.message || 'Error al generar el reporte');
  }
};

/**
 * Exportar reporte a Excel
 */
exports.exportExcel = async (req, res) => {
  try {
    const { date_from, date_to, branch_id } = req.query;

    if (!date_from || !date_to) {
      return sendErrorResponse(res, 400, 'Las fechas inicial y final son requeridas');
    }

    const report = await ProfitLossService.getReport({
      date_from,
      date_to,
      branch_id: branch_id || null
    });

    // Importar ExcelJS dinámicamente
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pérdidas y Ganancias');

    // Obtener información de la compañía
    const [companyInfo] = await db.execute('SELECT * FROM company_info LIMIT 1');
    const company = companyInfo[0] || {};

    // Configurar estilos
    const headerStyle = {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const titleStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'left', vertical: 'middle' }
    };

    const currencyStyle = {
      numFmt: 'L #,##0.00'
    };

    const cellBorderStyle = {
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Información de la compañía
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = company.business_description || company.description || 'ProsperPOS';
    worksheet.getCell('A1').style = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'left' }
    };

    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = `RTN: ${company.rtn || 'N/A'} | Tel: ${company.telefono || 'N/A'}`;
    worksheet.getCell('A2').style = {
      font: { size: 10 },
      alignment: { horizontal: 'left' }
    };

    worksheet.addRow([]);

    // Título del reporte
    worksheet.mergeCells('A4:D4');
    worksheet.getCell('A4').value = 'REPORTE DE PÉRDIDAS Y GANANCIAS';
    worksheet.getCell('A4').style = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }
    };

    // Subtítulo con rango de fechas
    worksheet.mergeCells('A5:D5');
    worksheet.getCell('A5').value = `Período: ${date_from} a ${date_to}`;
    worksheet.getCell('A5').style = {
      font: { size: 11 },
      alignment: { horizontal: 'center' }
    };

    worksheet.addRow([]);
    worksheet.addRow([]);

    // Encabezados de columnas
    const headerRow = worksheet.addRow(['']);
    report.periods.forEach(p => {
      headerRow.getCell(headerRow.cellCount + 1).value = p.period;
    });
    headerRow.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.style = headerStyle;
      }
    });

    // Sección de Ingresos
    worksheet.addRow([]);
    const incomeTitle = worksheet.addRow(['Ingresos']);
    incomeTitle.getCell(1).style = titleStyle;

    // Ventas
    const salesRow = worksheet.addRow(['Ventas']);
    report.periods.forEach(p => {
      const cell = salesRow.getCell(salesRow.cellCount + 1);
      cell.value = p.income.sales;
      cell.style = currencyStyle;
    });

    // Servicios
    const serviceRow = worksheet.addRow(['Servicios']);
    report.periods.forEach(p => {
      const cell = serviceRow.getCell(serviceRow.cellCount + 1);
      cell.value = p.income.service;
      cell.style = currencyStyle;
    });

    // Devoluciones de Compras
    const purchaseReturnsRow = worksheet.addRow(['Devoluciones de Compras']);
    report.periods.forEach(p => {
      const cell = purchaseReturnsRow.getCell(purchaseReturnsRow.cellCount + 1);
      cell.value = p.income.purchase_returns;
      cell.style = currencyStyle;
    });

    // Utilidad Bruta
    const grossProfitRow = worksheet.addRow(['Utilidad Bruta']);
    grossProfitRow.getCell(1).style = { font: { bold: true } };
    report.periods.forEach(p => {
      const cell = grossProfitRow.getCell(grossProfitRow.cellCount + 1);
      cell.value = p.gross_profit;
      cell.style = { ...currencyStyle, font: { bold: true } };
    });

    // Sección de Gastos
    worksheet.addRow([]);
    const expensesTitle = worksheet.addRow(['Gastos']);
    expensesTitle.getCell(1).style = titleStyle;

    // Compras
    const purchasesRow = worksheet.addRow(['Compras']);
    report.periods.forEach(p => {
      const cell = purchasesRow.getCell(purchasesRow.cellCount + 1);
      cell.value = p.expenses.sales_cost;
      cell.style = currencyStyle;
    });

    // Devoluciones de Ventas
    const salesReturnsRow = worksheet.addRow(['Devoluciones de Ventas']);
    report.periods.forEach(p => {
      const cell = salesReturnsRow.getCell(salesReturnsRow.cellCount + 1);
      cell.value = p.expenses.sales_returns;
      cell.style = currencyStyle;
    });

    // Total Gastos
    const totalExpensesRow = worksheet.addRow(['Total Gastos']);
    totalExpensesRow.getCell(1).style = { font: { bold: true } };
    report.periods.forEach(p => {
      const cell = totalExpensesRow.getCell(totalExpensesRow.cellCount + 1);
      cell.value = p.expenses.total;
      cell.style = { ...currencyStyle, font: { bold: true } };
    });

    // Utilidad Neta
    worksheet.addRow([]);
    const netProfitRow = worksheet.addRow(['Utilidad Neta']);
    netProfitRow.getCell(1).style = { font: { bold: true, size: 14 } };
    report.periods.forEach(p => {
      const cell = netProfitRow.getCell(netProfitRow.cellCount + 1);
      cell.value = p.net_profit;
      cell.style = {
        ...currencyStyle,
        font: { bold: true, size: 14, color: { argb: p.net_profit >= 0 ? 'FF008000' : 'FFFF0000' } }
      };
    });

    // Ajustar anchos de columnas
    worksheet.columns.forEach((column, index) => {
      if (index === 0) {
        column.width = 30;
      } else {
        column.width = 15;
      }
    });

    // Enviar archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=perdidas-y-ganancias-${date_from}-${date_to}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    logger.error('Error exportando a Excel:', error);
    return sendErrorResponse(res, 500, 'Error al exportar el reporte');
  }
};

/**
 * Exportar reporte a PDF
 */
exports.exportPDF = async (req, res) => {
  try {
    const { date_from, date_to, branch_id } = req.query;

    if (!date_from || !date_to) {
      return sendErrorResponse(res, 400, 'Las fechas inicial y final son requeridas');
    }

    const report = await ProfitLossService.getReport({
      date_from,
      date_to,
      branch_id: branch_id || null
    });

    // Importar PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=perdidas-y-ganancias-${date_from}-${date_to}.pdf`
    );

    doc.pipe(res);

    // Título
    doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Pérdidas y Ganancias', {
      align: 'center'
    });
    doc.fontSize(12).font('Helvetica').text(`Período: ${date_from} a ${date_to}`, {
      align: 'center'
    });
    doc.moveDown(2);

    // Tabla de datos
    const formatCurrency = (value) => {
      return `$${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    report.periods.forEach((periodData, index) => {
      // Encabezado del período
      doc.fontSize(14).font('Helvetica-Bold').text(periodData.period, {
        underline: true
      });
      doc.moveDown(0.5);

      // Ingresos
      doc.fontSize(12).font('Helvetica-Bold').text('Ingresos:');
      doc.fontSize(10).font('Helvetica')
        .text(`  Ventas: ${formatCurrency(periodData.income.sales)}`)
        .text(`  Servicios: ${formatCurrency(periodData.income.service)}`)
        .text(`  Devoluciones de Compras: ${formatCurrency(periodData.income.purchase_returns)}`);
      doc.font('Helvetica-Bold').text(`  Utilidad Bruta: ${formatCurrency(periodData.gross_profit)}`);
      doc.moveDown(0.5);

      // Gastos
      doc.fontSize(12).font('Helvetica-Bold').text('Gastos:');
      doc.fontSize(10).font('Helvetica')
        .text(`  Compras: ${formatCurrency(periodData.expenses.sales_cost)}`)
        .text(`  Devoluciones de Ventas: ${formatCurrency(periodData.expenses.sales_returns)}`);
      doc.font('Helvetica-Bold').text(`  Total Gastos: ${formatCurrency(periodData.expenses.total)}`);
      doc.moveDown(0.5);

      // Utilidad Neta
      const netProfitColor = periodData.net_profit >= 0 ? 'green' : 'red';
      doc.fontSize(14).font('Helvetica-Bold')
        .fillColor(netProfitColor)
        .text(`Utilidad Neta: ${formatCurrency(periodData.net_profit)}`);
      doc.fillColor('black');

      if (index < report.periods.length - 1) {
        doc.moveDown(1.5);
      }
    });

    // Finalizar PDF
    doc.end();

  } catch (error) {
    logger.error('Error exportando a PDF:', error);
    return sendErrorResponse(res, 500, 'Error al exportar el reporte');
  }
};
