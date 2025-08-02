import axios from 'axios';
import { ReceiptItem } from '../types/receipt';
import {
  NutritionAnalysis,
  ProductAnalysis,
  OpenFoodFactsProduct,
  OpenFoodFactsResponse,
  ProductCategory,
  NutritionCache,
  RecommendationRule,
  NutrientProfile
} from '../types/nutrition';

export class NutritionService {
  private openFoodFactsAPI = 'https://world.openfoodfacts.org/api/v0';
  private foodDataCentralAPI = 'https://api.nal.usda.gov/fdc/v1';
  private cache: NutritionCache = {};
  private cacheExpiryHours = 24; // Cache for 24 hours
  private requestCount = 0;
  private cacheHits = 0;

  constructor() {
    // Initialize with some common product estimations
    this.initializeCache();
  }

  async analyzeProducts(items: ReceiptItem[]): Promise<NutritionAnalysis> {
    const startTime = Date.now();
    this.requestCount = 0;
    this.cacheHits = 0;

    const productAnalyses = await Promise.all(
      items.map(item => this.analyzeProduct(item))
    );

    const analysis = this.calculateOverallScore(productAnalyses);
    analysis.processingTime = Date.now() - startTime;
    analysis.cacheHitRate = this.requestCount > 0 ? this.cacheHits / this.requestCount : 0;

    return analysis;
  }

  private async analyzeProduct(item: ReceiptItem): Promise<ProductAnalysis> {
    try {
      // Check cache first
      const cached = this.getCachedAnalysis(item.name);
      if (cached) {
        this.cacheHits++;
        return cached;
      }

      this.requestCount++;

      // Try Open Food Facts API
      const nutritionData = await this.searchOpenFoodFacts(item.name);
      
      if (nutritionData) {
        const analysis = this.createAnalysisFromAPI(item.name, nutritionData);
        this.cacheAnalysis(item.name, analysis, 'api');
        return analysis;
      }
      
      // Fallback to intelligent estimation
      const estimation = this.createEstimatedAnalysis(item.name);
      this.cacheAnalysis(item.name, estimation, 'estimation');
      return estimation;
      
    } catch (error) {
      console.error(`Error analyzing ${item.name}:`, error);
      return this.getDefaultAnalysis(item.name);
    }
  }

  private async searchOpenFoodFacts(productName: string): Promise<OpenFoodFactsProduct | null> {
    try {
      const searchUrl = `${this.openFoodFactsAPI}/search`;
      const params = {
        search_terms: productName,
        json: 1,
        page_size: 5,
        fields: 'product_name,nutrition_grade_fr,nova_group,nutriments,ingredients_text,categories,additives_tags,nutrient_levels'
      };

      const response = await axios.get<OpenFoodFactsResponse>(searchUrl, { 
        params,
        timeout: 5000 // 5 second timeout
      });
      
      if (response.data.products && response.data.products.length > 0) {
        // Find best match based on name similarity
        const bestMatch = this.findBestProductMatch(productName, response.data.products);
        return bestMatch;
      }
      
      return null;
    } catch (error) {
      console.error('Open Food Facts API error:', error);
      return null;
    }
  }

  private findBestProductMatch(searchTerm: string, products: OpenFoodFactsProduct[]): OpenFoodFactsProduct {
    const searchLower = searchTerm.toLowerCase();
    
    // Score each product based on name similarity
    const scoredProducts = products.map(product => {
      const productName = (product.product_name || '').toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (productName === searchLower) score = 100;
      // Contains all words
      else if (searchLower.split(' ').every(word => productName.includes(word))) score = 80;
      // Contains some words
      else {
        const matches = searchLower.split(' ').filter(word => productName.includes(word)).length;
        score = (matches / searchLower.split(' ').length) * 60;
      }
      
      // Bonus for having nutrition data
      if (product.nutriments) score += 10;
      if (product.nutrition_grade_fr) score += 5;
      
      return { product, score };
    });

    // Return the highest scoring product
    scoredProducts.sort((a, b) => b.score - a.score);
    return scoredProducts[0].product;
  }

