// Test directo del método calculateTotals
const Invoice = require('./src/models/invoice.model');

console.log('🧪 Probando método calculateTotals...\n');

const items = [
  {
    product_id: 1,
    product_name: 'Producto Test',
    quantity: 11,
    unit_price: 350.00,
    discount_type: null,
    discount_value: 0,
    tax_rate: 15
  }
];

const discountType = 'amount';
const discountValue = 20;
const shippingCost = 100;
const couponsDiscount = 300;
const offersDiscount = 220;

console.log('📥 Parámetros:');
console.log('  Items:', items.length);
console.log('  discount_type:', discountType);
console.log('  discount_value:', discountValue);
console.log('  shipping_cost:', shippingCost);
console.log('  coupons_discount:', couponsDiscount);
console.log('  offers_discount:', offersDiscount);
console.log('');

try {
  const totals = Invoice.calculateTotals(
    items,
    discountType,
    discountValue,
    shippingCost,
    couponsDiscount,
    offersDiscount
  );

  console.log('✅ Cálculo exitoso:');
  console.log('  Subtotal:', totals.subtotal);
  console.log('  Descuento:', totals.discount_amount);
  console.log('  Impuesto:', totals.tax_amount);
  console.log('  Recargos:', totals.shipping_cost);
  console.log('  Total:', totals.total);
  console.log('');

  console.log('🧮 Verificación:');
  console.log('  11 × 350 = 3850 (subtotal esperado)');
  console.log('  3850 - 540 = 3310 (después descuentos)');
  console.log('  3310 × 0.15 = 496.50 (impuesto)');
  console.log('  3310 + 496.50 + 100 = 3906.50 (total esperado)');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}
