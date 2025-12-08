const axios = require('axios');

// Test the suppliers endpoint
async function testSuppliersEndpoint() {
  try {
    console.log('🔍 Testing suppliers endpoint...\n');

    const response = await axios.get('http://localhost:3000/api/v1/suppliers', {
      params: {
        limit: 10000
      },
      headers: {
        'Authorization': 'Bearer test-token' // Replace with actual token if needed
      }
    });

    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data Structure:', {
      hasData: !!response.data,
      hasDataProperty: !!response.data.data,
      dataType: typeof response.data.data,
      isArray: Array.isArray(response.data.data)
    });

    if (response.data && response.data.data) {
      const suppliers = response.data.data;
      console.log('\n📈 Suppliers Count:', suppliers.length);

      if (suppliers.length > 0) {
        console.log('\n👤 First Supplier:');
        console.log(JSON.stringify(suppliers[0], null, 2));

        console.log('\n📋 All Suppliers:');
        suppliers.forEach((s, index) => {
          console.log(`  ${index + 1}. ${s.nombre || s.name} - RTN: ${s.doc_identificacion || 'N/A'}`);
        });
      } else {
        console.log('\n⚠️  No suppliers found in database');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testSuppliersEndpoint();
