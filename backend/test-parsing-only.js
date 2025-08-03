#!/usr/bin/env node

/**
 * Test script for parsing logic only (no Google Cloud needed)
 */

const { OCRService } = require('./dist/services/ocrService.js');

console.log('🔧 Testing Receipt Parsing Logic (No Google Cloud)\n');

// Create mock OCR service that bypasses Google Cloud
class MockOCRService extends OCRService {
  constructor() {
    // Don't call super() to avoid Google Cloud initialization
    this.commonNonFoodKeywords = [
      'total', 'subtotal', 'tax', 'gst', 'hst', 'pst', 'visa', 'mastercard', 'debit',
      'cash', 'change', 'receipt', 'store', 'clerk', 'cashier', 'thank', 'come', 'again',
      'walmart', 'costco', 'loblaws', 'metro', 'sobeys', 'safeway', 'superstore', 'manager',
      'customer', 'service', 'phone', 'address', 'location', 'hours', 'website', 'email',
      'sous-total', 'taxe', 'tps', 'tvq', 'interac', 'approved', 'member', 'savings',
      'points', 'rewards', 'balance', 'invoice', 'term', 'transaction', 'operator'
    ];
  }
}

async function testParsingLogic() {
  console.log('📝 Testing parsing logic with Canadian grocery receipt...\n');
  
  const mockOCR = new MockOCRService();
  
  // Test the parsing with the Canadian receipt from your log
  const canadianReceiptText = `PANCHVATI SUPERMARKET
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
TOTAL $39.71`;

  try {
    const items = mockOCR.parseReceiptText(canadianReceiptText);
    
    console.log(`✅ Successfully parsed ${items.length} items:`);
    console.log('================================================');
    
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name.padEnd(25)} - $${item.price.toString().padStart(6)} (${(item.confidence * 100).toFixed(0)}%)`);
    });
    
    console.log('================================================\n');
    
    // Check for key improvements
    const drumstickFound = items.find(item => item.name.toLowerCase().includes('drumstick'));
    const tomatoFound = items.find(item => item.name.toLowerCase().includes('tomato'));
    const gingerFound = items.find(item => item.name.toLowerCase().includes('ginger'));
    const pumpkinFound = items.find(item => item.name.toLowerCase().includes('pumpkin'));
    const coconutFound = items.find(item => item.name.toLowerCase().includes('coconut'));
    const cauliflowerFound = items.find(item => item.name.toLowerCase().includes('cauliflower'));
    
    console.log('🎯 Key Product Detection:');
    console.log(`   Drumstick:    ${drumstickFound ? '✅ FOUND' : '❌ MISSING'} ${drumstickFound ? `($${drumstickFound.price})` : ''}`);
    console.log(`   Tomato Plun:  ${tomatoFound ? '✅ FOUND' : '❌ MISSING'} ${tomatoFound ? `($${tomatoFound.price})` : ''}`);
    console.log(`   Ginger:       ${gingerFound ? '✅ FOUND' : '❌ MISSING'} ${gingerFound ? `($${gingerFound.price})` : ''}`);
    console.log(`   Pumpkin:      ${pumpkinFound ? '✅ FOUND' : '❌ MISSING'} ${pumpkinFound ? `($${pumpkinFound.price})` : ''}`);
    console.log(`   Coconut:      ${coconutFound ? '✅ FOUND' : '❌ MISSING'} ${coconutFound ? `($${coconutFound.price})` : ''}`);
    console.log(`   Cauliflower:  ${cauliflowerFound ? '✅ FOUND' : '❌ MISSING'} ${cauliflowerFound ? `($${cauliflowerFound.price})` : ''}`);
    
    // Test the new date extraction
    console.log('\n📅 Date Extraction Test:');
    const dateResult = mockOCR.extractReceiptDate(canadianReceiptText);
    console.log(`   Date found: ${dateResult.date ? dateResult.date.toISOString().split('T')[0] : 'None'}`);
    console.log(`   Confidence: ${(dateResult.confidence * 100).toFixed(0)}%`);
    
    // Test store extraction
    console.log('\n🏪 Store Information Test:');
    const storeResult = mockOCR.extractStoreInfo(canadianReceiptText);
    console.log(`   Store: ${storeResult.storeName || 'Not found'}`);
    console.log(`   Location: ${storeResult.location || 'Not found'}`);
    console.log(`   Confidence: ${(storeResult.confidence * 100).toFixed(0)}%`);
    
    console.log('\n🎉 Parsing test completed successfully!');
    
    return {
      success: true,
      itemCount: items.length,
      keyItemsFound: {
        drumstick: !!drumstickFound,
        tomato: !!tomatoFound,
        ginger: !!gingerFound,
        pumpkin: !!pumpkinFound
      }
    };
    
  } catch (error) {
    console.error('❌ Parsing test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testParsingLogic().then(result => {
  if (result.success) {
    console.log(`\n✅ MVP Feature 1 (Smart Parsing): ${result.itemCount} items detected`);
    console.log(`   Key improvements working: ${Object.values(result.keyItemsFound).filter(Boolean).length}/4`);
  } else {
    console.log(`\n❌ MVP Feature 1 needs fixes: ${result.error}`);
  }
});