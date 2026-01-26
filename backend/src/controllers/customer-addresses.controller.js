const { getConnection } = require('../utils/database');

// Obtener todas las direcciones del cliente
exports.getAddresses = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;

    const [addresses] = await connection.execute(
      `SELECT id, recipient_name, recipient_phone as phone, state as department, city,
              address_line1 as full_address, additional_notes, address_label, is_default, created_at
       FROM customer_addresses
       WHERE customer_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      addresses: addresses
    });

  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las direcciones'
    });
  } finally {
    connection.release();
  }
};

// Crear nueva dirección
exports.createAddress = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const { recipient_name, phone, department, city, full_address, additional_notes, address_label, is_default } = req.body;

    // Validar campos requeridos
    if (!recipient_name || !phone || !department || !city || !full_address) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await connection.execute(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [customerId]
      );
    }

    // Insertar nueva dirección
    const [result] = await connection.execute(
      `INSERT INTO customer_addresses (customer_id, recipient_name, recipient_phone, state, city, address_line1, additional_notes, address_label, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, recipient_name, phone, department, city, full_address, additional_notes || null, address_label || null, is_default ? 1 : 0]
    );

    // Obtener la dirección recién creada
    const [addresses] = await connection.execute(
      `SELECT id, recipient_name, recipient_phone as phone, state as department, city,
              address_line1 as full_address, additional_notes, address_label, is_default, created_at
       FROM customer_addresses WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Dirección guardada exitosamente',
      address: addresses[0]
    });

  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la dirección'
    });
  } finally {
    connection.release();
  }
};

// Actualizar dirección
exports.updateAddress = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const addressId = req.params.id;
    const { recipient_name, phone, department, city, full_address, additional_notes, address_label, is_default } = req.body;

    // Verificar que la dirección pertenece al cliente
    const [addresses] = await connection.execute(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await connection.execute(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [customerId]
      );
    }

    // Actualizar dirección
    await connection.execute(
      `UPDATE customer_addresses
       SET recipient_name = ?, recipient_phone = ?, state = ?, city = ?, address_line1 = ?, additional_notes = ?, address_label = ?, is_default = ?
       WHERE id = ? AND customer_id = ?`,
      [recipient_name, phone, department, city, full_address, additional_notes || null, address_label || null, is_default ? 1 : 0, addressId, customerId]
    );

    // Obtener dirección actualizada
    const [updatedAddresses] = await connection.execute(
      `SELECT id, recipient_name, recipient_phone as phone, state as department, city,
              address_line1 as full_address, additional_notes, address_label, is_default, created_at
       FROM customer_addresses WHERE id = ?`,
      [addressId]
    );

    res.json({
      success: true,
      message: 'Dirección actualizada exitosamente',
      address: updatedAddresses[0]
    });

  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la dirección'
    });
  } finally {
    connection.release();
  }
};

// Eliminar dirección
exports.deleteAddress = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const addressId = req.params.id;

    // Verificar que la dirección pertenece al cliente
    const [addresses] = await connection.execute(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    // Eliminar dirección
    await connection.execute(
      'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );

    res.json({
      success: true,
      message: 'Dirección eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la dirección'
    });
  } finally {
    connection.release();
  }
};

// Establecer dirección como predeterminada
exports.setDefaultAddress = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const addressId = req.params.id;

    // Verificar que la dirección pertenece al cliente
    const [addresses] = await connection.execute(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    // Desmarcar todas las direcciones del cliente
    await connection.execute(
      'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
      [customerId]
    );

    // Marcar la dirección como predeterminada
    await connection.execute(
      'UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );

    res.json({
      success: true,
      message: 'Dirección establecida como predeterminada'
    });

  } catch (error) {
    console.error('Error al establecer dirección predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al establecer la dirección predeterminada'
    });
  } finally {
    connection.release();
  }
};
