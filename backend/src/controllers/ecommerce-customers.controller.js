const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'prosperpos-secret-key';

exports.register = async (req, res) => {
  const connection = await getConnection();

  try {
    const { first_name, last_name, email, phone, password } = req.body;

    // Validar campos requeridos
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos (nombre, apellido, email, contraseña)'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // Verificar si el email ya está registrado
    const [existingCustomers] = await connection.execute(
      'SELECT id FROM ecommerce_customers WHERE email = ?',
      [email]
    );

    if (existingCustomers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo cliente
    const [result] = await connection.execute(
      `INSERT INTO ecommerce_customers (first_name, last_name, email, phone, password)
       VALUES (?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone || null, hashedPassword]
    );

    // Generar token JWT
    const token = jwt.sign(
      {
        id: result.insertId,
        email: email,
        type: 'ecommerce_customer'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Obtener datos del cliente recién creado
    const [customers] = await connection.execute(
      'SELECT id, first_name, last_name, email, phone, dni, google_id, created_at FROM ecommerce_customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      token: token,
      customer: customers[0]
    });

  } catch (error) {
    console.error('Error al registrar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el cliente'
    });
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  const connection = await getConnection();

  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar cliente por email
    const [customers] = await connection.execute(
      'SELECT id, first_name, last_name, email, phone, dni, password, google_id, is_active, created_at FROM ecommerce_customers WHERE email = ? AND is_active = 1',
      [email]
    );

    if (customers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    const customer = customers[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        type: 'ecommerce_customer'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Eliminar password de la respuesta
    delete customer.password;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token: token,
      customer: customer
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  } finally {
    connection.release();
  }
};

exports.getProfile = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;

    const [customers] = await connection.execute(
      'SELECT id, first_name, last_name, email, phone, dni, google_id, created_at FROM ecommerce_customers WHERE id = ? AND is_active = 1',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      customer: customers[0]
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil'
    });
  } finally {
    connection.release();
  }
};

exports.updateProfile = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const { first_name, last_name, phone, dni } = req.body;

    await connection.execute(
      `UPDATE ecommerce_customers
       SET first_name = ?, last_name = ?, phone = ?, dni = ?
       WHERE id = ?`,
      [first_name, last_name, phone || null, dni || null, customerId]
    );

    const [customers] = await connection.execute(
      'SELECT id, first_name, last_name, email, phone, dni, google_id, created_at FROM ecommerce_customers WHERE id = ?',
      [customerId]
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      customer: customers[0]
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil'
    });
  } finally {
    connection.release();
  }
};

exports.changePassword = async (req, res) => {
  const connection = await getConnection();

  try {
    const customerId = req.customer.id;
    const { currentPassword, newPassword } = req.body;

    // Validar campos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere la contraseña actual y la nueva contraseña'
      });
    }

    // Validar longitud de nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener contraseña actual del cliente
    const [customers] = await connection.execute(
      'SELECT password FROM ecommerce_customers WHERE id = ? AND is_active = 1',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, customers[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await connection.execute(
      'UPDATE ecommerce_customers SET password = ? WHERE id = ?',
      [hashedPassword, customerId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña'
    });
  } finally {
    connection.release();
  }
};
