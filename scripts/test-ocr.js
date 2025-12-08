/**
 * Test OCR Service
 * Quick test to verify OCR functionality
 */

const ocrService = require('../src/services/ocr.service');
const path = require('path');

async function testOCR() {
  console.log('🔍 Testing OCR Service...\n');

  // Create a test text file to simulate OCR
  const testText = `
    FERRETERIA FARAJ, S.A DE C.V.
    RTN: 05019002184650

    Factura: 003-001-01-00044621
    Fecha: 27/11/2025

    DESCRIPCION                    CANT    PRECIO      TOTAL
    CAJA PORCELANA KARINA ZP0723     6    132.00     792.00
    CORNISA NOGAL 4MTS              6    151.50     909.00

    Subtotal:                              L 2,033.19
    ISV 15%:                               L   304.98
    TOTAL A PAGAR:                         L 2,338.17
  `;

  console.log('📄 Sample Invoice Text:');
  console.log(testText);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const extractedData = ocrService.extractInvoiceData(testText);

    console.log('✅ Extracted Data:');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    const validation = ocrService.validateInvoiceData(extractedData);

    console.log('🔍 Validation Results:');
    console.log(`Valid: ${validation.isValid}`);

    if (validation.errors.length > 0) {
      console.log('❌ Errors:');
      validation.errors.forEach(err => console.log(`  - ${err}`));
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    console.log('\n✅ OCR Service test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing OCR:', error);
  }
}

// Run test
testOCR();