  private createAnalysisFromAPI(productName: string, data: OpenFoodFactsProduct): ProductAnalysis {
    const nutriments = data.nutriments || {};
    
    // Extract nutrition information
    const sodium = this.extractSodium(nutriments);
    const sugars = this.extractSugars(nutriments);
    const isUltraProcessed = this.checkUltraProcessed(data);
    const addedSugars = this.checkAddedSugars(data);
    const category = this.categorizeProduct(productName, data.categories);
    const nutrientDensity = this.calculateNutrientDensity(nutriments, category);

    return {
      name: productName,
      sodium,
      isUltraProcessed,
      nutritionGrade: data.nutrition_grade_fr || 'unknown',
      found: true,
      sugarContent: sugars,
      addedSugars,
      nutrientDensity,
      productCategory: category,
      confidence: 0.9
    };
  }

  private extractSodium(nutriments: any): number {
    // Try different sodium fields (in mg per 100g)
    const sodium100g = nutriments.sodium_100g || nutriments.sodium || 0;
    // Convert to mg per typical serving (assuming 100g serving for simplicity)
    return Math.round(sodium100g);
  }

  private extractSugars(nutriments: any): number {
    // Get sugars in grams per 100g
    const sugars100g = nutriments.sugars_100g || nutriments.sugars || 0;
    // Convert to grams per typical serving
    return Math.round(sugars100g * 10) / 10;
  }

  private checkUltraProcessed(data: OpenFoodFactsProduct): boolean {
    // Check NOVA group (4 = ultra-processed)
    if (data.nova_group === 4) return true;
    
    // Check for ultra-processing indicators in ingredients
    const ingredients = (data.ingredients_text || '').toLowerCase();
    const additives = data.additives_tags || [];
    
    const ultraProcessedIndicators = [
      'high fructose corn syrup',
      'corn syrup',
      'sodium benzoate',
      'artificial flavor',
      'artificial colour',
      'modified starch',
      'sodium nitrite',
      'mono- and diglycerides',
      'carrageenan',
      'xanthan gum'
    ];
    
    // Check ingredients text
    const hasUltraIngredients = ultraProcessedIndicators.some(indicator => 
      ingredients.includes(indicator)
    );
    
    // Check additives (if more than 3 additives, likely ultra-processed)
    const hasMultipleAdditives = additives.length > 3;
    
    return hasUltraIngredients || hasMultipleAdditives;
  }

  private checkAddedSugars(data: OpenFoodFactsProduct): boolean {
    const ingredients = (data.ingredients_text || '').toLowerCase();
    
    const addedSugarIndicators = [
      'sugar',
      'high fructose corn syrup',
      'corn syrup',
      'dextrose',
      'fructose',
      'glucose',
      'sucrose',
      'maltose',
      'agave',
      'honey',
      'maple syrup',
      'cane juice',
      'brown rice syrup'
    ];
    
    return addedSugarIndicators.some(indicator => ingredients.includes(indicator));
  }

