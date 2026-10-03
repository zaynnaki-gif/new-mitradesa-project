const fs = require('fs');

async function checkApiHealth() {
  console.log('Testing Backend API Health...');
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error(`API health check failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success === true && data.data.status === 'healthy') {
      console.log('✅ API is healthy and running.');
    } else {
      console.log('API Response:', data);
      throw new Error('API returned unhealthy status');
    }
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    return false;
  }
  return true;
}

async function checkFrontendBuild() {
  console.log('Testing Frontend Production Build...');
  try {
    // Read the index.html from dist folder to ensure it was built correctly
    const indexHtml = fs.readFileSync('apps/web/dist/index.html', 'utf-8');
    if (indexHtml.includes('<div id="root"></div>') && indexHtml.includes('<!DOCTYPE html>')) {
      console.log('✅ Frontend production build is valid.');
    } else {
      throw new Error('Frontend build is missing root element or doctype.');
    }
  } catch (error) {
    console.error('❌ Frontend Build Check Failed:', error.message);
    return false;
  }
  return true;
}

async function runTests() {
  console.log('Starting Production Verification...\n');
  const isApiHealthy = await checkApiHealth();
  const isFrontendValid = await checkFrontendBuild();

  console.log('\n--- Final Verification Summary ---');
  if (isApiHealthy && isFrontendValid) {
    console.log('Semua sistem produksi sehat dan berjalan baik');
  } else {
    console.log('Terdapat kegagalan pada proses verifikasi sistem.');
  }
}

runTests();
