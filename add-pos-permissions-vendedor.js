/**
 * Script para agregar permisos de POS al rol vendedor
 * Este script debe ejecutarse después de que el backend esté corriendo
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function addPOSPermissions() {
  try {
    console.log('🔐 Iniciando sesión como admin...');

    // Login como admin
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login exitoso');

    // Configurar headers con token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Permisos necesarios para POS Invoice
    const permissions = [
      'billing.access',
      'billing.invoices.view',
      'billing.invoices.create',
      'billing.invoices.print',
      'billing.payments.record',
      'pending_invoices.view',
      'pending_invoices.create',
      'pending_invoices.update',
      'pending_invoices.delete',
      'quotes.view',
      'quotes.create',
      'quotes.update',
      'sales.view',
      'sales.create',
      'sales_returns.view',
      'sales_returns.create',
      'coupons.view',
      'offers.view'
    ];

    console.log('\n📋 Permisos a agregar:', permissions);

    // Obtener todos los roles
    const rolesResponse = await axios.get(`${API_URL}/roles`, { headers });
    const roles = rolesResponse.data.data;

    // Buscar roles de vendedor
    const vendedorRoles = roles.filter(r =>
      ['vendedor', 'cashier', 'cajero'].includes(r.role_name.toLowerCase())
    );

    if (vendedorRoles.length === 0) {
      console.log('⚠️ No se encontraron roles de vendedor');
      return;
    }

    console.log('\n🔍 Roles de vendedor encontrados:', vendedorRoles.map(r => r.role_name));

    for (const role of vendedorRoles) {
      console.log(`\n📝 Procesando rol: ${role.role_name} (ID: ${role.id})`);

      // Obtener permisos actuales del rol
      const currentPermsResponse = await axios.get(`${API_URL}/roles/${role.id}`, { headers });
      const currentPermissions = currentPermsResponse.data.data.permissions || [];

      console.log(`   Permisos actuales: ${currentPermissions.length}`);

      // Combinar permisos actuales con los nuevos (evitar duplicados)
      const allPermissions = [...new Set([...currentPermissions, ...permissions])];

      console.log(`   Total después de agregar: ${allPermissions.length}`);

      // Actualizar rol con todos los permisos
      await axios.put(`${API_URL}/roles/${role.id}`, {
        role_name: role.role_name,
        permissions: allPermissions
      }, { headers });

      console.log(`   ✅ Permisos actualizados correctamente`);
    }

    console.log('\n✅ ¡Proceso completado! Todos los permisos de POS han sido agregados al vendedor');
    console.log('\n⚠️ IMPORTANTE: Cierra sesión y vuelve a iniciar sesión para aplicar los cambios');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n⚠️ Error de autenticación. Verifica las credenciales de admin');
    }
  }
}

// Ejecutar
addPOSPermissions();
