/**
 * Test Data for NutritionService
 * 
 * This file contains various test scenarios for validating
 * the NutritionService functionality.
 */

import { ReceiptItem } from '../types/receipt';

// Test case 1: Healthy shopping cart
export const healthyCart: ReceiptItem[] = [
  { name: "ORGANIC SPINACH", price: 3.99, confidence: 0.9 },
  { name: "WILD SALMON", price: 15.99, confidence: 0.9 },
  { name: "QUINOA", price: 5.99, confidence: 0.8 },
  { name: "BLUEBERRIES", price: 4.99, confidence: 0.9 },
  { name: "ALMONDS RAW", price: 8.99, confidence: 0.8 },
  { name: "AVOCADOS", price: 6.99, confidence: 0.9 },
  { name: "SWEET POTATOES", price: 2.99, confidence: 0.8 },
  { name: "OLIVE OIL EXTRA VIRGIN", price: 12.99, confidence: 0.9 }
];

// Test case 2: Unhealthy/processed shopping cart
export const unhealthyCart: ReceiptItem[] = [
  { name: "COCA COLA 2L", price: 2.99, confidence: 0.9 },
  { name: "FROZEN PIZZA", price: 6.99, confidence: 0.8 },
  { name: "POTATO CHIPS", price: 3.49, confidence: 0.8 },
  { name: "ENERGY DRINK", price: 3.49, confidence: 0.9 },
  { name: "INSTANT NOODLES", price: 0.99, confidence: 0.8 },
  { name: "CANDY BAR", price: 1.99, confidence: 0.9 },
  { name: "WHITE BREAD", price: 2.99, confidence: 0.8 },
  { name: "ICE CREAM", price: 5.99, confidence: 0.9 }
];

// Test case 3: Mixed cart (realistic scenario)
export const mixedCart: ReceiptItem[] = [
  { name: "BANANAS", price: 1.99, confidence: 0.9 },
  { name: "WHOLE WHEAT BREAD", price: 4.49, confidence: 0.8 },
  { name: "MILK 2%", price: 3.99, confidence: 0.9 },
  { name: "CHICKEN BREAST", price: 8.99, confidence: 0.9 },
  { name: "PASTA SAUCE", price: 2.49, confidence: 0.8 },
  { name: "GREEK YOGURT", price: 5.99, confidence: 0.9 },
  { name: "ORANGE JUICE", price: 4.99, confidence: 0.8 },
  { name: "FROZEN VEGETABLES", price: 3.49, confidence: 0.8 },
  { name: "CEREAL", price: 4.99, confidence: 0.7 },
  { name: "CHEESE SLICES", price: 4.49, confidence: 0.8 }
];

// Test case 4: High sodium foods
export const highSodiumCart: ReceiptItem[] = [
  { name: "DELI HAM", price: 6.99, confidence: 0.9 },
  { name: "CANNED SOUP", price: 2.49, confidence: 0.8 },
  { name: "PICKLES", price: 3.99, confidence: 0.8 },
  { name: "SOY SAUCE", price: 2.99, confidence: 0.9 },
  { name: "FROZEN DINNER", price: 4.99, confidence: 0.8 },
  { name: "SALTED NUTS", price: 5.99, confidence: 0.8 },
  { name: "BACON", price: 7.99, confidence: 0.9 },
  { name: "RAMEN NOODLES", price: 0.79, confidence: 0.8 }
];

// Test case 5: High sugar foods
export const highSugarCart: ReceiptItem[] = [
  { name: "ORANGE JUICE", price: 4.99, confidence: 0.8 },
  { name: "COOKIES", price: 3.99, confidence: 0.8 },
  { name: "CHOCOLATE BAR", price: 2.49, confidence: 0.9 },
  { name: "ENERGY DRINK", price: 3.49, confidence: 0.9 },
  { name: "FRUIT YOGURT", price: 4.99, confidence: 0.8 },
  { name: "GRANOLA BAR", price: 4.49, confidence: 0.8 },
  { name: "SODA 12 PACK", price: 5.99, confidence: 0.9 },
  { name: "CAKE MIX", price: 2.99, confidence: 0.7 }
];

// Test case 6: Nutrient-dense foods
export const nutrientDenseCart: ReceiptItem[] = [
  { name: "KALE", price: 2.99, confidence: 0.9 },
  { name: "SARDINES", price: 3.99, confidence: 0.8 },
  { name: "CHIA SEEDS", price: 8.99, confidence: 0.8 },
  { name: "LIVER", price: 5.99, confidence: 0.7 },
  { name: "BRUSSELS SPROUTS", price: 3.49, confidence: 0.8 },
  { name: "HEMP HEARTS", price: 12.99, confidence: 0.8 },
  { name: "NUTRITIONAL YEAST", price: 7.99, confidence: 0.7 },
  { name: "SEAWEED SNACKS", price: 4.99, confidence: 0.8 }
];

