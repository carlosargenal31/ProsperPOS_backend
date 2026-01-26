const locationService = require('./src/services/location.service');

async function test() {
  try {
    console.log('Testing getStates...');
    const states = await locationService.getStates();
    console.log('States result:', states);
    console.log('Number of states:', states.length);
    console.log('First 3 states:', states.slice(0, 3));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

test();
