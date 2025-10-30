// Simple test script to verify the project setup
const express = require('express');
const CacheService = require('./cache-service');

console.log('✅ Express loaded successfully');
console.log('✅ Cache service loaded successfully');

// Test cache functionality
CacheService.set('test-key', { message: 'Hello, SayCheese!' }, 60);
const cachedData = CacheService.getOrFetch('test-key', () => Promise.resolve({ message: 'Fresh data' }), 60);

cachedData.then(data => {
  console.log('✅ Cache test successful:', data);
  console.log('🎉 Project setup complete! Ready to start development.');
  
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Add your YouTube API key and Twitter Bearer Token');
  console.log('3. Run "npm run dev" to start development server');
  console.log('4. Test the API at http://localhost:3000/api/trending');
});
