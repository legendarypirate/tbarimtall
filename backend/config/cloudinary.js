const cloudinary = require('cloudinary').v2;
const path = require('path');

// Load .env file from backend directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Validate that all required environment variables are present
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary configuration error: Missing required environment variables');
  console.error('Required variables:');
  console.error('  - CLOUDINARY_CLOUD_NAME:', cloudName ? '✅' : '❌');
  console.error('  - CLOUDINARY_API_KEY:', apiKey ? '✅' : '❌');
  console.error('  - CLOUDINARY_API_SECRET:', apiSecret ? '✅' : '❌');
  console.error('\nPlease add these to your .env file in the backend directory.');
  throw new Error('Cloudinary configuration is incomplete. Please check your .env file.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('✅ Cloudinary configured successfully');

module.exports = cloudinary;

