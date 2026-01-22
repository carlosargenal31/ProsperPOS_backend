// ===================================================================
// PROSPERPOS - CONTROLADOR DE CUPONES E-COMMERCE
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class EcommerceCouponController {

  /**
   * Validar y aplicar cupón en el carrito
   */
  static async validateCoupon(req, res) {
    try {
      const { code, cart } = req.body;

      // Debug: log what we received
      console.log('=== VALIDATE COUPON DEBUG ===');
      console.log('Code:', code);
      console.log('Cart:', JSON.stringify(cart, null, 2));
      console.log('Cart.items:', cart?.items);
      console.log('Cart.items.length:', cart?.items?.length);

      if (!code || !cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos',
          debug: {
            hasCode: !!code,
            hasCart: !!cart,
            hasItems: !!cart?.items,
            itemsLength: cart?.items?.length
          }
        });
      }

      // Buscar el cupón
      const query = `
        SELECT c.*
        FROM coupons c
        WHERE c.codigo = ?
        AND c.deleted_at IS NULL
        AND c.is_active = 1
        AND c.suspendida = 0
      `;
      const coupons = await db.query(query, [code.trim().toUpperCase()]);

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cupón no encontrado o inactivo'
        });
      }

      const coupon = coupons[0];

      console.log('Cupón encontrado:', {
        id: coupon.id,
        codigo: coupon.codigo,
        nombre: coupon.nombre,
        tipo_aplicacion: coupon.tipo_aplicacion,
        grupo_id: coupon.grupo_id,
        subgrupo_id: coupon.subgrupo_id,
        articulo_id: coupon.articulo_id
      });

      // Validar fecha
      if (coupon.limitar_fecha) {
        const now = new Date();
        if (coupon.fecha_desde && new Date(coupon.fecha_desde) > now) {
          return res.status(400).json({
            success: false,
            message: 'Este cupón aún no es válido'
          });
        }
        if (coupon.fecha_hasta && new Date(coupon.fecha_hasta) < now) {
          return res.status(400).json({
            success: false,
            message: 'Este cupón ha expirado'
          });
        }
      }

      // Validar día de la semana - SOLO si al menos un día está configurado
      const hasDayRestriction = coupon.aplica_lunes || coupon.aplica_martes || coupon.aplica_miercoles ||
                                coupon.aplica_jueves || coupon.aplica_viernes || coupon.aplica_sabado || coupon.aplica_domingo;

      if (hasDayRestriction) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const dayField = `aplica_${dayNames[dayOfWeek]}`;

        if (!coupon[dayField]) {
          return res.status(400).json({
            success: false,
            message: 'Este cupón no es válido para el día de hoy'
          });
        }
      }

      // Validar hora si está limitado por hora
      if (coupon.limitar_hora) {
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
        if (coupon.hora_desde && currentTime < coupon.hora_desde) {
          return res.status(400).json({
            success: false,
            message: 'Este cupón aún no es válido para esta hora'
          });
        }
        if (coupon.hora_hasta && currentTime > coupon.hora_hasta) {
          return res.status(400).json({
            success: false,
            message: 'Este cupón ya no es válido para esta hora'
          });
        }
      }

      // Calcular subtotal del carrito
      const subtotal = cart.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);

      // Validar monto mínimo si aplica
      if (coupon.aplica_para === 'compras_mayores' && coupon.monto_minimo) {
        if (subtotal < parseFloat(coupon.monto_minimo)) {
          return res.status(400).json({
            success: false,
            message: `Este cupón requiere una compra mínima de L ${coupon.monto_minimo}`
          });
        }
      }

      // Validar cantidad mínima si aplica
      if (coupon.aplica_para === 'cantidades_mayores' && coupon.cantidad_minima) {
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems < coupon.cantidad_minima) {
          return res.status(400).json({
            success: false,
            message: `Este cupón requiere un mínimo de ${coupon.cantidad_minima} productos`
          });
        }
      }

      // Verificar si aplica a productos específicos
      let applicableItems = [];

      if (coupon.tipo_aplicacion === 'grupo') {
        // Si tiene grupo_id Y subgrupo_id, debe cumplir AMBAS
        if (coupon.grupo_id && coupon.subgrupo_id) {
          applicableItems = cart.items.filter(item =>
            item.category_id === coupon.grupo_id &&
            item.subcategory_id === coupon.subgrupo_id
          );
        }
        // Si solo tiene grupo_id (categoría), filtra solo por categoría
        else if (coupon.grupo_id) {
          applicableItems = cart.items.filter(item => item.category_id === coupon.grupo_id);
        }
        // Si solo tiene subgrupo_id (subcategoría), filtra solo por subcategoría
        else if (coupon.subgrupo_id) {
          applicableItems = cart.items.filter(item => item.subcategory_id === coupon.subgrupo_id);
        }
        // Si tiene articulo_id específico
        else if (coupon.articulo_id) {
          applicableItems = cart.items.filter(item => item.product_id === coupon.articulo_id);
        }
        // Si no tiene ninguno, aplica a todos
        else {
          applicableItems = cart.items;
        }
      } else if (coupon.tipo_aplicacion === 'multiple') {
        // Obtener productos específicos del cupón
        const productsQuery = `
          SELECT product_id FROM coupon_products WHERE coupon_id = ?
        `;
        const couponProducts = await db.query(productsQuery, [coupon.id]);
        const productIds = couponProducts.map(p => p.product_id);

        applicableItems = cart.items.filter(item => productIds.includes(item.product_id));
      } else {
        // Aplica a todos
        applicableItems = cart.items;
      }

      console.log('Items aplicables encontrados:', applicableItems.length);
      console.log('Items aplicables:', applicableItems);

      if (applicableItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Este cupón no aplica a los productos en tu carrito',
          debug: {
            coupon_tipo: coupon.tipo_aplicacion,
            coupon_grupo_id: coupon.grupo_id,
            coupon_subgrupo_id: coupon.subgrupo_id,
            coupon_articulo_id: coupon.articulo_id,
            cart_items: cart.items.map(i => ({
              product_id: i.product_id,
              category_id: i.category_id,
              subcategory_id: i.subcategory_id
            }))
          }
        });
      }

      // Calcular descuento
      const applicableSubtotal = applicableItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);

      let discountAmount = 0;
      if (coupon.tipo_descuento === 'porcentaje') {
        discountAmount = applicableSubtotal * (parseFloat(coupon.valor_descuento) / 100);
      } else {
        discountAmount = parseFloat(coupon.valor_descuento);
      }

      // No puede ser mayor que el subtotal aplicable
      discountAmount = Math.min(discountAmount, applicableSubtotal);

      res.json({
        success: true,
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.codigo,
            name: coupon.nombre,
            discount_type: coupon.tipo_descuento,
            discount_value: coupon.valor_descuento,
            discount_amount: parseFloat(discountAmount.toFixed(2))
          }
        },
        message: '¡Cupón aplicado exitosamente!'
      });

    } catch (error) {
      logger.error('Error in validateCoupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar el cupón'
      });
    }
  }

  /**
   * Obtener ofertas activas aplicables al carrito
   */
  static async getActiveOffers(req, res) {
    try {
      const { cart } = req.body;

      // Debug: log what we received
      console.log('=== ACTIVE OFFERS DEBUG ===');
      console.log('Cart:', JSON.stringify(cart, null, 2));
      console.log('Cart.items:', cart?.items);
      console.log('Cart.items.length:', cart?.items?.length);

      if (!cart || !cart.items || cart.items.length === 0) {
        return res.json({
          success: true,
          data: { offers: [] }
        });
      }

      // Obtener ofertas activas que apliquen al día y hora actual
      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const dayField = `aplica_${dayNames[dayOfWeek]}`;
      const currentTime = now.toTimeString().split(' ')[0];
      const currentDate = now.toISOString().split('T')[0];

      // Build query with dynamic day field
      const query = `
        SELECT o.*
        FROM offers o
        WHERE o.deleted_at IS NULL
        AND o.is_active = 1
        AND o.suspendida = 0
        AND o.${dayField} = 1
        AND (o.limitar_fecha = 0 OR (o.fecha_desde <= ? AND o.fecha_hasta >= ?))
        AND (o.limitar_hora = 0 OR (o.hora_desde <= ? AND o.hora_hasta >= ?))
      `;

      const offers = await db.query(query, [currentDate, currentDate, currentTime, currentTime]);

      console.log('=== QUERY INFO ===');
      console.log('Current date:', currentDate);
      console.log('Current time:', currentTime);
      console.log('Day of week:', dayOfWeek, '-', dayNames[dayOfWeek]);
      console.log('Day field:', dayField);
      console.log(`Ofertas encontradas en DB: ${offers.length}`);

      if (offers.length > 0) {
        console.log('Ofertas:', offers.map(o => ({
          id: o.id,
          nombre: o.nombre,
          tipo_aplicacion: o.tipo_aplicacion,
          categoria_id: o.categoria_id,
          subcategoria_id: o.subcategoria_id,
          producto_id: o.producto_id,
          aplica_para: o.aplica_para,
          monto_minimo: o.monto_minimo,
          cantidad_minima: o.cantidad_minima
        })));
      }

      console.log('=== CART ITEMS ===');
      console.log('Cart items:', cart.items.map(item => ({
        product_id: item.product_id,
        name: item.name,
        category_id: item.category_id,
        subcategory_id: item.subcategory_id,
        price: item.price,
        quantity: item.quantity
      })));

      // Filtrar y calcular ofertas aplicables
      const applicableOffers = [];

      for (const offer of offers) {
        console.log(`\n=== EVALUANDO OFERTA: ${offer.nombre} (ID: ${offer.id}) ===`);

        // Verificar productos aplicables PRIMERO
        let applicableItems = [];
        console.log(`Tipo de aplicación: ${offer.tipo_aplicacion}`);

        if (offer.tipo_aplicacion === 'grupo') {
          // Si tiene categoria_id Y subcategoria_id, debe cumplir AMBAS
          if (offer.categoria_id && offer.subcategoria_id) {
            console.log(`  Filtro: Categoría ${offer.categoria_id} Y Subcategoría ${offer.subcategoria_id}`);
            applicableItems = cart.items.filter(item =>
              item.category_id === offer.categoria_id &&
              item.subcategory_id === offer.subcategoria_id
            );
          }
          // Si solo tiene categoria_id, filtra solo por categoría
          else if (offer.categoria_id) {
            console.log(`  Filtro: Solo Categoría ${offer.categoria_id}`);
            applicableItems = cart.items.filter(item => item.category_id === offer.categoria_id);
          }
          // Si solo tiene subcategoria_id, filtra solo por subcategoría
          else if (offer.subcategoria_id) {
            console.log(`  Filtro: Solo Subcategoría ${offer.subcategoria_id}`);
            applicableItems = cart.items.filter(item => item.subcategory_id === offer.subcategoria_id);
          }
          // Si tiene producto_id específico
          else if (offer.producto_id) {
            console.log(`  Filtro: Solo Producto ${offer.producto_id}`);
            applicableItems = cart.items.filter(item => item.product_id === offer.producto_id);
          }
          // Si no tiene ninguno, aplica a todos
          else {
            console.log(`  Filtro: Todos los productos`);
            applicableItems = cart.items;
          }
        } else if (offer.tipo_aplicacion === 'multiple') {
          console.log(`  Filtro: Productos múltiples`);
          const productsQuery = `SELECT product_id FROM offer_items WHERE offer_id = ?`;
          const offerProducts = await db.query(productsQuery, [offer.id]);
          const productIds = offerProducts.map(p => p.product_id);
          console.log(`  IDs de productos en oferta:`, productIds);
          applicableItems = cart.items.filter(item => productIds.includes(item.product_id));
        } else {
          console.log(`  Filtro: Tipo desconocido, aplicando a todos`);
          applicableItems = cart.items;
        }

        console.log(`  Productos aplicables encontrados: ${applicableItems.length}`);
        if (applicableItems.length > 0) {
          console.log(`  Productos que califican:`, applicableItems.map(i => `${i.name} (Cat:${i.category_id}, Sub:${i.subcategory_id})`));
        }

        if (applicableItems.length > 0) {
          // Validar condiciones por producto
          let itemsQualified = [];

          if (offer.aplica_para === 'cantidades_mayores') {
            // Para cantidades_mayores: validar cantidad por producto individual
            const minQty = parseInt(offer.cantidad_minima || 0);
            itemsQualified = applicableItems.filter(item => item.quantity >= minQty);
            console.log(`  Condición: Cantidad >= ${minQty} por producto`);
            console.log(`  Productos que cumplen: ${itemsQualified.length} de ${applicableItems.length}`);

            if (itemsQualified.length > 0) {
              console.log(`  Items calificados:`, itemsQualified.map(i => `${i.name} (qty: ${i.quantity})`));
            }
          } else if (offer.aplica_para === 'compras_mayores') {
            // Para compras_mayores: validar monto por producto individual
            const minAmount = parseFloat(offer.monto_minimo || 0);
            itemsQualified = applicableItems.filter(item => {
              const itemTotal = parseFloat(item.price) * item.quantity;
              return itemTotal >= minAmount;
            });
            console.log(`  Condición: Monto >= L${minAmount} por producto`);
            console.log(`  Productos que cumplen: ${itemsQualified.length} de ${applicableItems.length}`);

            if (itemsQualified.length > 0) {
              console.log(`  Items calificados:`, itemsQualified.map(i => {
                const total = parseFloat(i.price) * i.quantity;
                return `${i.name} (total: L${total.toFixed(2)})`;
              }));
            }
          } else {
            // Sin condición específica, todos califican
            itemsQualified = applicableItems;
          }

          if (itemsQualified.length === 0) {
            console.log(`❌ Ningún producto cumple las condiciones de la oferta`);
            continue;
          }

          // Calcular descuento sobre los items que califican
          const qualifiedSubtotal = itemsQualified.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
          }, 0);

          let discountAmount = 0;
          if (offer.tipo_descuento === 'porcentaje') {
            discountAmount = qualifiedSubtotal * (parseFloat(offer.valor_descuento) / 100);
          } else {
            // Para descuento por monto fijo, multiplicar por cantidad de items calificados
            discountAmount = parseFloat(offer.valor_descuento) * itemsQualified.reduce((sum, item) => sum + item.quantity, 0);
          }

          discountAmount = Math.min(discountAmount, qualifiedSubtotal);

          console.log(`✅ OFERTA APLICADA: ${offer.nombre}`);
          console.log(`  Subtotal calificado: L ${qualifiedSubtotal.toFixed(2)}`);
          console.log(`  Descuento: L ${discountAmount.toFixed(2)}`);

          applicableOffers.push({
            id: offer.id,
            name: offer.nombre,
            discount_type: offer.tipo_descuento,
            discount_value: offer.valor_descuento,
            discount_amount: parseFloat(discountAmount.toFixed(2)),
            applicable_items: itemsQualified.length
          });
        } else {
          console.log(`❌ No hay productos aplicables para esta oferta`);
        }
      }

      console.log(`\n=== RESUMEN ===`);
      console.log(`Total de ofertas aplicables: ${applicableOffers.length}`);

      res.json({
        success: true,
        data: { offers: applicableOffers }
      });

    } catch (error) {
      logger.error('Error in getActiveOffers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ofertas'
      });
    }
  }
}

module.exports = EcommerceCouponController;
