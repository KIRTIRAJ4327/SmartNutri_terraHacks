// Test Google Vision API Setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Google Vision API Setup...\n');

// Check environment variables
console.log('📋 Environment Check:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasProjectId = envContent.includes('GOOGLE_CLOUD_PROJECT_ID');
    const hasKeyPath = envContent.includes('GOOGLE_CLOUD_KEY_PATH');
    
    console.log(`${hasProjectId ? '✅' : '❌'} GOOGLE_CLOUD_PROJECT_ID configured`);
    console.log(`${hasKeyPath ? '✅' : '❌'} GOOGLE_CLOUD_KEY_PATH configured`);
} else {
    console.log('❌ .env file missing - run setup-env.ps1');
}

// Check Google Cloud key file
console.log('\n🔑 Google Cloud Key Check:');
const keyPath = path.join(__dirname, 'config', 'google-cloud-key.json');
if (fs.existsSync(keyPath)) {
    console.log('✅ google-cloud-key.json exists');
    try {
        const keyContent = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        console.log(`✅ Valid JSON format`);
        console.log(`✅ Project ID: ${keyContent.project_id || 'not found'}`);
        console.log(`✅ Type: ${keyContent.type || 'not found'}`);
    } catch (error) {
        console.log('❌ Invalid JSON format in key file');
    }
} else {
    console.log('❌ google-cloud-key.json missing');
    console.log('   Place your service account key at: config/google-cloud-key.json');
}

// Test Vision API connection (if key exists)
console.log('\n🧪 Vision API Connection Test:');
if (fs.existsSync(keyPath)) {
    try {
        // Load environment variables
        require('dotenv').config();
        
        const vision = require('@google-cloud/vision');
        const client = new vision.ImageAnnotatorClient({
            keyFilename: keyPath,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });
        
        console.log('✅ Vision client created successfully');
        console.log('🎉 Ready to process receipt images!');
        
    } catch (error) {
        console.log('❌ Vision API setup error:', error.message);
        console.log('   Check your credentials and project configuration');
    }
} else {
    console.log('⏸️  Skipping API test - key file not found');
}

console.log('\n📚 Setup Instructions:');
console.log('1. Run: ./setup-env.ps1 (to create .env file)');
console.log('2. Get Google Cloud service account key from:');
console.log('   https://console.cloud.google.com/iam-admin/serviceaccounts');
console.log('3. Place JSON key in: config/google-cloud-key.json');
console.log('4. Run: node test-vision-setup.js (to verify)');
console.log('5. Run: npm run dev (to start server)');

console.log('\n🚀 Once setup is complete, the OCR service will work perfectly!');