  private categorizeProduct(productName: string, categories?: string): ProductCategory {
    const name = productName.toLowerCase();
    const cats = (categories || '').toLowerCase();
    
    // Fresh produce
    if (this.matchesKeywords(name, ['apple', 'banana', 'orange', 'carrot', 'lettuce', 'spinach', 'tomato', 'potato', 'onion', 'fresh', 'organic']) ||
        cats.includes('fruits') || cats.includes('vegetables')) {
      return ProductCategory.FRESH_PRODUCE;
    }
    
    // Dairy
    if (this.matchesKeywords(name, ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream']) ||
        cats.includes('dairy')) {
      return ProductCategory.DAIRY;
    }
    
    // Meat & Seafood
    if (this.matchesKeywords(name, ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'meat', 'deli']) ||
        cats.includes('meat') || cats.includes('fish')) {
      return ProductCategory.MEAT_SEAFOOD;
    }
    
    // Beverages
    if (this.matchesKeywords(name, ['juice', 'soda', 'water', 'coffee', 'tea', 'beer', 'wine', 'drink']) ||
        cats.includes('beverages')) {
      return ProductCategory.BEVERAGES;
    }
    
    // Snacks
    if (this.matchesKeywords(name, ['chips', 'crackers', 'cookies', 'candy', 'chocolate', 'nuts']) ||
        cats.includes('snacks')) {
      return ProductCategory.SNACKS;
    }
    
    // Grains & Cereals
    if (this.matchesKeywords(name, ['bread', 'rice', 'pasta', 'cereal', 'oats', 'quinoa', 'flour']) ||
        cats.includes('cereals')) {
      return ProductCategory.GRAINS_CEREALS;
    }
    
    // Frozen foods
    if (this.matchesKeywords(name, ['frozen', 'ice cream'])) {
      return ProductCategory.FROZEN_FOODS;
    }
    
    // Condiments & Sauces
    if (this.matchesKeywords(name, ['sauce', 'dressing', 'mayo', 'ketchup', 'mustard', 'vinegar', 'oil'])) {
      return ProductCategory.CONDIMENTS_SAUCES;
    }
    
    // Bakery
    if (this.matchesKeywords(name, ['cake', 'muffin', 'donut', 'pastry', 'pie'])) {
      return ProductCategory.BAKERY;
    }
    
    return ProductCategory.PACKAGED_FOODS;
  }

