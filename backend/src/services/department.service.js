// ===================================================================
// PROSPERPOS - SERVICIO DE DEPARTAMENTOS (RH)
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class DepartmentService {

  /**
   * Obtener todos los departamentos con filtros
   */
  static async getDepartments(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE d.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (d.nombre LIKE ? OR d.descripcion LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND d.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT d.*,
          (SELECT COUNT(*) FROM hr_positions WHERE department_id = d.id AND deleted_at IS NULL) as positions_count,
          (SELECT COUNT(*) FROM hr_employees WHERE department_id = d.id AND deleted_at IS NULL) as employees_count
        FROM hr_departments d
        ${whereClause}
        ORDER BY d.id ASC
      `;

      const departments = await db.execute(query, params);
      return departments;

    } catch (error) {
      logger.error('Error in getDepartments:', error);
      throw error;
    }
  }

  /**
   * Obtener departamento por ID
   */
  static async getDepartmentById(id) {
    try {
      const query = `
        SELECT d.*,
          (SELECT COUNT(*) FROM hr_positions WHERE department_id = d.id AND deleted_at IS NULL) as positions_count,
          (SELECT COUNT(*) FROM hr_employees WHERE department_id = d.id AND deleted_at IS NULL) as employees_count
        FROM hr_departments d
        WHERE d.id = ? AND d.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getDepartmentById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo departamento
   */
  static async createDepartment(departmentData) {
    try {
      const {
        nombre,
        descripcion = null,
        is_active = true,
        created_by
      } = departmentData;

      // Insertar departamento
      const insertQuery = `
        INSERT INTO hr_departments (
          nombre, descripcion, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        nombre,
        descripcion,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        nombre
      };

    } catch (error) {
      logger.error('Error in createDepartment:', error);
      throw error;
    }
  }

  /**
   * Actualizar departamento
   */
  static async updateDepartment(id, departmentData) {
    try {
      const {
        nombre,
        descripcion,
        is_active,
        updated_by
      } = departmentData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM hr_departments WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Departamento no encontrado');
      }

      // Actualizar
      const updateQuery = `
        UPDATE hr_departments SET
          nombre = ?, descripcion = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        nombre,
        descripcion,
        is_active ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, nombre };

    } catch (error) {
      logger.error('Error in updateDepartment:', error);
      throw error;
    }
  }

  /**
   * Eliminar departamento (soft delete)
   */
  static async deleteDepartment(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM hr_departments WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Departamento no encontrado');
      }

      // Soft delete
      await db.execute(
        'UPDATE hr_departments SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteDepartment:', error);
      throw error;
    }
  }

  /**
   * Obtener departamentos activos
   */
  static async getActiveDepartments() {
    try {
      const query = `
        SELECT
          d.id,
          d.nombre,
          d.descripcion,
          d.is_active
        FROM hr_departments d
        WHERE d.is_active = 1 AND d.deleted_at IS NULL
        ORDER BY d.id ASC
      `;

      const departments = await db.execute(query);
      return departments;

    } catch (error) {
      logger.error('Error in getActiveDepartments:', error);
      throw error;
    }
  }
}

module.exports = DepartmentService;
