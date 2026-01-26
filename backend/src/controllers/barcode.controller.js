// ===================================================================
// PROSPERPOS - CONTROLADOR DE CÓDIGOS DE BARRA
// ===================================================================

const BarcodeService = require('../services/barcode.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class BarcodeController {
  /**
   * Obtener productos para generar códigos de barra
   * @route GET /api/barcodes/products
   */
  static async getProductsForBarcodes(req, res) {
    try {
      const filters = {
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        product_id: req.query.product_id,
        branch_id: req.query.branch_id,
      };

      const result = await BarcodeService.getProductsForBarcodes(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in BarcodeController.getProductsForBarcodes:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos para códigos de barra', error.message);
    }
  }

  /**
   * Generar PDF con códigos de barra
   * @route POST /api/barcodes/generate-pdf
   */
  static async generateBarcodePDF(req, res) {
    try {
      const {
        products,
        labelSize,
        showName,
        showPrice,
        showSKU,
        showCategory
      } = req.body;

      const pdfBuffer = await BarcodeService.generateBarcodePDF({
        products,
        labelSize,
        showName,
        showPrice,
        showSKU,
        showCategory
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=codigos-barra-${Date.now()}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error in BarcodeController.generateBarcodePDF:', error);
      return sendErrorResponse(res, 500, 'Error al generar PDF de códigos de barra', error.message);
    }
  }

  /**
   * Obtener lista de categorías
   * @route GET /api/barcodes/categories
   */
  static async getCategories(req, res) {
    try {
      const result = await BarcodeService.getCategories();
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in BarcodeController.getCategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categorías', error.message);
    }
  }

  /**
   * Obtener lista de subcategorías
   * @route GET /api/barcodes/subcategories
   */
  static async getSubcategories(req, res) {
    try {
      const categoryId = req.query.category_id;
      const result = await BarcodeService.getSubcategories(categoryId);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in BarcodeController.getSubcategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategorías', error.message);
    }
  }
}

module.exports = BarcodeController;