  private matchesKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private calculateNutrientDensity(nutriments: any, category: ProductCategory): number {
    let score = 50; // Base score
    
    // Category bonuses
    const categoryBonuses = {
      [ProductCategory.FRESH_PRODUCE]: 40,
      [ProductCategory.MEAT_SEAFOOD]: 20,
      [ProductCategory.DAIRY]: 15,
      [ProductCategory.GRAINS_CEREALS]: 10,
      [ProductCategory.SNACKS]: -20,
      [ProductCategory.BEVERAGES]: -10,
      [ProductCategory.BAKERY]: -15,
      [ProductCategory.PACKAGED_FOODS]: -5,
      [ProductCategory.FROZEN_FOODS]: -5,
      [ProductCategory.CONDIMENTS_SAUCES]: -10,
      [ProductCategory.UNKNOWN]: 0
    };
    
    score += categoryBonuses[category];
    
    // Nutrient bonuses
    if (nutriments.proteins && nutriments.proteins > 10) score += 10;
    if (nutriments.fiber && nutriments.fiber > 3) score += 15;
    if (nutriments['vitamin-c'] && nutriments['vitamin-c'] > 10) score += 10;
    if (nutriments.calcium && nutriments.calcium > 100) score += 10;
    if (nutriments.iron && nutriments.iron > 2) score += 10;
    
    // Penalties
    if (nutriments['saturated-fat'] && nutriments['saturated-fat'] > 5) score -= 10;
    if (nutriments.sodium && nutriments.sodium > 600) score -= 15;
    if (nutriments.sugars && nutriments.sugars > 15) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private createEstimatedAnalysis(productName: string): ProductAnalysis {
    const category = this.categorizeProduct(productName, '');
    const name = productName.toLowerCase();
    
    // Estimation tables based on product category and keywords
    const estimations = {
      sodium: this.estimateSodium(name, category),
      sugars: this.estimateSugars(name, category),
      isUltraProcessed: this.estimateProcessing(name, category),
      addedSugars: this.estimateAddedSugars(name, category),
      nutrientDensity: this.estimateNutrientDensity(name, category)
    };
    
    return {
      name: productName,
      sodium: estimations.sodium,
      isUltraProcessed: estimations.isUltraProcessed,
      nutritionGrade: this.estimateNutritionGrade(estimations),
      found: false,
      sugarContent: estimations.sugars,
      addedSugars: estimations.addedSugars,
      nutrientDensity: estimations.nutrientDensity,
      productCategory: category,
      confidence: 0.6
    };
  }

  private estimateSodium(name: string, category: ProductCategory): number {
    // High sodium foods
    if (this.matchesKeywords(name, ['pizza', 'chips', 'soup', 'sauce', 'deli', 'frozen dinner', 'pickle', 'olives', 'soy sauce'])) {
      return 800;
    }
    
    // Category-based estimation
    const categoryMeans = {
      [ProductCategory.FRESH_PRODUCE]: 10,
      [ProductCategory.DAIRY]: 150,
      [ProductCategory.MEAT_SEAFOOD]: 300,
      [ProductCategory.GRAINS_CEREALS]: 200,
      [ProductCategory.PACKAGED_FOODS]: 600,
      [ProductCategory.BEVERAGES]: 20,
      [ProductCategory.SNACKS]: 500,
      [ProductCategory.FROZEN_FOODS]: 700,
      [ProductCategory.CONDIMENTS_SAUCES]: 900,
      [ProductCategory.BAKERY]: 300,
      [ProductCategory.UNKNOWN]: 300
    };
    
    return categoryMeans[category];
  }

  private estimateSugars(name: string, category: ProductCategory): number {
    // High sugar foods
    if (this.matchesKeywords(name, ['soda', 'juice', 'candy', 'chocolate', 'cake', 'cookie', 'ice cream', 'donut'])) {
      return 25;
    }
    
    // Fruit gets natural sugars
    if (this.matchesKeywords(name, ['apple', 'banana', 'orange', 'grape', 'berry'])) {
      return 15;
    }
    
    const categoryMeans = {
      [ProductCategory.FRESH_PRODUCE]: 8,
      [ProductCategory.DAIRY]: 5,
      [ProductCategory.MEAT_SEAFOOD]: 0,
      [ProductCategory.GRAINS_CEREALS]: 3,
      [ProductCategory.PACKAGED_FOODS]: 8,
      [ProductCategory.BEVERAGES]: 20,
      [ProductCategory.SNACKS]: 15,
      [ProductCategory.FROZEN_FOODS]: 5,
      [ProductCategory.CONDIMENTS_SAUCES]: 12,
      [ProductCategory.BAKERY]: 18,
      [ProductCategory.UNKNOWN]: 5
    };
    
    return categoryMeans[category];
  }

  private estimateProcessing(name: string, category: ProductCategory): boolean {
    // Obviously ultra-processed
    if (this.matchesKeywords(name, ['instant', 'frozen dinner', 'chips', 'soda', 'candy', 'cookie', 'cereal bar'])) {
      return true;
    }
    
    // Fresh/minimally processed
    if (category === ProductCategory.FRESH_PRODUCE || 
        this.matchesKeywords(name, ['fresh', 'organic', 'raw', 'whole'])) {
      return false;
    }
    
    // Category likelihood
    const processingLikelihood = {
      [ProductCategory.FRESH_PRODUCE]: 0.1,
      [ProductCategory.DAIRY]: 0.3,
      [ProductCategory.MEAT_SEAFOOD]: 0.4,
      [ProductCategory.GRAINS_CEREALS]: 0.5,
      [ProductCategory.PACKAGED_FOODS]: 0.8,
      [ProductCategory.BEVERAGES]: 0.7,
      [ProductCategory.SNACKS]: 0.9,
      [ProductCategory.FROZEN_FOODS]: 0.7,
      [ProductCategory.CONDIMENTS_SAUCES]: 0.6,
      [ProductCategory.BAKERY]: 0.8,
      [ProductCategory.UNKNOWN]: 0.5
    };
    
    return Math.random() < processingLikelihood[category];
  }

  private estimateAddedSugars(name: string, category: ProductCategory): boolean {
    // Obviously has added sugars
    if (this.matchesKeywords(name, ['soda', 'candy', 'chocolate', 'cake', 'cookie', 'ice cream', 'sweetened'])) {
      return true;
    }
    
    // Natural products unlikely to have added sugars
    if (category === ProductCategory.FRESH_PRODUCE || category === ProductCategory.MEAT_SEAFOOD) {
      return false;
    }
    
    return category === ProductCategory.SNACKS || category === ProductCategory.BAKERY || category === ProductCategory.BEVERAGES;
  }

  private estimateNutrientDensity(name: string, category: ProductCategory): number {
    // High nutrient density foods
    if (this.matchesKeywords(name, ['spinach', 'kale', 'broccoli', 'salmon', 'nuts', 'seeds', 'quinoa'])) {
      return 85;
    }
    
    // Use category-based estimation from earlier
    const categoryScores = {
      [ProductCategory.FRESH_PRODUCE]: 80,
      [ProductCategory.MEAT_SEAFOOD]: 70,
      [ProductCategory.DAIRY]: 60,
      [ProductCategory.GRAINS_CEREALS]: 55,
      [ProductCategory.PACKAGED_FOODS]: 40,
      [ProductCategory.BEVERAGES]: 30,
      [ProductCategory.SNACKS]: 25,
      [ProductCategory.FROZEN_FOODS]: 45,
      [ProductCategory.CONDIMENTS_SAUCES]: 35,
      [ProductCategory.BAKERY]: 30,
      [ProductCategory.UNKNOWN]: 50
    };
    
    return categoryScores[category];
  }

  private estimateNutritionGrade(estimations: any): string {
    // Simple grade estimation based on multiple factors
    let score = 5; // Start with middle grade (C)
    
    if (estimations.sodium < 300) score += 1;
    else if (estimations.sodium > 600) score -= 1;
    
    if (!estimations.isUltraProcessed) score += 1;
    else score -= 1;
    
    if (estimations.sugars < 5) score += 1;
    else if (estimations.sugars > 15) score -= 1;
    
    if (estimations.nutrientDensity > 70) score += 1;
    else if (estimations.nutrientDensity < 40) score -= 1;
    
    const grades = ['e', 'd', 'c', 'b', 'a'];
    const gradeIndex = Math.max(0, Math.min(4, score - 1));
    return grades[gradeIndex];
  }

  private getDefaultAnalysis(productName: string): ProductAnalysis {
    return {
      name: productName,
      sodium: 300,
      isUltraProcessed: false,
      nutritionGrade: 'unknown',
      found: false,
      sugarContent: 5,
      addedSugars: false,
      nutrientDensity: 50,
      productCategory: ProductCategory.UNKNOWN,
      confidence: 0.3
    };
  }

  private calculateOverallScore(analyses: ProductAnalysis[]): NutritionAnalysis {
    if (analyses.length === 0) {
      return this.getEmptyAnalysis();
    }

    const totalItems = analyses.length;
    const ultraProcessedCount = analyses.filter(a => a.isUltraProcessed).length;
    const addedSugarCount = analyses.filter(a => a.addedSugars).length;
    
    // Calculate averages
    const averageSodium = analyses.reduce((sum, a) => sum + a.sodium, 0) / totalItems;
    const totalSugarIntake = analyses.reduce((sum, a) => sum + a.sugarContent, 0);
    const averageNutrientDensity = analyses.reduce((sum, a) => sum + a.nutrientDensity, 0) / totalItems;

    // Calculate individual scores (0-100, higher is better)
    const sodiumScore = this.calculateSodiumScore(averageSodium);
    const processingScore = this.calculateProcessingScore(ultraProcessedCount, totalItems);
    const sugarScore = this.calculateSugarScore(totalSugarIntake, addedSugarCount, totalItems);
    const nutrientScore = Math.round(averageNutrientDensity);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (sodiumScore * 0.25) +
      (processingScore * 0.25) +
      (sugarScore * 0.25) +
      (nutrientScore * 0.25)
    );

    const recommendations = this.generateRecommendations(sodiumScore, processingScore, sugarScore, nutrientScore, analyses);
    const nutrientGaps = this.identifyNutrientGaps(analyses);

    return {
      overallScore,
      sodiumScore,
      processingScore,
      sugarScore,
      nutrientScore,
      averageSodium: Math.round(averageSodium),
      ultraProcessedPercent: Math.round((ultraProcessedCount / totalItems) * 100),
      totalSugarIntake: Math.round(totalSugarIntake * 10) / 10,
      addedSugarPercent: Math.round((addedSugarCount / totalItems) * 100),
      nutrientGaps,
      recommendations,
      analysisCount: totalItems,
      processingTime: 0, // Will be set by caller
      cacheHitRate: 0 // Will be set by caller
    };
  }

