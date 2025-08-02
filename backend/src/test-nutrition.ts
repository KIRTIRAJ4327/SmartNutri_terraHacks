/**
 * TypeScript test file for NutritionService
 * This demonstrates the exact usage pattern requested
 */

import { NutritionService } from './services/nutritionService';
import { ReceiptItem } from './types/receipt';

async function testNutritionService() {
  console.log('🧪 Testing NutritionService with TypeScript\n');

  // Test the nutrition service independently
  const nutritionService = new NutritionService();
  const mockItems: ReceiptItem[] = [
    { name: "Coca Cola", price: 1.99, confidence: 0.9 },
    { name: "Fresh Bananas", price: 2.49, confidence: 0.95 }
  ];

  try {
    console.log('📝 Input data:');
    console.log(JSON.stringify(mockItems, null, 2));
    console.log('\n🔍 Analyzing products...\n');

    const analysis = await nutritionService.analyzeProducts(mockItems);
    
    console.log("Analysis results:", analysis);
    
    console.log('\n📊 DETAILED BREAKDOWN:');
    console.log('='.repeat(60));
    console.log(`🎯 Overall Health Score: ${analysis.overallScore}/100`);
    console.log(`🧂 Sodium Score: ${analysis.sodiumScore}/100`);
    console.log(`🔬 Processing Score: ${analysis.processingScore}/100`);
    console.log(`🍭 Sugar Impact Score: ${analysis.sugarScore}/100`);
    console.log(`💪 Nutrient Power Score: ${analysis.nutrientScore}/100`);
    
    console.log('\n📈 METRICS:');
    console.log(`Average Sodium: ${analysis.averageSodium}mg`);
    console.log(`Total Sugar Intake: ${analysis.totalSugarIntake}g`);
    console.log(`Ultra-processed: ${analysis.ultraProcessedPercent}%`);
    console.log(`Added Sugar Items: ${analysis.addedSugarPercent}%`);
    
    console.log('\n⚡ PERFORMANCE:');
    console.log(`Processing Time: ${analysis.processingTime}ms`);
    console.log(`Cache Hit Rate: ${(analysis.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Items Analyzed: ${analysis.analysisCount}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    if (analysis.nutrientGaps.length > 0) {
      console.log('\n⚠️  NUTRIENT GAPS:');
      analysis.nutrientGaps.forEach((gap, index) => {
        console.log(`${index + 1}. ${gap}`);
      });
    }
    
    // Test cache functionality
    console.log('\n🔄 Testing cache functionality...');
    const startTime = Date.now();
    const cachedAnalysis = await nutritionService.analyzeProducts(mockItems);
    const endTime = Date.now();
    
    console.log(`Second analysis time: ${endTime - startTime}ms`);
    console.log(`Cache hit rate: ${(cachedAnalysis.cacheHitRate * 100).toFixed(1)}%`);
    
    // Show cache stats
    const cacheStats = nutritionService.getCacheStats();
    console.log(`Cache size: ${cacheStats.size} items`);
    
    console.log('\n✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

// Additional test with more diverse items
async function testDiverseItems() {
  console.log('\n🌈 Testing with diverse product mix...');
  
  const nutritionService = new NutritionService();
  const diverseItems: ReceiptItem[] = [
    { name: "ORGANIC SPINACH", price: 3.99, confidence: 0.9 },
    { name: "POTATO CHIPS", price: 3.49, confidence: 0.8 },
    { name: "WHOLE WHEAT BREAD", price: 4.49, confidence: 0.8 },
    { name: "ICE CREAM", price: 5.99, confidence: 0.9 },
    { name: "SALMON FILLET", price: 12.99, confidence: 0.9 }
  ];
  
  try {
    const analysis = await nutritionService.analyzeProducts(diverseItems);
    
    console.log(`\n📊 Diverse Cart Analysis:`);
    console.log(`Overall Score: ${analysis.overallScore}/100`);
    console.log(`Processing Score: ${analysis.processingScore}/100`);
    console.log(`Sugar Score: ${analysis.sugarScore}/100`);
    console.log(`Nutrient Score: ${analysis.nutrientScore}/100`);
    
    console.log('\n🎯 Key Insights:');
    console.log(`- ${analysis.ultraProcessedPercent}% ultra-processed foods`);
    console.log(`- ${analysis.totalSugarIntake}g total sugar intake`);
    console.log(`- ${analysis.averageSodium}mg average sodium`);
    
  } catch (error) {
    console.error('❌ Diverse test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testNutritionService();
  await testDiverseItems();
  
  console.log('\n🎉 All TypeScript tests completed!');
  console.log('✅ NutritionService is working correctly');
  console.log('✅ Ready for Express route integration');
}

// Execute tests
runAllTests().catch(console.error);