// Test case 7: Edge cases and unusual names
export const edgeCaseCart: ReceiptItem[] = [
  { name: "", price: 1.00, confidence: 0.0 },
  { name: "XXXXXXXXX", price: 2.00, confidence: 0.1 },
  { name: "123456789", price: 3.00, confidence: 0.2 },
  { name: "A", price: 4.00, confidence: 0.3 },
  { name: "VERY LONG PRODUCT NAME THAT GOES ON AND ON", price: 5.00, confidence: 0.8 },
  { name: "SPËCÎÅL CHÅRÅCTËRS", price: 6.00, confidence: 0.7 },
  { name: "Product With Numbers 123", price: 7.00, confidence: 0.8 },
  { name: "NORMAL ITEM", price: 8.00, confidence: 0.9 }
];

// Test case 8: Large cart for performance testing
export const largeCart: ReceiptItem[] = [];
const baseProducts = [
  "APPLES", "BANANAS", "ORANGES", "GRAPES", "STRAWBERRIES",
  "MILK", "CHEESE", "YOGURT", "BUTTER", "EGGS",
  "CHICKEN", "BEEF", "PORK", "FISH", "TURKEY",
  "BREAD", "RICE", "PASTA", "QUINOA", "OATS",
  "SPINACH", "CARROTS", "TOMATOES", "ONIONS", "PEPPERS"
];

// Generate 100 items for performance testing
for (let i = 0; i < 100; i++) {
  const product = baseProducts[i % baseProducts.length];
  largeCart.push({
    name: `${product} ${Math.floor(i / baseProducts.length) + 1}`,
    price: Math.round((Math.random() * 15 + 1) * 100) / 100,
    confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100
  });
}

// Expected results for validation
export const expectedResults = {
  healthyCart: {
    overallScore: { min: 80, max: 95 },
    sodiumScore: { min: 70, max: 100 },
    processingScore: { min: 80, max: 100 },
    sugarScore: { min: 70, max: 100 },
    nutrientScore: { min: 80, max: 100 }
  },
  unhealthyCart: {
    overallScore: { min: 10, max: 40 },
    sodiumScore: { min: 10, max: 50 },
    processingScore: { min: 0, max: 30 },
    sugarScore: { min: 0, max: 40 },
    nutrientScore: { min: 10, max: 40 }
  },
  mixedCart: {
    overallScore: { min: 40, max: 70 },
    sodiumScore: { min: 30, max: 80 },
    processingScore: { min: 40, max: 80 },
    sugarScore: { min: 40, max: 80 },
    nutrientScore: { min: 40, max: 70 }
  }
};

// Test scenarios with descriptions
export const testScenarios = [
  {
    name: "Healthy Shopping Cart",
    description: "All organic, whole foods with high nutrient density",
    items: healthyCart,
    expected: expectedResults.healthyCart
  },
  {
    name: "Unhealthy Shopping Cart",
    description: "Processed foods, high sugar, high sodium items",
    items: unhealthyCart,
    expected: expectedResults.unhealthyCart
  },
  {
    name: "Mixed Shopping Cart",
    description: "Realistic mix of healthy and less healthy items",
    items: mixedCart,
    expected: expectedResults.mixedCart
  },
  {
    name: "High Sodium Focus",
    description: "Foods specifically high in sodium content",
    items: highSodiumCart,
    expected: { sodiumScore: { min: 0, max: 30 } }
  },
  {
    name: "High Sugar Focus",
    description: "Foods specifically high in sugar content",
    items: highSugarCart,
    expected: { sugarScore: { min: 0, max: 40 } }
  },
  {
    name: "Nutrient Dense Foods",
    description: "Superfoods and nutrient-dense options",
    items: nutrientDenseCart,
    expected: { nutrientScore: { min: 80, max: 100 } }
  },
  {
    name: "Edge Cases",
    description: "Unusual product names and edge cases",
    items: edgeCaseCart,
    expected: { overallScore: { min: 20, max: 80 } }
  },
  {
    name: "Performance Test",
    description: "Large cart for performance validation",
    items: largeCart,
    expected: { processingTime: { max: 5000 } } // Should complete in under 5 seconds
  }
];

// Common product variations for testing cache
export const commonProducts = [
  "MILK", "BREAD", "EGGS", "BANANAS", "APPLES",
  "CHICKEN", "CHEESE", "YOGURT", "RICE", "PASTA"
];

// Generate test carts with repeated items to test caching
export function generateCacheTestCart(size: number): ReceiptItem[] {
  const cart: ReceiptItem[] = [];
  
  for (let i = 0; i < size; i++) {
    const product = commonProducts[i % commonProducts.length];
    cart.push({
      name: product,
      price: Math.round((Math.random() * 10 + 1) * 100) / 100,
      confidence: 0.8
    });
  }
  
  return cart;
}