  private calculateSodiumScore(averageSodium: number): number {
    // WHO recommends <2000mg per day, <600mg per meal
    if (averageSodium <= 200) return 100;
    if (averageSodium <= 400) return 80;
    if (averageSodium <= 600) return 60;
    if (averageSodium <= 800) return 40;
    if (averageSodium <= 1000) return 20;
    return 0;
  }

  private calculateProcessingScore(ultraProcessedCount: number, totalItems: number): number {
    const ultraProcessedPercent = (ultraProcessedCount / totalItems) * 100;
    return Math.max(0, 100 - ultraProcessedPercent * 2); // Each % costs 2 points
  }

  private calculateSugarScore(totalSugar: number, addedSugarCount: number, totalItems: number): number {
    const averageSugar = totalSugar / totalItems;
    const addedSugarPercent = (addedSugarCount / totalItems) * 100;
    
    // Penalize high sugar content and added sugars
    let score = 100;
    
    // Average sugar penalty
    if (averageSugar > 20) score -= 40;
    else if (averageSugar > 15) score -= 30;
    else if (averageSugar > 10) score -= 20;
    else if (averageSugar > 5) score -= 10;
    
    // Added sugar penalty
    score -= addedSugarPercent * 0.5; // Each % of added sugar items costs 0.5 points
    
    return Math.max(0, Math.round(score));
  }

