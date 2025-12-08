/**
 * OCR Service
 * Handles invoice image processing and data extraction using Tesseract.js
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const logger = require('../utils/logger');

class OCRService {
  /**
   * Process invoice image and extract data (from buffer - no file saving)
   * @param {Buffer} imageBuffer - Image buffer from upload
   * @returns {Promise<Object>} Extracted invoice data
   */
  async processInvoice(imageBuffer) {
    try {
      logger.info('Processing invoice image from buffer');

      // Preprocess image for better OCR results (returns buffer)
      const processedImageBuffer = await this.preprocessImage(imageBuffer);

      // Perform OCR directly from buffer
      const text = await this.performOCR(processedImageBuffer);

      // Extract structured data from text
      const invoiceData = this.extractInvoiceData(text);

      logger.info('Invoice processing completed successfully');
      return invoiceData;
    } catch (error) {
      logger.error('Error in OCRService.processInvoice:', error);
      throw new Error('Error al procesar la imagen de la factura: ' + error.message);
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async preprocessImage(imageBuffer) {
    try {
      const processedBuffer = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(128)
        .png()
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      logger.error('Error preprocessing image:', error);
      throw error;
    }
  }

  /**
   * Perform OCR on image buffer
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<string>} Extracted text
   */
  async performOCR(imageBuffer) {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'spa', // Spanish language
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      return text;
    } catch (error) {
      logger.error('Error performing OCR:', error);
      throw error;
    }
  }

  /**
   * Extract structured invoice data from OCR text - Line by line approach
   * @param {string} text - OCR extracted text
   * @returns {Object} Structured invoice data
   */
  extractInvoiceData(text) {
    const data = {
      invoice_number: null,
      invoice_date: null,
      due_date: null,
      supplier_name: null,
      supplier_id: null,
      supplier_address: null,
      subtotal: null,
      tax: null,
      discount: null,
      total: null,
      items: [],
      raw_text: text
    };

    // Array to collect all dates found in the invoice
    const allDatesFound = [];

    try {
      // Split into lines and normalize
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      // Search line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const upper = line.toUpperCase();

        // Invoice number - Look for "Factura:" or "FACTURARIO"
        if (!data.invoice_number) {
          if (upper.includes('FACTURA') || upper.includes('INVOICE')) {
            // Try to find the number pattern (XXX-XXX-XX-XXXXXXXX)
            const match = line.match(/([0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8})/);
            if (match) {
              data.invoice_number = match[1];
            }
          }
        }

        // RTN - Look for "RTN:"
        if (!data.supplier_id && upper.includes('RTN')) {
          const match = line.match(/RTN[\s:]*([0-9]{14,16})/i);
          if (match) {
            data.supplier_id = match[1];
          }
        }

        // Supplier name - Look for company keywords BEFORE we find RTN
        if (!data.supplier_name && i < 10) {
          if (upper.match(/FERRETERIA|FARMACIA|DISTRIBUIDORA|COMERCIAL|POLARIS|S\.A\.|LTDA/)) {
            // Clean up the line
            let name = line;
            name = name.replace(/RTN.*/i, '').trim();
            name = name.replace(/SADEC\.?$/i, '').trim();
            name = name.replace(/S\.?A\.?$/i, '').trim();
            if (name.length > 3 && name.length < 100) {
              data.supplier_name = name;
            }
          }
        }

        // Collect ALL dates found in lines with "FECHA", "EMISION", "LIMITE", "VENCIMIENTO", "IMPRESION"
        if (upper.includes('FECHA') || upper.includes('EMISION') || upper.includes('LIMITE') ||
            upper.includes('VENCIMIENTO') || upper.includes('IMPRESION')) {
          logger.info(`📅 Date line found: "${line}"`);

          const dateMatch = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
          if (dateMatch) {
            const parsedDate = this.parseDate(dateMatch[1]);
            const dateObj = new Date(parsedDate);

            // Only collect dates that are not in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateObj <= today) {
              allDatesFound.push({
                date: parsedDate,
                dateObj: dateObj,
                line: line,
                isLimite: upper.includes('LIMITE'),
                isVencimiento: upper.includes('VENCIMIENTO'),
                isImpresion: upper.includes('IMPRESION')
              });
              logger.info(`📅 Collected date: ${parsedDate} (future: ${dateObj > today})`);
            } else {
              logger.info(`⏭️ Skipped future date: ${parsedDate}`);
            }
          }
        }

        // Subtotal - Look for "Importe Gravado 15%" or "Gravado 15%" or "Subtotal"
        if (!data.subtotal) {
          if (upper.includes('GRAVADO') && upper.includes('15%')) {
            const match = line.match(/L?\.?\s*([0-9,]+\.\d{2})/);
            if (match) {
              data.subtotal = this.parseAmount(match[1]);
            }
          } else if (upper.includes('SUBTOTAL') && !upper.includes('DESC')) {
            const match = line.match(/L?\.?\s*([0-9,]+\.\d{2})/);
            if (match) {
              data.subtotal = this.parseAmount(match[1]);
            }
          }
        }

        // Tax - Look for "I.S.V" or "ISV" with "15%" or "18%"
        if (!data.tax) {
          // Try multiple patterns for ISV
          if (upper.match(/I\.?\s*S\.?\s*V/) || upper.match(/ISV/) || (upper.includes('15%') && !upper.includes('GRAVADO'))) {
            const match = line.match(/L?\.?\s*([0-9,]+\.\d{2})/);
            if (match) {
              data.tax = this.parseAmount(match[1]);
            }
          }
        }

        // Total - Look for "TOTAL A PAGAR" or "TOTAL:"
        if (!data.total) {
          if (upper.includes('TOTAL') && (upper.includes('PAGAR') || upper.includes('TOTAL:'))) {
            const match = line.match(/L?\.?\s*([0-9,]+\.\d{2})/);
            if (match) {
              data.total = this.parseAmount(match[1]);
            }
          }
        }

        // Discount
        if (!data.discount && upper.includes('DESC') && !upper.includes('DESCRIPCION')) {
          const match = line.match(/L?\.?\s*([0-9,]+\.\d{2})/);
          if (match) {
            data.discount = this.parseAmount(match[1]);
          }
        }
      }

      // NUEVA LÓGICA: Seleccionar la fecha MENOR de todas las fechas encontradas
      // Excluir fechas de "Límite", "Vencimiento" e "Impresión"
      logger.info(`📅 Total dates found: ${allDatesFound.length}`);

      if (allDatesFound.length > 0) {
        // Filter out "Limite", "Vencimiento", and "Impresion" dates
        const validEmissionDates = allDatesFound.filter(d =>
          !d.isLimite && !d.isVencimiento && !d.isImpresion
        );

        logger.info(`📅 Valid emission dates (excluding Limite/Vencimiento/Impresion): ${validEmissionDates.length}`);

        if (validEmissionDates.length > 0) {
          // Sort by date ascending (oldest first) and take the first one
          validEmissionDates.sort((a, b) => a.dateObj - b.dateObj);
          const earliestDate = validEmissionDates[0];

          data.invoice_date = earliestDate.date;
          logger.info(`✅ Selected EARLIEST emission date: ${data.invoice_date} from line: "${earliestDate.line}"`);
        } else if (allDatesFound.length > 0) {
          // If all dates are Limite/Vencimiento/Impresion, use the earliest one anyway
          allDatesFound.sort((a, b) => a.dateObj - b.dateObj);
          const earliestDate = allDatesFound[0];
          data.invoice_date = earliestDate.date;
          logger.warn(`⚠️ Using earliest date even though it's Limite/Vencimiento/Impresion: ${data.invoice_date}`);
        }
      }

      // If no invoice date found, use current date
      if (!data.invoice_date) {
        data.invoice_date = new Date().toISOString().split('T')[0];
        logger.warn(`⚠️ No valid date found, using current date: ${data.invoice_date}`);
      }

      // Calculate missing values based on what we found
      if (!data.subtotal && data.total && data.tax) {
        data.subtotal = data.total - data.tax;
      } else if (data.subtotal && data.tax && !data.total) {
        // Calculate total from subtotal + tax
        data.total = data.subtotal + data.tax;
      } else if (data.subtotal && !data.tax && !data.total) {
        // Calculate 15% ISV from subtotal
        data.tax = data.subtotal * 0.15;
        data.total = data.subtotal + data.tax;
      }

      // Round to 2 decimals
      if (data.subtotal) data.subtotal = Math.round(data.subtotal * 100) / 100;
      if (data.tax) data.tax = Math.round(data.tax * 100) / 100;
      if (data.total) data.total = Math.round(data.total * 100) / 100;

      logger.info('Extracted invoice data:', {
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        supplier_name: data.supplier_name,
        supplier_id: data.supplier_id,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total
      });

      return data;
    } catch (error) {
      logger.error('Error extracting invoice data:', error);
      return data;
    }
  }

  /**
   * Parse amount string to number
   * @param {string} amountStr - Amount string
   * @returns {number} Parsed amount
   */
  parseAmount(amountStr) {
    if (!amountStr) return 0;

    // Remove currency symbols and spaces
    let cleaned = amountStr.replace(/[L$\s]/g, '');

    // Handle comma as thousands separator and dot as decimal
    // Example: 2,033.19 -> 2033.19
    cleaned = cleaned.replace(/,/g, '');

    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse date string to ISO format
   * @param {string} dateStr - Date string
   * @returns {string} ISO date string
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      const parts = dateStr.split(/[-/]/);

      if (parts.length === 3) {
        let day, month, year;

        // Determine format - assume DD-MM-YYYY for Honduras
        day = parts[0];
        month = parts[1];
        year = parts[2];

        // Handle 2-digit years
        if (year.length === 2) {
          year = '20' + year;
        }

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } catch (error) {
      logger.error('Error parsing date:', error);
    }

    return null;
  }

  /**
   * Validate extracted invoice data
   * @param {Object} data - Extracted data
   * @returns {Object} Validation result
   */
  validateInvoiceData(data) {
    const errors = [];
    const warnings = [];

    if (!data.invoice_number) {
      warnings.push('Número de factura no detectado');
    }

    if (!data.supplier_name) {
      warnings.push('Nombre del proveedor no detectado');
    }

    if (!data.total || data.total === 0) {
      errors.push('Total no detectado o es cero');
    }

    if (!data.invoice_date) {
      warnings.push('Fecha de factura no detectada');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = new OCRService();
