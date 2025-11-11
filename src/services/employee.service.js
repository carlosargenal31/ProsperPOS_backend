// ===================================================================
// PROSPERPOS - SERVICIO DE EMPLEADOS (RH)
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class EmployeeService {

  /**
   * Obtener todos los empleados con filtros
   */
  static async getEmployees(filters = {}) {
    try {
      const {
        search = '',
        is_active = null,
        department_id = null,
        position_id = null
      } = filters;

      let whereClause = 'WHERE e.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (e.nombre LIKE ? OR e.apellido LIKE ? OR e.dni LIKE ? OR e.email LIKE ? OR e.telefono LIKE ? OR e.codigo LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND e.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      if (department_id) {
        whereClause += ' AND e.department_id = ?';
        params.push(department_id);
      }

      if (position_id) {
        whereClause += ' AND e.position_id = ?';
        params.push(position_id);
      }

      const query = `
        SELECT
          e.*,
          d.nombre as department_name,
          p.nombre as position_name
        FROM hr_employees e
        LEFT JOIN hr_departments d ON e.department_id = d.id AND d.deleted_at IS NULL
        LEFT JOIN hr_positions p ON e.position_id = p.id AND p.deleted_at IS NULL
        ${whereClause}
        ORDER BY e.id ASC
      `;

      const employees = await db.execute(query, params);
      return employees;

    } catch (error) {
      logger.error('Error in getEmployees:', error);
      throw error;
    }
  }

  /**
   * Obtener empleado por ID
   */
  static async getEmployeeById(id) {
    try {
      const query = `
        SELECT
          e.*,
          d.nombre as department_name,
          p.nombre as position_name
        FROM hr_employees e
        LEFT JOIN hr_departments d ON e.department_id = d.id AND d.deleted_at IS NULL
        LEFT JOIN hr_positions p ON e.position_id = p.id AND p.deleted_at IS NULL
        WHERE e.id = ? AND e.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getEmployeeById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo empleado
   */
  static async createEmployee(employeeData) {
    try {
      const {
        codigo = null,
        nombre,
        apellido = null,
        dni = null,
        email = null,
        telefono = null,
        department_id = null,
        position_id = null,
        fecha_ingreso = null,
        salario = null,
        is_active = true,
        created_by
      } = employeeData;

      // Validar código único si se proporciona
      if (codigo) {
        const existingCodigo = await db.execute(
          'SELECT id FROM hr_employees WHERE codigo = ? AND deleted_at IS NULL',
          [codigo]
        );
        if (existingCodigo.length > 0) {
          throw new Error('El código de empleado ya existe');
        }
      }

      // Validar DNI único si se proporciona
      if (dni) {
        const existingDNI = await db.execute(
          'SELECT id FROM hr_employees WHERE dni = ? AND deleted_at IS NULL',
          [dni]
        );
        if (existingDNI.length > 0) {
          throw new Error('El DNI ya existe');
        }
      }

      // Validar email único si se proporciona
      if (email) {
        const existingEmail = await db.execute(
          'SELECT id FROM hr_employees WHERE email = ? AND deleted_at IS NULL',
          [email]
        );
        if (existingEmail.length > 0) {
          throw new Error('El email ya existe');
        }
      }

      // Insertar empleado
      const insertQuery = `
        INSERT INTO hr_employees (
          codigo, nombre, apellido, dni, email, telefono,
          department_id, position_id, fecha_ingreso,
          salario, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        codigo,
        nombre,
        apellido,
        dni,
        email,
        telefono,
        department_id,
        position_id,
        fecha_ingreso,
        salario,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        nombre,
        apellido
      };

    } catch (error) {
      logger.error('Error in createEmployee:', error);
      throw error;
    }
  }

  /**
   * Actualizar empleado
   */
  static async updateEmployee(id, employeeData) {
    try {
      const {
        codigo,
        nombre,
        apellido,
        dni,
        email,
        telefono,
        department_id,
        position_id,
        fecha_ingreso,
        salario,
        is_active,
        updated_by
      } = employeeData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM hr_employees WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Empleado no encontrado');
      }

      // Validar código único si se proporciona
      if (codigo) {
        const existingCodigo = await db.execute(
          'SELECT id FROM hr_employees WHERE codigo = ? AND id != ? AND deleted_at IS NULL',
          [codigo, id]
        );
        if (existingCodigo.length > 0) {
          throw new Error('El código de empleado ya existe');
        }
      }

      // Validar DNI único si se proporciona
      if (dni) {
        const existingDNI = await db.execute(
          'SELECT id FROM hr_employees WHERE dni = ? AND id != ? AND deleted_at IS NULL',
          [dni, id]
        );
        if (existingDNI.length > 0) {
          throw new Error('El DNI ya existe');
        }
      }

      // Validar email único si se proporciona
      if (email) {
        const existingEmail = await db.execute(
          'SELECT id FROM hr_employees WHERE email = ? AND id != ? AND deleted_at IS NULL',
          [email, id]
        );
        if (existingEmail.length > 0) {
          throw new Error('El email ya existe');
        }
      }

      // Actualizar
      const updateQuery = `
        UPDATE hr_employees SET
          codigo = ?, nombre = ?, apellido = ?, dni = ?, email = ?, telefono = ?,
          department_id = ?, position_id = ?, fecha_ingreso = ?,
          salario = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        codigo,
        nombre,
        apellido,
        dni,
        email,
        telefono,
        department_id,
        position_id,
        fecha_ingreso,
        salario,
        is_active ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, nombre, apellido };

    } catch (error) {
      logger.error('Error in updateEmployee:', error);
      throw error;
    }
  }

  /**
   * Eliminar empleado (soft delete)
   */
  static async deleteEmployee(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM hr_employees WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Empleado no encontrado');
      }

      // Soft delete
      await db.execute(
        'UPDATE hr_employees SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteEmployee:', error);
      throw error;
    }
  }

  /**
   * Obtener empleados activos
   */
  static async getActiveEmployees() {
    try {
      const query = `
        SELECT
          e.id,
          e.codigo,
          e.nombre,
          e.apellido,
          e.email,
          e.telefono,
          e.department_id,
          d.nombre as department_name,
          e.position_id,
          p.nombre as position_name,
          e.is_active
        FROM hr_employees e
        LEFT JOIN hr_departments d ON e.department_id = d.id AND d.deleted_at IS NULL
        LEFT JOIN hr_positions p ON e.position_id = p.id AND p.deleted_at IS NULL
        WHERE e.is_active = 1 AND e.deleted_at IS NULL
        ORDER BY e.id ASC
      `;

      const employees = await db.execute(query);
      return employees;

    } catch (error) {
      logger.error('Error in getActiveEmployees:', error);
      throw error;
    }
  }
}

module.exports = EmployeeService;
