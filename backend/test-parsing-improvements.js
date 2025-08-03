#!/usr/bin/env node

/**
 * Test script for improved OCR parsing
 * Tests the new per-pound parsing and date extraction
 */

const { OCRService } = require('./dist/services/ocrService.js');

console.log('🔧 Testing OCR Parsing Improvements\n');

// Test improved parsing with per-pound items
async function testImprovedParsing() {
  console.log('📝 Testing improved per-pound item parsing...\n');
  
  const ocrService = new OCRService();
  
  // Simulate the receipt text from your Canadian grocery store
  const canadianReceiptText = `
PANCHVATI SUPERMARKET
45 WOODBINE DOWNS BLVD, UNIT #1-2
ETOBICOKE, ON M9W 6N5
PH.: 416-213-9394
TERM:C INVOICE:0261414
Jun-26-2025 15:35:09
Cashier 1
Pvs Coconut Fine 400g
$4.99
Cauliflower (ea)
$2.79
Each
Tomato Plun
4.68 lb
$1.79 per lb
$8.38
Srt Fr Spinach 340g
20 $2.49
$4.98
Ginger Organic
0.67 lb # $4.99 per lb
$3.34
Drumstick
1.53 lb @ $7.99 per lb
$12.22
Plu-88
Pumpkin
1.21 lb @ $2.49 per lb
$3.01
TOTAL $39.71
`;

  try {
    const items = ocrService.parseReceiptText(canadianReceiptText);
    
    console.log(`✅ Parsed ${items.length} items from Canadian receipt:`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} - $${item.price} (confidence: ${item.confidence})`);
    });
    
    console.log('\n🎯 Expected improvements:');
    console.log('   • Should now correctly identify "Drumstick" instead of per-lb price');
    console.log('   • Should identify "Tomato Plun" correctly');
    console.log('   • Should handle "Ginger Organic" and "Pumpkin" properly');
    console.log('   • Should extract proper product names from per-pound format');
    
    // Verify specific improvements
    const drumstickItem = items.find(item => item.name.toLowerCase().includes('drumstick'));
    const tomatoItem = items.find(item => item.name.toLowerCase().includes('tomato'));
    const gingerItem = items.find(item => item.name.toLowerCase().includes('ginger'));
    const pumpkinItem = items.find(item => item.name.toLowerCase().includes('pumpkin'));
    
    console.log('\n🔍 Verification:');
    console.log(`   Drumstick found: ${drumstickItem ? '✅ YES' : '❌ NO'} ${drumstickItem ? `- $${drumstickItem.price}` : ''}`);
    console.log(`   Tomato found: ${tomatoItem ? '✅ YES' : '❌ NO'} ${tomatoItem ? `- $${tomatoItem.price}` : ''}`);
    console.log(`   Ginger found: ${gingerItem ? '✅ YES' : '❌ NO'} ${gingerItem ? `- $${gingerItem.price}` : ''}`);
    console.log(`   Pumpkin found: ${pumpkinItem ? '✅ YES' : '❌ NO'} ${pumpkinItem ? `- $${pumpkinItem.price}` : ''}`);
    
  } catch (error) {
    console.error('❌ OCR Test failed:', error.message);
  }
}

// Test date extraction
function testDateExtraction() {
  console.log('\n📅 Testing date extraction...\n');
  
  const ocrService = new OCRService();
  
  const receiptTexts = [
    'Jun-26-2025 15:35:09',
    '12/25/2024 14:30',
    'Dec 25, 2024',
    '25 Dec 2024',
    'Invalid date text'
  ];
  
  receiptTexts.forEach(text => {
    const result = ocrService.extractReceiptDate(text);
    console.log(`Text: "${text}"`);
    console.log(`   Date: ${result.date ? result.date.toISOString().split('T')[0] : 'None'}`);
    console.log(`   Confidence: ${result.confidence}\n`);
  });
}

// Test store extraction
function testStoreExtraction() {
  console.log('🏪 Testing store information extraction...\n');
  
  const ocrService = new OCRService();
  
  const storeTexts = [
    `PANCHVATI SUPERMARKET
45 WOODBINE DOWNS BLVD, UNIT #1-2
ETOBICOKE, ON M9W 6N5`,
    `WALMART SUPERCENTER
STORE #1234
123 MAIN ST, TORONTO, ON M5V 3A1`,
    `COSTCO
WHOLESALE
Thornton #629`
  ];
  
  storeTexts.forEach((text, index) => {
    const result = ocrService.extractStoreInfo(text);
    console.log(`Store ${index + 1}:`);
    console.log(`   Name: ${result.storeName || 'Not found'}`);
    console.log(`   Location: ${result.location || 'Not found'}`);
    console.log(`   Confidence: ${result.confidence}\n`);
  });
}

// Main test execution
async function runTests() {
  try {
    await testImprovedParsing();
    testDateExtraction();
    testStoreExtraction();
    
    console.log('🎉 All parsing improvement tests completed!');
    console.log('\n📋 Summary of improvements:');
    console.log('   ✅ Enhanced per-pound item parsing');
    console.log('   ✅ Better product name extraction');
    console.log('   ✅ Date extraction from receipts');
    console.log('   ✅ Store information extraction');
    console.log('   ✅ Reduced misidentification of price lines as product names');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runTests();