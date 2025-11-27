/**
 * Purchase Service
 * Business logic for purchase operations
 */

const Purchase = require('../models/purchase.model');
const logger = require('../utils/logger');

class PurchaseService {
  async getAllPurchases(filters) {
    try {
      return await Purchase.getAll(filters);
    } catch (error) {
      logger.error('Error in PurchaseService.getAllPurchases:', error);
      throw error;
    }
  }

  async getPurchaseById(id) {
    try {
      const purchase = await Purchase.getById(id);
      if (!purchase) {
        throw new Error('Compra no encontrada');
      }
      return purchase;
    } catch (error) {
      logger.error('Error in PurchaseService.getPurchaseById:', error);
      throw error;
    }
  }

  async createPurchase(purchaseData, items) {
    try {
      if (!purchaseData.supplier_name) {
        throw new Error('El nombre del proveedor es requerido');
      }

      if (!items || items.length === 0) {
        throw new Error('Debe agregar al menos un producto');
      }

      return await Purchase.create(purchaseData, items);
    } catch (error) {
      logger.error('Error in PurchaseService.createPurchase:', error);
      throw error;
    }
  }

  async updatePurchase(id, purchaseData) {
    try {
      return await Purchase.update(id, purchaseData);
    } catch (error) {
      logger.error('Error in PurchaseService.updatePurchase:', error);
      throw error;
    }
  }

  async deletePurchase(id) {
    try {
      return await Purchase.delete(id);
    } catch (error) {
      logger.error('Error in PurchaseService.deletePurchase:', error);
      throw error;
    }
  }

  async getPurchaseBookReport(filters) {
    try {
      return await Purchase.getPurchaseBookReport(filters);
    } catch (error) {
      logger.error('Error in PurchaseService.getPurchaseBookReport:', error);
      throw error;
    }
  }

  async getSupplierStatement(supplierId, filters) {
    try {
      return await Purchase.getSupplierStatement(supplierId, filters);
    } catch (error) {
      logger.error('Error in PurchaseService.getSupplierStatement:', error);
      throw error;
    }
  }
}

module.exports = new PurchaseService();
