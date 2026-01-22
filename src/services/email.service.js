// ===================================================================
// PROSPERPOS - SERVICIO DE EMAIL
// ===================================================================

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const db = require('../utils/database');

class EmailService {

  // =================================================================
  // CREAR TRANSPORTADOR DE EMAIL
  // =================================================================
  static async getTransporter() {
    try {
      // Obtener configuración de email
      const settings = await db.query(
        `SELECT setting_key, setting_value
         FROM ecommerce_settings
         WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'store_email')`
      );

      const config = {};
      settings.forEach(setting => {
        config[setting.setting_key] = setting.setting_value;
      });

      // Si no hay configuración SMTP, usar configuración por defecto (para desarrollo)
      if (!config.smtp_host) {
        logger.warn('No hay configuración SMTP, usando configuración de prueba');
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass'
          }
        });
      }

      return nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: parseInt(config.smtp_port) === 465,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password
        }
      });

    } catch (error) {
      logger.error('Error creando transportador de email:', error);
      throw error;
    }
  }

  // =================================================================
  // ENVIAR EMAIL DE NUEVO PEDIDO AL ADMINISTRADOR
  // =================================================================
  static async sendNewOrderNotification(order) {
    try {
      const settings = await db.query(
        'SELECT setting_value FROM ecommerce_settings WHERE setting_key = ?',
        ['store_email']
      );

      const storeEmail = settings[0]?.setting_value;

      if (!storeEmail) {
        logger.warn('No hay email de tienda configurado');
        return { success: false, message: 'No hay email configurado' };
      }

      const transporter = await this.getTransporter();

      const itemsList = order.items.map((item, index) =>
        `${index + 1}. ${item.product_name} - Cantidad: ${item.quantity} x L${parseFloat(item.unit_price).toFixed(2)} = L${parseFloat(item.subtotal).toFixed(2)}`
      ).join('\n');

      const mailOptions = {
        from: storeEmail,
        to: storeEmail,
        subject: `Nuevo Pedido en Línea - ${order.order_number}`,
        text: `
¡Nuevo Pedido Recibido!

Número de Pedido: ${order.order_number}
Cliente: ${order.customer_name}
Email: ${order.customer_email || 'No proporcionado'}
Teléfono: ${order.customer_phone || 'No proporcionado'}

PRODUCTOS:
${itemsList}

TOTAL: L${parseFloat(order.total_amount).toFixed(2)}

DIRECCIÓN DE ENVÍO:
${order.delivery_address}
${order.city}${order.department ? ', ' + order.department : ''}

${order.notes ? 'NOTAS DEL CLIENTE:\n' + order.notes : ''}

Fecha: ${new Date(order.created_at).toLocaleString('es-HN')}
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; }
    .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .products { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
    .product-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 1.5em; font-weight: bold; color: #667eea; margin-top: 15px; }
    .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🛒 Nuevo Pedido en Línea</h1>
      <p style="margin: 10px 0 0 0;">Pedido ${order.order_number}</p>
    </div>

    <div class="content">
      <div class="order-info">
        <h2>Información del Cliente</h2>
        <p><strong>Nombre:</strong> ${order.customer_name}</p>
        <p><strong>Email:</strong> ${order.customer_email || 'No proporcionado'}</p>
        <p><strong>Teléfono:</strong> ${order.customer_phone || 'No proporcionado'}</p>
      </div>

      <div class="products">
        <h2>Productos</h2>
        ${order.items.map((item, index) => `
          <div class="product-item">
            <strong>${index + 1}. ${item.product_name}</strong><br>
            Cantidad: ${item.quantity} x L${parseFloat(item.unit_price).toFixed(2)} = <strong>L${parseFloat(item.subtotal).toFixed(2)}</strong>
          </div>
        `).join('')}
        <p class="total">TOTAL: L${parseFloat(order.total_amount).toFixed(2)}</p>
      </div>

      <div class="order-info">
        <h2>Dirección de Envío</h2>
        <p>${order.delivery_address}</p>
        <p>${order.city}${order.department ? ', ' + order.department : ''}</p>
      </div>

      ${order.notes ? `
      <div class="order-info">
        <h2>Notas del Cliente</h2>
        <p>${order.notes}</p>
      </div>
      ` : ''}

      <div class="order-info">
        <p><strong>Fecha del Pedido:</strong> ${new Date(order.created_at).toLocaleString('es-HN')}</p>
        <p><strong>Estado:</strong> Pendiente</p>
      </div>
    </div>

    <div class="footer">
      <p>ProsperPOS - Sistema de Gestión</p>
      <p style="font-size: 0.8em; margin: 5px 0 0 0;">Este es un mensaje automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
        `
      };

      const info = await transporter.sendMail(mailOptions);

      logger.info('Email de nuevo pedido enviado:', info.messageId);

      return {
        success: true,
        message_id: info.messageId
      };

    } catch (error) {
      logger.error('Error enviando email de nuevo pedido:', error);
      return { success: false, error: error.message };
    }
  }

  // =================================================================
  // ENVIAR EMAIL DE CAMBIO DE ESTADO AL CLIENTE
  // =================================================================
  static async sendOrderStatusUpdate(order, newStatus, notes = null) {
    try {
      if (!order.customer_email) {
        logger.warn('El pedido no tiene email de cliente');
        return { success: false, message: 'No hay email de cliente' };
      }

      const settings = await db.query(
        'SELECT setting_value FROM ecommerce_settings WHERE setting_key = ?',
        ['store_email']
      );

      const storeEmail = settings[0]?.setting_value;

      const transporter = await this.getTransporter();

      const statusMessages = {
        'pendiente': {
          subject: 'Pedido Recibido',
          title: '✅ Hemos Recibido tu Pedido',
          message: 'Tu pedido ha sido recibido correctamente. Pronto te contactaremos con la cotización.'
        },
        'cotizado': {
          subject: 'Cotización de tu Pedido',
          title: '📄 Cotización Lista',
          message: 'Ya tenemos la cotización de tu pedido. Por favor revisa los detalles y confirma para proceder con el pago.'
        },
        'cobrado': {
          subject: 'Pago Confirmado',
          title: '✅ Pago Recibido',
          message: 'Hemos confirmado tu pago. Tu pedido será procesado y enviado pronto.'
        }
      };

      const statusInfo = statusMessages[newStatus] || {
        subject: 'Actualización de tu Pedido',
        title: 'Actualización de Estado',
        message: `El estado de tu pedido ha sido actualizado a: ${newStatus}`
      };

      const mailOptions = {
        from: storeEmail,
        to: order.customer_email,
        subject: `${statusInfo.subject} - ${order.order_number}`,
        text: `
Hola ${order.customer_name},

${statusInfo.message}

Número de Pedido: ${order.order_number}
Estado Actual: ${newStatus.toUpperCase()}
Total: L${parseFloat(order.total_amount).toFixed(2)}

${notes ? 'NOTAS:\n' + notes + '\n\n' : ''}

Gracias por tu preferencia.

Saludos,
El equipo de Ceramicas Universal
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 20px; }
    .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px solid #667eea; }
    .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
    .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${statusInfo.title}</h1>
    </div>

    <div class="content">
      <p>Hola <strong>${order.customer_name}</strong>,</p>

      <div class="status-box">
        <p style="margin: 0; font-size: 1.1em;">${statusInfo.message}</p>
      </div>

      <div class="info-box">
        <p><strong>Número de Pedido:</strong> ${order.order_number}</p>
        <p><strong>Estado Actual:</strong> <span style="color: #667eea; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
        <p><strong>Total:</strong> L${parseFloat(order.total_amount).toFixed(2)}</p>
      </div>

      ${notes ? `
      <div class="info-box">
        <h3>Notas:</h3>
        <p>${notes}</p>
      </div>
      ` : ''}

      <p>Gracias por tu preferencia.</p>
      <p>Saludos,<br><strong>El equipo de nuestra tienda</strong></p>
    </div>

    <div class="footer">
      <p>ProsperPOS - Sistema de Gestión</p>
      <p style="margin: 5px 0 0 0;">Este es un mensaje automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
        `
      };

      const info = await transporter.sendMail(mailOptions);

      logger.info('Email de actualización de estado enviado:', info.messageId);

      return {
        success: true,
        message_id: info.messageId
      };

    } catch (error) {
      logger.error('Error enviando email de actualización:', error);
      return { success: false, error: error.message };
    }
  }

  // =================================================================
  // ENVIAR EMAIL DE RESPUESTA A OPINIÓN DEL CLIENTE
  // =================================================================
  static async sendOpinionResponse(responseData) {
    try {
      logger.info('📧 Iniciando envío de email de respuesta de opinión...');

      const {
        customer_name,
        customer_email,
        inquiry_type,
        original_message,
        admin_response
      } = responseData;

      logger.info(`Datos: ${customer_name} <${customer_email}>`);

      if (!customer_email) {
        logger.warn('No hay email de cliente para enviar respuesta');
        return { success: false, message: 'No hay email de cliente' };
      }

      const settings = await db.query(
        'SELECT setting_value FROM ecommerce_settings WHERE setting_key = ?',
        ['store_email']
      );

      const storeEmail = settings[0]?.setting_value || 'noreply@prosperpos.com';
      logger.info(`Store email: ${storeEmail}`);

      logger.info('Obteniendo transporter SMTP...');
      const transporter = await this.getTransporter();
      logger.info('✅ Transporter obtenido');

      // Mapeo de tipos de consulta a texto legible
      const inquiryTypeLabels = {
        'Seguimiento con Asesor': 'Seguimiento con Asesor',
        'Cotización no fue recibida/enviada': 'Cotización no recibida/enviada',
        'Factura - no fue recibida/enviada': 'Factura no recibida/enviada',
        'Factura - incorrecta': 'Factura incorrecta',
        'Servicio - Asesor no responde': 'Servicio - Asesor no responde',
        'Servicio - Asesor no da seguimiento': 'Servicio - Asesor no da seguimiento',
        'Servicio - Tiempo de entrega en bodega': 'Servicio - Tiempo de entrega en bodega',
        'Servicio - No atienden en Tienda': 'Servicio - No atienden en Tienda',
        'Otra': 'Otra consulta'
      };

      const inquiryLabel = inquiryTypeLabels[inquiry_type] || inquiry_type;

      const mailOptions = {
        from: storeEmail,
        to: customer_email,
        subject: `Respuesta a tu consulta: ${inquiryLabel}`,
        text: `
Hola ${customer_name},

Gracias por ponerte en contacto con nosotros. Hemos recibido tu mensaje y queremos responderte:

TU MENSAJE:
"${original_message}"

NUESTRA RESPUESTA:
${admin_response}

Si tienes alguna otra pregunta o necesitas más información, no dudes en contactarnos nuevamente.

Saludos cordiales,
Equipo de Cerámicas Universal
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px 20px; }
    .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .response-box { background: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0066cc; }
    .label { font-weight: bold; color: #667eea; text-transform: uppercase; font-size: 0.85em; margin-bottom: 10px; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 0.9em; }
    .inquiry-type { display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.85em; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✉️ Respuesta a tu Consulta</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Gracias por contactarnos</p>
    </div>

    <div class="content">
      <p>Hola <strong>${customer_name}</strong>,</p>

      <p>Hemos recibido tu consulta sobre: <span class="inquiry-type">${inquiryLabel}</span></p>

      <div class="message-box">
        <div class="label">Tu mensaje:</div>
        <p style="margin: 10px 0 0 0; color: #555;">"${original_message}"</p>
      </div>

      <div class="response-box">
        <div class="label" style="color: #0066cc;">Nuestra respuesta:</div>
        <p style="margin: 10px 0 0 0; color: #333;">${admin_response.replace(/\n/g, '<br>')}</p>
      </div>

      <p>Si tienes alguna otra pregunta o necesitas más información, no dudes en contactarnos nuevamente.</p>

      <p style="margin-top: 30px;">
        Saludos cordiales,<br>
        <strong>Equipo de Cerámicas Universal</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">Cerámicas Universal</p>
      <p style="margin: 10px 0 0 0; font-size: 0.85em; opacity: 0.8;">
        Este mensaje fue enviado en respuesta a tu consulta.
      </p>
    </div>
  </div>
</body>
</html>
        `
      };

      const info = await transporter.sendMail(mailOptions);

      logger.info('Email de respuesta de opinión enviado:', info.messageId);

      return {
        success: true,
        message_id: info.messageId
      };

    } catch (error) {
      logger.error('Error enviando email de respuesta de opinión:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
