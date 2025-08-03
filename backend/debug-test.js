/**
 * Quick Debug Test Script
 * Tests each component individually to find where the problem is
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

async function runDiagnostics() {
    console.log('🔍 NUTRISCAN DIAGNOSTIC SUITE');
    console.log('=' * 50);
    
    // Test 1: Environment Check
    console.log('\n🧪 Test 1: Environment Check');
    try {
        const response = await axios.get(`${BASE_URL}/debug/test-environment`);
        console.log('✅ Environment Status:', response.data.results);
        
        if (response.data.results.errors.length > 0) {
            console.log('⚠️  Environment Issues:', response.data.results.errors);
        }
    } catch (error) {
        console.log('❌ Environment test failed:', error.message);
    }
    
    // Test 2: Known Data Test
    console.log('\n🧪 Test 2: Known Data Analysis');
    try {
        const response = await axios.get(`${BASE_URL}/debug/test-known-data`);
        console.log('✅ Known Data Results:');
        console.log('   Overall Score:', response.data.analysis.overallScore);
        console.log('   All Scores Same:', response.data.suspicious);
        
        if (response.data.suspicious) {
            console.log('🚨 PROBLEM FOUND: All scores identical - indicates mock data!');
        }
    } catch (error) {
        console.log('❌ Known data test failed:', error.message);
    }
    
    // Test 3: Text Parsing Test
    console.log('\n🧪 Test 3: Text Parsing');
    const testText = `METRO GROCERY STORE
123 MAIN ST, TORONTO ON
DATE: 2024-08-02 15:30

BANANAS ORGANIC        2.49
BREAD WHOLE WHEAT      3.99
MILK 2% 1L            4.29
COCA COLA 2L          2.99

SUBTOTAL             13.76
TAX                   1.79
TOTAL                15.55`;
    
    try {
        const response = await axios.post(`${BASE_URL}/debug/test-parsing-only`, {
            text: testText
        });
        console.log('✅ Parsing Results:');
        console.log('   Items Found:', response.data.itemsFound);
        console.log('   Items:', response.data.items.map(item => `${item.name} - $${item.price}`));
        
        if (response.data.itemsFound === 0) {
            console.log('🚨 PROBLEM FOUND: Parsing not working - no items extracted!');
        }
    } catch (error) {
        console.log('❌ Parsing test failed:', error.message);
    }
    
    // Test 4: Nutrition Analysis Test
    console.log('\n🧪 Test 4: Nutrition Analysis');
    const testItems = [
        { name: "COCA COLA", price: 2.99, confidence: 0.9 },
        { name: "BANANAS", price: 2.49, confidence: 0.9 },
        { name: "BREAD", price: 3.99, confidence: 0.9 }
    ];
    
    try {
        const response = await axios.post(`${BASE_URL}/debug/test-nutrition-only`, {
            items: testItems
        });
        console.log('✅ Nutrition Results:');
        console.log('   Overall Score:', response.data.analysis.overallScore);
        console.log('   Sodium Score:', response.data.analysis.sodiumScore);
        console.log('   Processing Score:', response.data.analysis.processingScore);
        console.log('   Sugar Score:', response.data.analysis.sugarScore);
        console.log('   Nutrient Score:', response.data.analysis.nutrientScore);
        
        // Check for identical scores
        const scores = [
            response.data.analysis.overallScore,
            response.data.analysis.sodiumScore,
            response.data.analysis.processingScore,
            response.data.analysis.sugarScore,
            response.data.analysis.nutrientScore
        ];
        const allSame = scores.every(score => score === scores[0]);
        
        if (allSame) {
            console.log('🚨 PROBLEM FOUND: All nutrition scores identical - mock data detected!');
        }
    } catch (error) {
        console.log('❌ Nutrition test failed:', error.message);
    }
    
    // Test 5: OCR Test (if we have a test image)
    console.log('\n🧪 Test 5: OCR Test');
    const testImagePath = './test-receipts/cord_receipt_001.jpg';
    
    if (fs.existsSync(testImagePath)) {
        try {
            const formData = new FormData();
            formData.append('image', fs.createReadStream(testImagePath));
            
            const response = await axios.post(`${BASE_URL}/debug/test-ocr-only`, formData, {
                headers: formData.getHeaders(),
                timeout: 30000
            });
            
            console.log('✅ OCR Results:');
            console.log('   Text Length:', response.data.textLength);
            console.log('   Preview:', response.data.preview.substring(0, 100) + '...');
            
            if (response.data.textLength === 0) {
                console.log('🚨 PROBLEM FOUND: OCR returning empty text!');
            }
        } catch (error) {
            console.log('❌ OCR test failed:', error.message);
            console.log('💡 This could be the root issue - OCR not working!');
        }
    } else {
        console.log('⚠️  No test image found at', testImagePath);
        console.log('💡 Download CORD dataset first to test OCR');
    }
    
    console.log('\n' + '=' * 50);
    console.log('🎯 DIAGNOSTIC SUMMARY');
    console.log('=' * 50);
    console.log('1. Check if all tests passed');
    console.log('2. Look for "PROBLEM FOUND" messages above');
    console.log('3. Focus on the first failing component');
    console.log('4. If OCR fails, check Google Cloud setup');
    console.log('5. If nutrition scores are identical, check for hardcoded values');
    console.log('\n💡 Next: Fix the first broken component before testing others');
}

// Run diagnostics
runDiagnostics().catch(console.error);