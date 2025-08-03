/**
 * Batch Receipt Processing Script
 * Place receipt images in ./test-receipts/ folder and run this script
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const RECEIPTS_DIR = './test-receipts';
const API_URL = 'http://localhost:5000/api/receipt/analyze';

async function processReceipt(filePath) {
    try {
        const fileName = path.basename(filePath);
        console.log(`\n🔍 Processing: ${fileName}`);
        
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));
        
        const response = await axios.post(API_URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000,
        });
        
        const { analysis, receipt } = response.data;
        
        console.log(`✅ Success: ${fileName}`);
        console.log(`   Health Score: ${analysis.overallScore}/100`);
        console.log(`   Items Found: ${receipt.items.length}`);
        console.log(`   Processing Time: ${response.data.processingTime}ms`);
        
        return {
            fileName,
            success: true,
            healthScore: analysis.overallScore,
            itemsCount: receipt.items.length,
            processingTime: response.data.processingTime,
            items: receipt.items.map(item => item.name),
        };
        
    } catch (error) {
        console.log(`❌ Failed: ${path.basename(filePath)}`);
        console.log(`   Error: ${error.message}`);
        
        return {
            fileName: path.basename(filePath),
            success: false,
            error: error.message,
        };
    }
}

async function batchProcessReceipts() {
    console.log('🚀 Starting batch receipt processing...\n');
    
    // Check if receipts directory exists
    if (!fs.existsSync(RECEIPTS_DIR)) {
        console.log(`❌ Directory ${RECEIPTS_DIR} not found. Please create it and add receipt images.`);
        return;
    }
    
    // Get all image files
    const files = fs.readdirSync(RECEIPTS_DIR)
        .filter(file => /\.(jpg|jpeg|png|bmp|gif|webp|tiff)$/i.test(file))
        .map(file => path.join(RECEIPTS_DIR, file));
    
    if (files.length === 0) {
        console.log(`📂 No image files found in ${RECEIPTS_DIR}`);
        console.log('   Supported formats: JPG, JPEG, PNG, BMP, GIF, WEBP, TIFF');
        return;
    }
    
    console.log(`📄 Found ${files.length} receipt image(s) to process\n`);
    
    const results = [];
    
    // Process each receipt
    for (const filePath of files) {
        const result = await processReceipt(filePath);
        results.push(result);
        
        // Add delay between requests to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH PROCESSING SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
    
    if (successful.length > 0) {
        const avgScore = (successful.reduce((sum, r) => sum + r.healthScore, 0) / successful.length).toFixed(1);
        const avgItems = (successful.reduce((sum, r) => sum + r.itemsCount, 0) / successful.length).toFixed(1);
        const avgTime = (successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length).toFixed(0);
        
        console.log(`\n📊 Averages:`);
        console.log(`   Health Score: ${avgScore}/100`);
        console.log(`   Items per Receipt: ${avgItems}`);
        console.log(`   Processing Time: ${avgTime}ms`);
    }
    
    // Save detailed results to JSON
    const resultsFile = `batch-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
    
    console.log('\n🎉 Batch processing completed!');
}

// Run the batch processor
batchProcessReceipts().catch(console.error);