  private generateRecommendations(
    sodiumScore: number,
    processingScore: number,
    sugarScore: number,
    nutrientScore: number,
    analyses: ProductAnalysis[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Sodium recommendations
    if (sodiumScore < 50) {
      recommendations.push("🧂 Reduce sodium: Choose fresh meats over deli, rinse canned beans");
      recommendations.push("🥫 Check labels: Look for 'low sodium' or 'no salt added' options");
    }
    
    // Processing recommendations
    if (processingScore < 50) {
      recommendations.push("🥬 Add fresh foods: More fruits, vegetables, and whole grains");
      recommendations.push("🍳 Cook from scratch: Replace frozen meals with simple homemade options");
    }
    
    // Sugar recommendations
    if (sugarScore < 50) {
      recommendations.push("🍎 Choose natural sugars: Fresh fruits instead of fruit juices");
      recommendations.push("🚫 Limit added sugars: Check ingredient lists for hidden sugars");
    }
    
    // Nutrient recommendations
    if (nutrientScore < 50) {
      recommendations.push("💪 Boost nutrients: Add leafy greens, nuts, and colorful vegetables");
      recommendations.push("🐟 Include protein: Lean meats, fish, beans, and legumes");
    }
    
    // Category-specific recommendations
    const categories = analyses.map(a => a.productCategory);
    if (!categories.includes(ProductCategory.FRESH_PRODUCE)) {
      recommendations.push("🌈 Add fresh produce: Aim for colorful fruits and vegetables");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("✅ Great choices! Keep focusing on whole, fresh foods");
      recommendations.push("🎯 Stay consistent: Maintain this healthy shopping pattern");
    }
    
    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  private identifyNutrientGaps(analyses: ProductAnalysis[]): string[] {
    const gaps: string[] = [];
    const categories = analyses.map(a => a.productCategory);
    
    // Check for missing food groups
    if (!categories.includes(ProductCategory.FRESH_PRODUCE)) {
      gaps.push("Fruits and vegetables (Vitamins A, C, K, folate, fiber)");
    }
    
    if (!categories.includes(ProductCategory.DAIRY) && !categories.includes(ProductCategory.MEAT_SEAFOOD)) {
      gaps.push("Calcium and vitamin D sources");
    }
    
    if (!categories.includes(ProductCategory.MEAT_SEAFOOD)) {
      gaps.push("Iron and vitamin B12 sources");
    }
    
    if (!categories.includes(ProductCategory.GRAINS_CEREALS)) {
      gaps.push("B vitamins and fiber from whole grains");
    }
    
    // Check for lack of nutrient-dense foods
    const highNutrientItems = analyses.filter(a => a.nutrientDensity > 70).length;
    if (highNutrientItems < analyses.length * 0.3) {
      gaps.push("Nutrient-dense foods (leafy greens, nuts, seeds)");
    }
    
    return gaps;
  }

  private getEmptyAnalysis(): NutritionAnalysis {
    return {
      overallScore: 0,
      sodiumScore: 0,
      processingScore: 0,
      sugarScore: 0,
      nutrientScore: 0,
      averageSodium: 0,
      ultraProcessedPercent: 0,
      totalSugarIntake: 0,
      addedSugarPercent: 0,
      nutrientGaps: [],
      recommendations: ["No products found to analyze"],
      analysisCount: 0,
      processingTime: 0,
      cacheHitRate: 0
    };
  }

  // Cache management methods
  private getCachedAnalysis(productName: string): ProductAnalysis | null {
    const cached = this.cache[productName.toLowerCase()];
    if (!cached) return null;
    
    // Check if cache is expired
    const now = Date.now();
    const ageHours = (now - cached.timestamp) / (1000 * 60 * 60);
    
    if (ageHours > this.cacheExpiryHours) {
      delete this.cache[productName.toLowerCase()];
      return null;
    }
    
    return cached.analysis;
  }

  private cacheAnalysis(productName: string, analysis: ProductAnalysis, source: 'api' | 'estimation'): void {
    this.cache[productName.toLowerCase()] = {
      analysis,
      timestamp: Date.now(),
      source
    };
  }

  private initializeCache(): void {
    // Pre-populate cache with common items for better performance
    const commonItems = [
      { name: 'bananas', sodium: 1, sugar: 14, processed: false, nutrient: 85, category: ProductCategory.FRESH_PRODUCE },
      { name: 'milk', sodium: 150, sugar: 12, processed: false, nutrient: 65, category: ProductCategory.DAIRY },
      { name: 'bread', sodium: 400, sugar: 3, processed: true, nutrient: 45, category: ProductCategory.GRAINS_CEREALS },
      { name: 'chicken', sodium: 300, sugar: 0, processed: false, nutrient: 75, category: ProductCategory.MEAT_SEAFOOD },
    ];

    commonItems.forEach(item => {
      const analysis: ProductAnalysis = {
        name: item.name,
        sodium: item.sodium,
        isUltraProcessed: item.processed,
        nutritionGrade: 'b',
        found: false,
        sugarContent: item.sugar,
        addedSugars: false,
        nutrientDensity: item.nutrient,
        productCategory: item.category,
        confidence: 0.8
      };
      
      this.cacheAnalysis(item.name, analysis, 'estimation');
    });
  }

  // Public method to clear cache
  clearCache(): void {
    this.cache = {};
    this.initializeCache();
  }

  // Public method to get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: Object.keys(this.cache).length,
      hitRate: this.requestCount > 0 ? this.cacheHits / this.requestCount : 0
    };
  }
}