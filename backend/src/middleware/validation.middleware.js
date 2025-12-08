// ===================================================================
// PROSPERPOS - MIDDLEWARE DE VALIDACIÓN
// ===================================================================

const { sendValidationErrorResponse } = require('../utils/response');

/**
 * Validar login
 */
const validateLogin = (req, res, next) => {
  const { email, username, password } = req.body;
  const errors = [];

  // Validar que venga email o username
  if (!email && !username) {
    errors.push({
      field: 'email',
      message: 'Email o nombre de usuario es requerido'
    });
  }

  // Validar email si viene
  if (email && !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Email inválido'
    });
  }

  // Validar contraseña
  if (!password) {
    errors.push({
      field: 'password',
      message: 'Contraseña es requerida'
    });
  } else if (password.length < 6) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar registro
 */
const validateRegister = (req, res, next) => {
  const { username, email, password, first_name, last_name } = req.body;
  const errors = [];

  // Validar username
  if (!username) {
    errors.push({
      field: 'username',
      message: 'Nombre de usuario es requerido'
    });
  } else if (username.length < 3) {
    errors.push({
      field: 'username',
      message: 'El nombre de usuario debe tener al menos 3 caracteres'
    });
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push({
      field: 'username',
      message: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
    });
  }

  // Validar email
  if (!email) {
    errors.push({
      field: 'email',
      message: 'Email es requerido'
    });
  } else if (!isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Email inválido'
    });
  }

  // Validar contraseña
  if (!password) {
    errors.push({
      field: 'password',
      message: 'Contraseña es requerida'
    });
  } else if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe tener al menos 8 caracteres'
    });
  } else if (!isStrongPassword(password)) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    });
  }

  // Validar nombre
  if (!first_name) {
    errors.push({
      field: 'first_name',
      message: 'Nombre es requerido'
    });
  }

  // Validar apellido
  if (!last_name) {
    errors.push({
      field: 'last_name',
      message: 'Apellido es requerido'
    });
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar cambio de contraseña
 */
const validateChangePassword = (req, res, next) => {
  const { current_password, new_password, confirm_password } = req.body;
  const errors = [];

  // Validar contraseña actual
  if (!current_password) {
    errors.push({
      field: 'current_password',
      message: 'Contraseña actual es requerida'
    });
  }

  // Validar nueva contraseña
  if (!new_password) {
    errors.push({
      field: 'new_password',
      message: 'Nueva contraseña es requerida'
    });
  } else if (new_password.length < 8) {
    errors.push({
      field: 'new_password',
      message: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  } else if (!isStrongPassword(new_password)) {
    errors.push({
      field: 'new_password',
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    });
  }

  // Validar confirmación de contraseña
  if (confirm_password && new_password !== confirm_password) {
    errors.push({
      field: 'confirm_password',
      message: 'Las contraseñas no coinciden'
    });
  }

  // Verificar que la nueva contraseña sea diferente de la actual
  if (current_password === new_password) {
    errors.push({
      field: 'new_password',
      message: 'La nueva contraseña debe ser diferente de la actual'
    });
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar creación de producto
 */
const validateProductCreation = (req, res, next) => {
  const { name, category_id, sale_price } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Nombre del producto es requerido'
    });
  }

  if (!category_id) {
    errors.push({
      field: 'category_id',
      message: 'Categoría es requerida'
    });
  }

  if (sale_price !== undefined && sale_price !== null) {
    if (isNaN(sale_price) || parseFloat(sale_price) < 0) {
      errors.push({
        field: 'sale_price',
        message: 'Precio de venta inválido'
      });
    }
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar actualización de producto
 */
const validateProductUpdate = (req, res, next) => {
  const { name, sale_price } = req.body;
  const errors = [];

  if (name !== undefined && name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Nombre del producto no puede estar vacío'
    });
  }

  if (sale_price !== undefined && sale_price !== null) {
    if (isNaN(sale_price) || parseFloat(sale_price) < 0) {
      errors.push({
        field: 'sale_price',
        message: 'Precio de venta inválido'
      });
    }
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar ajuste de stock
 */
const validateStockAdjustment = (req, res, next) => {
  const { product_id, new_quantity, reason } = req.body;
  const errors = [];

  if (!product_id) {
    errors.push({
      field: 'product_id',
      message: 'ID del producto es requerido'
    });
  }

  if (new_quantity === undefined || new_quantity === null) {
    errors.push({
      field: 'new_quantity',
      message: 'Nueva cantidad es requerida'
    });
  } else if (isNaN(new_quantity) || parseFloat(new_quantity) < 0) {
    errors.push({
      field: 'new_quantity',
      message: 'Cantidad inválida'
    });
  }

  if (!reason || reason.trim() === '') {
    errors.push({
      field: 'reason',
      message: 'Razón del ajuste es requerida'
    });
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar creación de subcategoría
 */
const validateSubcategory = (req, res, next) => {
  const { name, category_id } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Nombre de la subcategoría es requerido'
    });
  } else if (name.length < 2) {
    errors.push({
      field: 'name',
      message: 'El nombre debe tener al menos 2 caracteres'
    });
  } else if (name.length > 100) {
    errors.push({
      field: 'name',
      message: 'El nombre no puede exceder 100 caracteres'
    });
  }

  if (!category_id) {
    errors.push({
      field: 'category_id',
      message: 'Categoría padre es requerida'
    });
  } else if (isNaN(category_id) || parseInt(category_id) <= 0) {
    errors.push({
      field: 'category_id',
      message: 'ID de categoría padre inválido'
    });
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validar actualización de subcategoría
 */
const validateSubcategoryUpdate = (req, res, next) => {
  const { name, category_id } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Nombre de la subcategoría no puede estar vacío'
      });
    } else if (name.length < 2) {
      errors.push({
        field: 'name',
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    } else if (name.length > 100) {
      errors.push({
        field: 'name',
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }
  }

  if (category_id !== undefined) {
    if (!category_id) {
      errors.push({
        field: 'category_id',
        message: 'Categoría padre es requerida'
      });
    } else if (isNaN(category_id) || parseInt(category_id) <= 0) {
      errors.push({
        field: 'category_id',
        message: 'ID de categoría padre inválido'
      });
    }
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors);
  }

  next();
};

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

/**
 * Validar formato de email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar contraseña fuerte
 */
function isStrongPassword(password) {
  // Al menos 8 caracteres, una mayúscula, una minúscula y un número
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongRegex.test(password);
}

// ===================================================================
// EXPORTAR FUNCIONES
// ===================================================================

module.exports = {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateProductCreation,
  validateProductUpdate,
  validateStockAdjustment,
  validateSubcategory,
  validateSubcategoryUpdate,
  // Funciones auxiliares exportadas por si son útiles
  isValidEmail,
  isStrongPassword
};