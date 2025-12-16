/**
 * Obtiene la fecha y hora actual en zona horaria local del servidor
 * Retorna en formato MySQL compatible: 'YYYY-MM-DD HH:MM:SS'
 * @returns {string} Fecha formateada para MySQL
 */
function getHondurasDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Convierte una fecha a formato MySQL
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha formateada para MySQL en zona horaria local
 */
function toHondurasDateTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  getHondurasDateTime,
  toHondurasDateTime
};
