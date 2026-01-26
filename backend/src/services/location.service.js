const db = require('../utils/database');

/**
 * Servicio para gestionar departamentos (states) y municipios (cities)
 */
class LocationService {
  /**
   * Obtener todos los departamentos activos
   */
  async getStates() {
    const query = `
      SELECT
        id,
        nombre as name
      FROM states
      WHERE is_active = 1
        AND deleted_at IS NULL
      ORDER BY nombre ASC
    `;

    const states = await db.query(query);
    return states;
  }

  /**
   * Obtener municipios por departamento
   */
  async getCitiesByState(stateId) {
    const query = `
      SELECT
        id,
        nombre as name,
        state_id
      FROM cities
      WHERE state_id = ?
        AND is_active = 1
        AND deleted_at IS NULL
      ORDER BY nombre ASC
    `;

    const cities = await db.query(query, [stateId]);
    return cities;
  }

  /**
   * Obtener todos los municipios activos (opcional)
   */
  async getAllCities() {
    const query = `
      SELECT
        c.id,
        c.nombre as name,
        c.state_id,
        s.nombre as state_name
      FROM cities c
      INNER JOIN states s ON c.state_id = s.id
      WHERE c.is_active = 1
        AND c.deleted_at IS NULL
        AND s.is_active = 1
        AND s.deleted_at IS NULL
      ORDER BY s.nombre ASC, c.nombre ASC
    `;

    const cities = await db.query(query);
    return cities;
  }
}

module.exports = new LocationService();
