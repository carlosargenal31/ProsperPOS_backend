const { getConnection } = require('../utils/database');

// Obtener toda la información de facturación del cliente
exports.getBillingInfo = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;

    const [billingInfo] = await connection.execute(
      `SELECT id, label, business_name, rtn, is_default, created_at
       FROM customer_billing_info
       WHERE customer_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      billingInfo: billingInfo
    });

  } catch (error) {
    console.error('Error al obtener información de facturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información de facturación'
    });
  } finally {
    connection.release();
  }
};

// Crear nueva información de facturación
exports.createBillingInfo = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const { label, business_name, rtn, is_default } = req.body;

    // Validar campos requeridos
    if (!business_name || !rtn) {
      return res.status(400).json({
        success: false,
        message: 'Razón social y RTN son requeridos'
      });
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await connection.execute(
        'UPDATE customer_billing_info SET is_default = 0 WHERE customer_id = ?',
        [customerId]
      );
    }

    // Insertar nueva información de facturación
    const [result] = await connection.execute(
      `INSERT INTO customer_billing_info (customer_id, label, business_name, rtn, is_default)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, label || null, business_name, rtn, is_default ? 1 : 0]
    );

    // Obtener la información recién creada
    const [billingInfo] = await connection.execute(
      `SELECT id, label, business_name, rtn, is_default, created_at
       FROM customer_billing_info WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Información de facturación guardada exitosamente',
      billingInfo: billingInfo[0]
    });

  } catch (error) {
    console.error('Error al guardar información de facturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la información de facturación'
    });
  } finally {
    connection.release();
  }
};

// Actualizar información de facturación
exports.updateBillingInfo = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const billingId = req.params.id;
    const { label, business_name, rtn, is_default } = req.body;

    // Verificar que la información pertenece al cliente
    const [billingInfo] = await connection.execute(
      'SELECT id FROM customer_billing_info WHERE id = ? AND customer_id = ?',
      [billingId, customerId]
    );

    if (billingInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Información de facturación no encontrada'
      });
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await connection.execute(
        'UPDATE customer_billing_info SET is_default = 0 WHERE customer_id = ?',
        [customerId]
      );
    }

    // Actualizar información de facturación
    await connection.execute(
      `UPDATE customer_billing_info
       SET label = ?, business_name = ?, rtn = ?, is_default = ?
       WHERE id = ? AND customer_id = ?`,
      [label || null, business_name, rtn, is_default ? 1 : 0, billingId, customerId]
    );

    // Obtener información actualizada
    const [updatedBillingInfo] = await connection.execute(
      `SELECT id, label, business_name, rtn, is_default, created_at
       FROM customer_billing_info WHERE id = ?`,
      [billingId]
    );

    res.json({
      success: true,
      message: 'Información de facturación actualizada exitosamente',
      billingInfo: updatedBillingInfo[0]
    });

  } catch (error) {
    console.error('Error al actualizar información de facturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la información de facturación'
    });
  } finally {
    connection.release();
  }
};

// Eliminar información de facturación
exports.deleteBillingInfo = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const billingId = req.params.id;

    // Verificar que la información pertenece al cliente
    const [billingInfo] = await connection.execute(
      'SELECT id FROM customer_billing_info WHERE id = ? AND customer_id = ?',
      [billingId, customerId]
    );

    if (billingInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Información de facturación no encontrada'
      });
    }

    // Eliminar información de facturación
    await connection.execute(
      'DELETE FROM customer_billing_info WHERE id = ? AND customer_id = ?',
      [billingId, customerId]
    );

    res.json({
      success: true,
      message: 'Información de facturación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar información de facturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la información de facturación'
    });
  } finally {
    connection.release();
  }
};

// Establecer información de facturación como predeterminada
exports.setDefaultBillingInfo = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const billingId = req.params.id;

    // Verificar que la información pertenece al cliente
    const [billingInfo] = await connection.execute(
      'SELECT id FROM customer_billing_info WHERE id = ? AND customer_id = ?',
      [billingId, customerId]
    );

    if (billingInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Información de facturación no encontrada'
      });
    }

    // Desmarcar todas las información del cliente
    await connection.execute(
      'UPDATE customer_billing_info SET is_default = 0 WHERE customer_id = ?',
      [customerId]
    );

    // Marcar la información como predeterminada
    await connection.execute(
      'UPDATE customer_billing_info SET is_default = 1 WHERE id = ? AND customer_id = ?',
      [billingId, customerId]
    );

    res.json({
      success: true,
      message: 'Información de facturación establecida como predeterminada'
    });

  } catch (error) {
    console.error('Error al establecer información predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al establecer la información de facturación predeterminada'
    });
  } finally {
    connection.release();
  }
};
