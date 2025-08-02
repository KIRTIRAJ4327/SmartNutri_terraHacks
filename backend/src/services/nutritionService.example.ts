/**
 * NutritionService Usage Examples
 * 
 * This file demonstrates how to use the NutritionService for comprehensive
 * nutrition analysis including sodium, processing, sugar impact, and nutrient power.
 */

import { NutritionService } from './nutritionService';
import { ReceiptItem } from '../types/receipt';

// Example usage
async function basicAnalysisExample() {
  const nutritionService = new NutritionService();
  
  // Sample receipt items
  const receiptItems: ReceiptItem[] = [
    { name: "ORGANIC SPINACH", price: 3.99, confidence: 0.9 },
    { name: "WHOLE WHEAT BREAD", price: 4.49, confidence: 0.8 },
    { name: "COCA COLA", price: 2.99, confidence: 0.9 },
    { name: "SALMON FILLET", price: 12.99, confidence: 0.9 },
    { name: "POTATO CHIPS", price: 3.49, confidence: 0.8 }
  ];

  try {
    console.log('🔍 Analyzing nutrition for receipt items...\n');
    
    const analysis = await nutritionService.analyzeProducts(receiptItems);
    
    console.log('📊 NUTRITION ANALYSIS RESULTS');
    console.log('================================');
    console.log(`Overall Health Score: ${analysis.overallScore}/100`);
    console.log(`Sodium Score: ${analysis.sodiumScore}/100 (avg: ${analysis.averageSodium}mg)`);
    console.log(`Processing Score: ${analysis.processingScore}/100 (${analysis.ultraProcessedPercent}% ultra-processed)`);
    console.log(`Sugar Score: ${analysis.sugarScore}/100 (${analysis.totalSugarIntake}g total, ${analysis.addedSugarPercent}% with added sugars)`);
    console.log(`Nutrient Score: ${analysis.nutrientScore}/100`);
    console.log(`\nProcessing Time: ${analysis.processingTime}ms`);
    console.log(`Cache Hit Rate: ${(analysis.cacheHitRate * 100).toFixed(1)}%`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    if (analysis.nutrientGaps.length > 0) {
      console.log('\n⚠️  POTENTIAL NUTRIENT GAPS:');
      analysis.nutrientGaps.forEach((gap, index) => {
        console.log(`${index + 1}. ${gap}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Advanced usage with cache management
async function advancedAnalysisExample() {
  const nutritionService = new NutritionService();
  
  console.log('🚀 Advanced Nutrition Analysis Example\n');
  
  // First analysis - will populate cache
  const healthyItems: ReceiptItem[] = [
    { name: "ORGANIC KALE", price: 2.99, confidence: 0.9 },
    { name: "WILD SALMON", price: 15.99, confidence: 0.9 },
    { name: "QUINOA", price: 5.99, confidence: 0.8 },
    { name: "BLUEBERRIES", price: 4.99, confidence: 0.9 },
    { name: "ALMONDS", price: 8.99, confidence: 0.8 }
  ];
  
  console.log('📈 Analyzing healthy shopping cart...');
  const healthyAnalysis = await nutritionService.analyzeProducts(healthyItems);
  console.log(`Healthy cart score: ${healthyAnalysis.overallScore}/100`);
  
  // Second analysis - will use cache for some items
  const mixedItems: ReceiptItem[] = [
    { name: "ORGANIC KALE", price: 2.99, confidence: 0.9 }, // Should hit cache
    { name: "FROZEN PIZZA", price: 6.99, confidence: 0.8 },
    { name: "ENERGY DRINK", price: 3.49, confidence: 0.9 },
    { name: "WHITE BREAD", price: 2.99, confidence: 0.8 },
    { name: "ICE CREAM", price: 5.99, confidence: 0.9 }
  ];
  
  console.log('\n📉 Analyzing mixed shopping cart...');
  const mixedAnalysis = await nutritionService.analyzeProducts(mixedItems);
  console.log(`Mixed cart score: ${mixedAnalysis.overallScore}/100`);
  console.log(`Cache hit rate: ${(mixedAnalysis.cacheHitRate * 100).toFixed(1)}%`);
  
  // Show cache statistics
  const cacheStats = nutritionService.getCacheStats();
  console.log(`\n📊 Cache Statistics:`);
  console.log(`Cache size: ${cacheStats.size} items`);
  console.log(`Overall hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
  
  // Compare the two shopping patterns
  console.log('\n🔄 COMPARISON:');
  console.log(`Healthy vs Mixed score difference: ${healthyAnalysis.overallScore - mixedAnalysis.overallScore} points`);
  console.log(`Sodium difference: ${mixedAnalysis.averageSodium - healthyAnalysis.averageSodium}mg`);
  console.log(`Sugar difference: ${mixedAnalysis.totalSugarIntake - healthyAnalysis.totalSugarIntake}g`);
}

// Error handling examples
async function errorHandlingExample() {
  const nutritionService = new NutritionService();
  
  console.log('🔧 Testing error handling scenarios...\n');
  
  // Test with empty items
  try {
    await nutritionService.analyzeProducts([]);
  } catch (error) {
    console.log('✅ Empty items handled gracefully');
  }
  
  // Test with unusual product names
  const weirdItems: ReceiptItem[] = [
    { name: "XXXXXXXXX", price: 1.00, confidence: 0.1 },
    { name: "123456", price: 2.00, confidence: 0.2 },
    { name: "", price: 3.00, confidence: 0.0 }
  ];
  
  try {
    const weirdAnalysis = await nutritionService.analyzeProducts(weirdItems);
    console.log('✅ Unusual product names handled gracefully');
    console.log(`Score for weird items: ${weirdAnalysis.overallScore}/100`);
  } catch (error) {
    console.log('❌ Failed to handle unusual items:', error.message);
  }
}

// Performance testing
async function performanceExample() {
  const nutritionService = new NutritionService();
  
  console.log('⚡ Performance Testing...\n');
  
  // Generate large list of items
  const largeItemList: ReceiptItem[] = [];
  const productNames = [
    "BANANAS", "APPLES", "MILK", "BREAD", "CHICKEN", "RICE", "PASTA", "CHEESE",
    "YOGURT", "EGGS", "CARROTS", "SPINACH", "SALMON", "TUNA", "QUINOA", "OATS",
    "ALMONDS", "OLIVE OIL", "TOMATOES", "ONIONS", "BELL PEPPERS", "BROCCOLI",
    "AVOCADOS", "SWEET POTATOES", "BLACK BEANS", "LENTILS", "BROWN RICE", "KALE"
  ];
  
  for (let i = 0; i < 50; i++) {
    const randomProduct = productNames[Math.floor(Math.random() * productNames.length)];
    largeItemList.push({
      name: randomProduct,
      price: Math.round((Math.random() * 10 + 1) * 100) / 100,
      confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100
    });
  }
  
  const startTime = Date.now();
  const analysis = await nutritionService.analyzeProducts(largeItemList);
  const endTime = Date.now();
  
  console.log(`📊 Analyzed ${largeItemList.length} items in ${endTime - startTime}ms`);
  console.log(`Average time per item: ${((endTime - startTime) / largeItemList.length).toFixed(2)}ms`);
  console.log(`Cache hit rate: ${(analysis.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`Overall score: ${analysis.overallScore}/100`);
}

// Score interpretation guide
function scoreInterpretationGuide() {
  console.log('📖 SCORE INTERPRETATION GUIDE');
  console.log('==============================\n');
  
  console.log('🎯 OVERALL SCORE (0-100):');
  console.log('  90-100: Excellent - Very healthy choices');
  console.log('  70-89:  Good - Mostly healthy with room for improvement');
  console.log('  50-69:  Fair - Mixed bag, significant improvements needed');
  console.log('  30-49:  Poor - Many unhealthy choices');
  console.log('  0-29:   Very Poor - Mostly unhealthy foods\n');
  
  console.log('🧂 SODIUM SCORE (0-100):');
  console.log('  90-100: Low sodium (≤200mg avg)');
  console.log('  60-89:  Moderate sodium (201-600mg avg)');
  console.log('  30-59:  High sodium (601-1000mg avg)');
  console.log('  0-29:   Very high sodium (>1000mg avg)\n');
  
  console.log('🍭 SUGAR SCORE (0-100):');
  console.log('  90-100: Very low sugar, no added sugars');
  console.log('  70-89:  Low to moderate natural sugars');
  console.log('  50-69:  Moderate sugar with some added sugars');
  console.log('  30-49:  High sugar content');
  console.log('  0-29:   Very high sugar, many added sugars\n');
  
  console.log('💪 NUTRIENT SCORE (0-100):');
  console.log('  80-100: Excellent nutrient density');
  console.log('  60-79:  Good nutrient content');
  console.log('  40-59:  Moderate nutrients');
  console.log('  20-39:  Low nutrient density');
  console.log('  0-19:   Very poor nutrient content\n');
  
  console.log('🔬 PROCESSING SCORE (0-100):');
  console.log('  90-100: Mostly whole, unprocessed foods');
  console.log('  70-89:  Some minimally processed foods');
  console.log('  50-69:  Mix of processed and unprocessed');
  console.log('  30-49:  Many processed foods');
  console.log('  0-29:   Mostly ultra-processed foods');
}

// Export examples for use
export {
  basicAnalysisExample,
  advancedAnalysisExample,
  errorHandlingExample,
  performanceExample,
  scoreInterpretationGuide
};

// Run examples if this file is executed directly
if (require.main === module) {
  async function runAllExamples() {
    await basicAnalysisExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await advancedAnalysisExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await errorHandlingExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await performanceExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    scoreInterpretationGuide();
  }
  
  runAllExamples().catch(console.error);
}