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
  private canadianNutrientFileAPI = 'https://food-nutrition.canada.ca/api/canadian-nutrient-file';
  private fdcApiKey: string;
  private cache: NutritionCache = {};
  private cacheExpiryHours = 24; // Cache for 24 hours
  private requestCount = 0;
  private cacheHits = 0;

  constructor() {
    // Initialize FoodData Central API key
    this.fdcApiKey = process.env.FOODDATA_CENTRAL_API_KEY || '';
    if (!this.fdcApiKey) {
      console.warn('⚠️ FOODDATA_CENTRAL_API_KEY not found. Using Open Food Facts only.');
    } else {
      console.log('✅ FoodData Central API initialized');
    }
    
    console.log('🍁 Canadian Nutrient File API initialized');
    console.log('✅ Multi-source nutrition database ready (CNF + FDC + OFF)');
    
    // Clear cache to force fresh API calls
    this.cache = {};
    console.log('🧹 Nutrition cache cleared - forcing fresh API calls');
  }

  async analyzeProducts(items: ReceiptItem[]): Promise<NutritionAnalysis> {
    const startTime = Date.now();
    this.requestCount = 0;
    this.cacheHits = 0;

    console.log(`🧪 Starting nutrition analysis for ${items.length} items`);
    console.log(`🧪 Items to analyze:`, items.map(item => item.name));

    const productAnalyses = await Promise.all(
      items.map(item => this.analyzeProduct(item))
    );

    console.log(`🧪 Completed analysis, got ${productAnalyses.length} results`);
    console.log(`🧪 Sample analysis:`, productAnalyses[0]);

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

      console.log(`🔍 Analyzing product: "${item.name}"`);

      // Priority 1: Try Canadian Nutrient File for Canadian products
      const cnfData = await this.searchCanadianNutrientFile(item.name);
      if (cnfData) {
        console.log(`🍁 Found in Canadian Nutrient File: ${item.name}`);
        const analysis = this.createAnalysisFromCNF(item.name, cnfData);
        this.cacheAnalysis(item.name, analysis, 'cnf');
        return analysis;
      }

      // Priority 2: Try FoodData Central API (good for North American products)
      if (this.fdcApiKey) {
        const fdcData = await this.searchFoodDataCentral(item.name);
        if (fdcData) {
          console.log(`✅ Found in FoodData Central: ${item.name}`);
          const analysis = this.createAnalysisFromFDC(item.name, fdcData);
          this.cacheAnalysis(item.name, analysis, 'api');
          return analysis;
        }
      }

      // Priority 3: Try Open Food Facts API
      const nutritionData = await this.searchOpenFoodFacts(item.name);
      if (nutritionData) {
        console.log(`✅ Found in Open Food Facts: ${item.name}`);
        const analysis = this.createAnalysisFromOFF(item.name, nutritionData);
        
        // If OFF data is insufficient (zero sodium/sugars), use estimation instead
        if (analysis.sodium === 0 && analysis.sugarContent <= 1.5) {
          console.log(`⚠️ OFF data insufficient for ${item.name}, using estimation`);
          const estimation = this.createEstimatedAnalysis(item.name);
          this.cacheAnalysis(item.name, estimation, 'estimation');
          return estimation;
        }
        
        this.cacheAnalysis(item.name, analysis, 'api');
        return analysis;
      }
      
      // Last resort: Intelligent estimation
      console.log(`⚠️ Using estimation for: ${item.name}`);
      const estimation = this.createEstimatedAnalysis(item.name);
      this.cacheAnalysis(item.name, estimation, 'estimation');
      return estimation;
      
    } catch (error) {
      console.error(`❌ Error analyzing ${item.name}:`, error);
      return this.getDefaultAnalysis(item.name);
    }
  }

  private async searchCanadianNutrientFile(productName: string): Promise<any | null> {
    try {
      console.log(`🍁 CNF search for: "${productName}"`);
      
      // The CNF API requires food codes, so we need a different approach
      // We'll implement a food name search strategy based on common Canadian foods
      const canadianFoodMappings = this.getCanadianFoodMappings();
      const cleanedName = productName.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
      
      // Look for Canadian food matches
      for (const [searchTerms, foodCode] of canadianFoodMappings) {
        if (searchTerms.some(term => cleanedName.includes(term))) {
          console.log(`🎯 Found CNF mapping: "${productName}" -> food code ${foodCode}`);
          
          // Get food details
          const foodUrl = `${this.canadianNutrientFileAPI}/food/?id=${foodCode}&lang=en&type=json`;
          const nutrientUrl = `${this.canadianNutrientFileAPI}/nutrientamount/?id=${foodCode}&lang=en&type=json`;
          
          try {
            const [foodResponse, nutrientResponse] = await Promise.all([
              axios.get(foodUrl, { timeout: 8000 }),
              axios.get(nutrientUrl, { timeout: 8000 })
            ]);
            
            if (foodResponse.data && nutrientResponse.data) {
              return {
                food_description: foodResponse.data.food_description,
                food_code: foodResponse.data.food_code,
                nutrients: Array.isArray(nutrientResponse.data) ? nutrientResponse.data : [nutrientResponse.data]
              };
            }
          } catch (apiError) {
            console.log(`❌ CNF API error for food code ${foodCode}:`, apiError instanceof Error ? apiError.message : 'Unknown error');
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Canadian Nutrient File search error:', error);
      return null;
    }
  }

  private getCanadianFoodMappings(): Array<[string[], number]> {
    // Mapping of common Canadian food terms to CNF food codes
    // Based on popular Canadian grocery items and brands
    return [
      // Dairy products
      [['milk', '2%', 'partly skimmed'], 109], // Milk, partly skimmed, 2% M.F.
      [['milk', 'whole'], 108], // Milk, whole, 3.25% M.F.
      [['milk', 'skim'], 110], // Milk, skim
      [['cheese', 'cheddar'], 115], // Cheese, cheddar
      [['cheese', 'mozzarella'], 119], // Cheese, mozzarella
      [['yogurt', 'plain'], 142], // Yogurt, plain
      [['butter'], 155], // Butter, salted
      
      // Meat & Seafood
      [['chicken', 'breast'], 5062], // Chicken, broiler, breast meat only
      [['beef', 'ground'], 6174], // Beef, ground, regular
      [['salmon'], 2587], // Salmon, Atlantic, farmed
      [['tuna'], 2595], // Tuna, yellowfin
      [['bacon'], 6213], // Pork, bacon
      
      // Grains & Bread
      [['bread', 'white'], 2298], // Bread, white, commercial
      [['bread', 'whole wheat'], 2302], // Bread, whole wheat, commercial
      [['rice', 'white'], 20037], // Rice, white, long-grain, regular, cooked
      [['pasta'], 20121], // Pasta, cooked
      [['oats', 'oatmeal'], 20038], // Cereals, oats, instant, fortified
      
      // Fruits & Vegetables
      [['apple'], 9003], // Apples, raw, with skin
      [['banana'], 9040], // Bananas, raw
      [['orange'], 9200], // Oranges, raw
      [['potato'], 11353], // Potatoes, flesh and skin, raw
      [['tomato'], 11529], // Tomatoes, red, ripe, raw
      [['carrot'], 11124], // Carrots, raw
      [['broccoli'], 11090], // Broccoli, raw
      
      // Canned/Packaged Foods
      [['beans', 'baked'], 20045], // Beans, baked, canned
      [['soup', 'chicken'], 6419], // Soup, chicken noodle, canned
      [['salsa'], 11531], // Salsa
      [['peanut butter'], 16098], // Peanut butter, smooth style
      
      // Canadian Brands (map to generic equivalents)
      [['great value', 'milk'], 109],
      [['no name', 'bread'], 2298],
      [['presidents choice', 'cheese'], 115],
      [['compliments', 'yogurt'], 142],
      [['maple leaf', 'bacon'], 6213]
    ];
  }

  private createAnalysisFromCNF(productName: string, data: any): ProductAnalysis {
    const nutrients = data.nutrients || [];
    
    // Extract key nutrients from CNF data
    // CNF uses nutrient codes: sodium=307, sugars=269, protein=203, etc.
    const findNutrient = (codes: number[]) => {
      for (const code of codes) {
        const nutrient = nutrients.find((n: any) => n.nutrient_name_id === code || n.nutrient_code === code);
        if (nutrient && nutrient.nutrient_value != null) {
          return parseFloat(nutrient.nutrient_value) || 0;
        }
      }
      return 0;
    };
    
    const sodium = findNutrient([307]); // Sodium in mg
    const sugars = findNutrient([269, 270]); // Total sugars
    const protein = findNutrient([203]); // Protein
    const fiber = findNutrient([291]); // Fiber
    const saturatedFat = findNutrient([606]); // Saturated fat
    
    // Determine category and processing level
    const category = this.categorizeProduct(productName);
    const isUltraProcessed = this.estimateProcessing(productName, category);
    const addedSugars = this.estimateAddedSugars(productName, category);
    
    // Calculate nutrient density score
    let nutrientDensity = 50; // Base score
    
    // Canadian food quality bonuses
    if (protein > 10) nutrientDensity += 15;
    if (fiber > 3) nutrientDensity += 15;
    if (sodium < 300) nutrientDensity += 10;
    if (saturatedFat < 5) nutrientDensity += 10;
    
    // Category bonuses
    const categoryBonuses: Record<ProductCategory, number> = {
      [ProductCategory.FRESH_PRODUCE]: 25,
      [ProductCategory.DAIRY]: 15,
      [ProductCategory.MEAT_SEAFOOD]: 15,
      [ProductCategory.GRAINS_CEREALS]: 10,
      [ProductCategory.PACKAGED_FOODS]: -5,
      [ProductCategory.SNACKS]: -15,
      [ProductCategory.BEVERAGES]: -10,
      [ProductCategory.FROZEN_FOODS]: -5,
      [ProductCategory.CONDIMENTS_SAUCES]: -10,
      [ProductCategory.BAKERY]: -10,
      [ProductCategory.UNKNOWN]: 0
    };
    
    nutrientDensity += categoryBonuses[category] || 0;
    nutrientDensity = Math.max(10, Math.min(95, nutrientDensity));
    
    return {
      name: productName,
      sodium: Math.round(sodium),
      isUltraProcessed,
      nutritionGrade: this.estimateNutritionGradeFromCNF(sodium, sugars, saturatedFat, protein, fiber),
      found: true,
      sugarContent: Math.round(sugars * 10) / 10,
      addedSugars,
      nutrientDensity: Math.round(nutrientDensity),
      productCategory: category,
      confidence: 0.95 // High confidence for official Canadian data
    };
  }

  private estimateNutritionGradeFromCNF(sodium: number, sugars: number, saturatedFat: number, protein: number, fiber: number): string {
    let score = 5; // Start with C grade
    
    // Positive factors
    if (protein > 8) score += 1;
    if (fiber > 4) score += 1;
    
    // Negative factors
    if (sodium > 600) score -= 1;
    if (sugars > 15) score -= 1;
    if (saturatedFat > 5) score -= 1;
    
    const grades = ['e', 'd', 'c', 'b', 'a'];
    const gradeIndex = Math.max(0, Math.min(4, score - 1));
    return grades[gradeIndex];
  }

  /**
   * Generate simple, actionable food swap recommendations
   */
  generateRecommendations(analyses: ProductAnalysis[]): Array<{
    type: 'swap' | 'reduce' | 'add';
    priority: 'high' | 'medium' | 'low';
    message: string;
    reason: string;
  }> {
    const recommendations: Array<{
      type: 'swap' | 'reduce' | 'add';
      priority: 'high' | 'medium' | 'low';
      message: string;
      reason: string;
    }> = [];

    // Analyze for high sodium items
    const highSodiumItems = analyses.filter(item => 
      item.found && item.sodium > 600 // High sodium threshold
    );

    highSodiumItems.forEach(item => {
      recommendations.push({
        type: 'swap',
        priority: 'high',
        message: `Replace "${item.name}" with a low-sodium alternative`,
        reason: `Contains ${item.sodium}mg sodium (very high)`
      });
    });

    // Analyze for ultra-processed foods
    const ultraProcessedItems = analyses.filter(item => 
      item.found && item.isUltraProcessed
    );

    if (ultraProcessedItems.length >= 3) {
      recommendations.push({
        type: 'reduce',
        priority: 'high',
        message: `Try to replace ${ultraProcessedItems.length} ultra-processed items with whole foods`,
        reason: 'Ultra-processed foods increase disease risk'
      });
    }

    // Analyze for added sugars
    const highSugarItems = analyses.filter(item => 
      item.found && item.addedSugars && item.sugarContent > 15
    );

    highSugarItems.forEach(item => {
      recommendations.push({
        type: 'swap',
        priority: 'medium',
        message: `Choose unsweetened version of "${item.name}"`,
        reason: `Contains ${item.sugarContent}g added sugars`
      });
    });

    // Check for missing vegetables/fruits
    const produceItems = analyses.filter(item => 
      item.found && item.productCategory === 'fresh_produce'
    );

    if (produceItems.length < 3) {
      recommendations.push({
        type: 'add',
        priority: 'medium',
        message: 'Add more fresh vegetables and fruits to your cart',
        reason: 'Only found ' + produceItems.length + ' fresh produce items'
      });
    }

    // Positive reinforcement for good choices
    const healthyItems = analyses.filter(item => 
      item.found && 
      item.productCategory === 'fresh_produce' && 
      !item.isUltraProcessed
    );

    if (healthyItems.length >= 4) {
      recommendations.push({
        type: 'add',
        priority: 'low',
        message: `Great job! You chose ${healthyItems.length} healthy fresh foods`,
        reason: 'Keep up the healthy shopping habits'
      });
    }

    // Sort by priority
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Return top 5 recommendations
    return recommendations.slice(0, 5);
  }

  private async searchFoodDataCentral(productName: string): Promise<any | null> {
    try {
      const searchUrl = `${this.foodDataCentralAPI}/foods/search?api_key=${this.fdcApiKey}`;
      
      // Use POST request with better search parameters (as per FDC documentation)
      // Prioritize Foundation and Survey data which have more complete nutrition profiles
      const searchBody = {
        query: productName,
        dataType: ["Foundation", "Survey (FNDDS)", "Branded"], // Prioritize complete nutrition data
        pageSize: 8,
        sortBy: "dataType.keyword", 
        sortOrder: "asc"
      };

      console.log(`🔍 FDC API search for: "${productName}"`);
      const response = await axios.post(searchUrl, searchBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 12000 // 12 second timeout
      });
      
      if (response.data.foods && response.data.foods.length > 0) {
        // Find best match based on name similarity
        const bestMatch = this.findBestFDCMatch(productName, response.data.foods);
        
        // Get detailed nutrition data for the best match
        if (bestMatch) {
          const detailsUrl = `${this.foodDataCentralAPI}/food/${bestMatch.fdcId}`;
          const detailsParams = { api_key: this.fdcApiKey };
          
          const detailsResponse = await axios.get(detailsUrl, { 
            params: detailsParams,
            timeout: 12000
          });
          
          // Verify the food has actual nutrition data
          const nutrients = detailsResponse.data.foodNutrients || [];
          if (nutrients.length > 5) { // Only use if it has meaningful nutrition data
            return detailsResponse.data;
          } else {
            console.log(`⚠️ FDC food ${bestMatch.fdcId} has insufficient nutrition data (${nutrients.length} nutrients)`);
          }
        }
      }
      
      return null;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('🚫 FoodData Central API rate limit exceeded (1000/hour)');
      } else if (error.response?.status === 403) {
        console.error('🚫 FoodData Central API key invalid or blocked');
      } else {
        console.error('FoodData Central API error:', error instanceof Error ? error.message : 'Unknown error');
      }
      return null;
    }
  }

  private findBestFDCMatch(searchTerm: string, foods: any[]): any | null {
    const searchLower = searchTerm.toLowerCase();
    
    // Score each food based on name similarity
    const scoredFoods = foods.map(food => {
      const foodName = (food.description || '').toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (foodName === searchLower) score = 100;
      // Contains all words
      else if (searchLower.split(' ').every(word => foodName.includes(word))) score = 80;
      // Contains some words
      else {
        const matches = searchLower.split(' ').filter(word => foodName.includes(word)).length;
        score = (matches / searchLower.split(' ').length) * 60;
      }
      
      // Prefer data types with more complete nutrition info
      if (food.dataType === 'Foundation') score += 30; // Most complete nutrition data
      if (food.dataType === 'Survey (FNDDS)') score += 25; // Very complete nutrition data  
      if (food.dataType === 'Branded') score += 15; // Variable nutrition data quality
      
      return { food, score };
    });

    // Return the highest scoring food
    scoredFoods.sort((a, b) => b.score - a.score);
    return scoredFoods.length > 0 && scoredFoods[0].score > 30 ? scoredFoods[0].food : null;
  }

  private createAnalysisFromFDC(productName: string, data: any): ProductAnalysis {
    const nutrients = data.foodNutrients || [];
    
    // Extract nutrition information from FDC format (correct IDs)
    const sodium = this.extractFDCNutrient(nutrients, [1093]); // Sodium, Na (mg)
    const sugars = this.extractFDCNutrient(nutrients, [1012, 1013, 1011]); // Fructose, glucose, sucrose (g)
    const protein = this.extractFDCNutrient(nutrients, [1003]); // Protein (g)
    const fiber = this.extractFDCNutrient(nutrients, [1079]); // Fiber, total dietary (g)
    const saturatedFat = this.extractFDCNutrient(nutrients, [1258]); // Fatty acids, total saturated (g)
    const carbs = this.extractFDCNutrient(nutrients, [1005]); // Carbohydrate, by difference (g)
    const addedSugars = sugars > 5 && carbs > 10; // Estimate based on sugar/carb ratio
    
    const category = this.categorizeProduct(productName, '');
    const isUltraProcessed = this.estimateFDCProcessing(data, category);
    const nutrientDensity = this.calculateFDCNutrientDensity(nutrients, category);
    const nutritionGrade = this.calculateNutritionGradeFromFDC(sodium, sugars, saturatedFat, fiber);

    console.log(`📊 FDC Analysis for "${productName}":`, {
      sodium: Math.round(sodium),
      sugars: Math.round(sugars * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      saturatedFat: Math.round(saturatedFat * 10) / 10,
      isUltraProcessed: isUltraProcessed,
      addedSugars: addedSugars,
      nutrientDensity: nutrientDensity,
      category: category,
      nutritionGrade: nutritionGrade,
      dataType: data.dataType,
      description: data.description
    });

    return {
      name: productName,
      sodium: Math.round(sodium),
      isUltraProcessed,
      nutritionGrade,
      found: true,
      sugarContent: Math.round(sugars * 10) / 10,
      addedSugars,
      nutrientDensity,
      productCategory: category,
      confidence: 0.95 // High confidence for FDC data
    };
  }

  private extractFDCNutrient(nutrients: any[], nutrientIds: number[]): number {
    for (const nutrientId of nutrientIds) {
      const nutrient = nutrients.find(n => n.nutrient?.id === nutrientId);
      if (nutrient && nutrient.amount) {
        return nutrient.amount;
      }
    }
    return 0;
  }

  private estimateFDCProcessing(data: any, category: ProductCategory): boolean {
    // Check if it's a branded food (more likely to be processed)
    if (data.dataType === 'Branded') {
      // Look for processing indicators in the brand name or description
      const description = (data.description || '').toLowerCase();
      const brandName = (data.brandOwner || '').toLowerCase();
      
      const processingIndicators = [
        'instant', 'frozen', 'canned', 'packaged', 'processed',
        'enriched', 'fortified', 'modified', 'artificial'
      ];
      
      const hasProcessingWords = processingIndicators.some(indicator => 
        description.includes(indicator) || brandName.includes(indicator)
      );
      
      if (hasProcessingWords) return true;
    }
    
    // Use category-based estimation
    return this.estimateProcessing(data.description || '', category);
  }

  private calculateFDCNutrientDensity(nutrients: any[], category: ProductCategory): number {
    let score = 50; // Base score
    
    // Category bonuses (same as before)
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
    
    // Nutrient bonuses using FDC data (correct IDs)
    const protein = this.extractFDCNutrient(nutrients, [1003]);
    const fiber = this.extractFDCNutrient(nutrients, [1079]);
    const vitaminC = this.extractFDCNutrient(nutrients, [1162]);
    const calcium = this.extractFDCNutrient(nutrients, [1087]);
    const iron = this.extractFDCNutrient(nutrients, [1089]);
    const saturatedFat = this.extractFDCNutrient(nutrients, [1258]);
    const sodium = this.extractFDCNutrient(nutrients, [1093]);
    const sugars = this.extractFDCNutrient(nutrients, [1012, 1013, 1011]);
    
    if (protein > 10) score += 10;
    if (fiber > 3) score += 15;
    if (vitaminC > 10) score += 10;
    if (calcium > 100) score += 10;
    if (iron > 2) score += 10;
    
    // Penalties
    if (saturatedFat > 5) score -= 10;
    if (sodium > 600) score -= 15;
    if (sugars > 15) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateNutritionGradeFromFDC(sodium: number, sugars: number, saturatedFat: number, fiber: number): string {
    let score = 5; // Start with middle grade (C)
    
    if (sodium < 300) score += 1;
    else if (sodium > 600) score -= 1;
    
    if (sugars < 5) score += 1;
    else if (sugars > 15) score -= 1;
    
    if (saturatedFat < 3) score += 1;
    else if (saturatedFat > 10) score -= 1;
    
    if (fiber > 5) score += 1;
    else if (fiber < 2) score -= 1;
    
    const grades = ['e', 'd', 'c', 'b', 'a'];
    const gradeIndex = Math.max(0, Math.min(4, score - 1));
    return grades[gradeIndex];
  }

  private async searchOpenFoodFacts(productName: string): Promise<OpenFoodFactsProduct | null> {
    try {
      // Enhanced cleaning for Canadian products
      const cleanedName = productName
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b(great value|no name|presidents choice|compliments|kirkland)\b/g, '') // Remove store brands for better matching
        .trim();

      console.log(`🔍 OFF API search for: "${cleanedName}" (original: "${productName}")`);
      
      // Try multiple search strategies for Canadian products
      const searchStrategies = [
        productName, // Original name
        cleanedName, // Cleaned name
        cleanedName.split(' ')[0], // First word only
        productName.split(' ').slice(0, 2).join(' '), // First two words
      ].filter(term => term.length >= 2);

      for (const searchTerm of searchStrategies) {
        const searchUrl = `${this.openFoodFactsAPI}/search`;
        const params = {
          search_terms: searchTerm,
          json: 1,
          page_size: 10, // Increased for better Canadian coverage
          fields: 'product_name,nutrition_grade_fr,nova_group,nutriments,ingredients_text,categories,additives_tags,nutrient_levels,countries'
        };

        try {
          const response = await axios.get<OpenFoodFactsResponse>(searchUrl, { 
            params,
            timeout: 8000 // Increased timeout
          });
          
          if (response.data.products && response.data.products.length > 0) {
            const bestMatch = this.findBestProductMatch(searchTerm, response.data.products, productName);
            if (bestMatch) {
              console.log(`✅ Found match using strategy: "${searchTerm}"`);
              return bestMatch;
            }
          }
        } catch (strategyError) {
          console.log(`❌ Search strategy "${searchTerm}" failed:`, strategyError instanceof Error ? strategyError.message : 'Unknown error');
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Open Food Facts API error:', error);
      return null;
    }
  }

  private findBestProductMatch(searchTerm: string, products: OpenFoodFactsProduct[], originalName?: string): OpenFoodFactsProduct | null {
    const searchLower = searchTerm.toLowerCase();
    const originalLower = originalName?.toLowerCase() || searchTerm.toLowerCase();
    
    // Enhanced scoring system for Canadian products
    const scoredProducts = products.map(product => {
      const productName = (product.product_name || '').toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (productName === searchLower || productName === originalLower) {
        score = 100;
      }
      // Contains all words from search term
      else if (searchLower.split(' ').every(word => word.length > 1 && productName.includes(word))) {
        score = 85;
      }
      // Contains all words from original name
      else if (originalName && originalLower.split(' ').every(word => word.length > 1 && productName.includes(word))) {
        score = 80;
      }
      // Contains some words
      else {
        const searchWords = searchLower.split(' ').filter(word => word.length > 1);
        const matches = searchWords.filter(word => productName.includes(word)).length;
        if (matches > 0) {
          score = (matches / searchWords.length) * 65;
        }
      }
      
      // Canadian product bonus
      if ((product as any).countries && typeof (product as any).countries === 'string' && (product as any).countries.toLowerCase().includes('canada')) {
        score += 15;
      }
      
      // Brand matching for Canadian stores
      const canadianBrands = ['great value', 'no name', 'presidents choice', 'compliments', 'kirkland'];
      for (const brand of canadianBrands) {
        if (originalLower.includes(brand) && productName.includes(brand)) {
          score += 20;
          break;
        }
      }
      
      // Food category matching bonus
      if (product.categories) {
        const categories = product.categories.toLowerCase();
        const foodCategories = ['dairy', 'meat', 'fruit', 'vegetable', 'bread', 'cereal', 'snack', 'beverage'];
        for (const category of foodCategories) {
          if (originalLower.includes(category) && categories.includes(category)) {
            score += 10;
            break;
          }
        }
      }
      
      // Bonus for having complete nutrition data
      if (product.nutriments && Object.keys(product.nutriments).length > 3) {
        score += 12;
      }
      
      // Bonus for having nutrition grade
      if (product.nutrition_grade_fr && product.nutrition_grade_fr !== 'unknown') {
        score += 8;
      }
      
      // Bonus for having nova group (processing level)
      if (product.nova_group && product.nova_group > 0) {
        score += 5;
      }
      
      // Penalty for very long names (likely less relevant)
      if (productName.length > 100) {
        score -= 8;
      }
      
      return { product, score };
    });

    // Sort by score and return the best match
    scoredProducts.sort((a, b) => b.score - a.score);
    
    const bestMatch = scoredProducts[0];
    console.log(`🎯 Best match score: ${bestMatch?.score || 0} for "${bestMatch?.product?.product_name || 'none'}"`);
    
    // More lenient threshold for Canadian products
    return bestMatch && bestMatch.score > 25 ? bestMatch.product : null;
  }

  private createAnalysisFromOFF(productName: string, data: OpenFoodFactsProduct): ProductAnalysis {
    const nutriments = data.nutriments || {};
    
    // Extract nutrition information
    const sodium = this.extractSodium(nutriments);
    const sugars = this.extractSugars(nutriments);
    const isUltraProcessed = this.checkUltraProcessed(data);
    const addedSugars = this.checkAddedSugars(data);
    const category = this.categorizeProduct(productName, data.categories);
    const nutrientDensity = this.calculateNutrientDensity(nutriments, category);

    console.log(`📊 OFF Analysis for "${productName}":`, {
      sodium: sodium,
      sugars: sugars,
      isUltraProcessed: isUltraProcessed,
      addedSugars: addedSugars,
      nutrientDensity: nutrientDensity,
      category: category,
      novaGroup: data.nova_group,
      nutritionGrade: data.nutrition_grade_fr,
      rawNutriments: nutriments
    });

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
      confidence: 0.85 // Slightly lower than FDC but still good
    };
  }

  private extractSodium(nutriments: any): number {
    // Try different sodium fields (in mg per 100g)
    let sodium = nutriments.sodium_100g || nutriments.sodium || 0;
    
    // Convert from grams to milligrams if needed
    if (sodium < 1) {
      sodium = sodium * 1000; // Convert g to mg
    }
    
    // If still zero, return 0
    return Math.round(sodium);
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
    
    // Fresh produce (enhanced with Canadian varieties)
    if (this.matchesKeywords(name, [
        'apple', 'banana', 'orange', 'carrot', 'lettuce', 'spinach', 'tomato', 'potato', 'onion', 
        'fresh', 'organic', 'broccoli', 'cucumber', 'pepper', 'mushroom', 'corn', 'peas', 'beans',
        'avocado', 'strawberry', 'grape', 'lemon', 'lime', 'garlic', 'ginger', 'cilantro', 'parsley',
        'basil', 'kale', 'cabbage', 'cauliflower', 'celery', 'berries', 'peach', 'pear', 'plum'
      ]) || cats.includes('fruits') || cats.includes('vegetables')) {
      return ProductCategory.FRESH_PRODUCE;
    }
    
    // Dairy (enhanced with Canadian brands and terms)
    if (this.matchesKeywords(name, [
        'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
        'cheddar', 'mozzarella', 'parmesan', 'swiss', 'goat', 'lactantia', 'gay lea', 'beatrice',
        'presidents choice', 'no name', 'great value'
      ]) || cats.includes('dairy')) {
      return ProductCategory.DAIRY;
    }
    
    // Meat & Seafood (enhanced with Canadian terms and cuts)
    if (this.matchesKeywords(name, [
        'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'meat', 'deli', 'turkey', 'ham',
        'bacon', 'sausage', 'ground', 'steak', 'roast', 'chops', 'wings', 'breast', 'thigh',
        'shrimp', 'crab', 'lobster', 'cod', 'halibut', 'maple leaf', 'schneiders'
      ]) || cats.includes('meat') || cats.includes('fish')) {
      return ProductCategory.MEAT_SEAFOOD;
    }
    
    // Grains & Cereals (enhanced)
    if (this.matchesKeywords(name, [
        'bread', 'rice', 'pasta', 'cereal', 'oats', 'quinoa', 'flour', 'bagel', 'tortilla',
        'crackers', 'granola', 'muffin', 'whole grain', 'wheat', 'barley', 'buckwheat'
      ]) || cats.includes('grains') || cats.includes('cereals')) {
      return ProductCategory.GRAINS_CEREALS;
    }
    
    // Snacks (enhanced with Canadian brands)
    if (this.matchesKeywords(name, [
        'chips', 'crackers', 'cookies', 'candy', 'chocolate', 'nuts', 'popcorn', 'pretzels',
        'lays', 'doritos', 'cheetos', 'smarties', 'kit kat', 'oreo', 'presidents choice',
        'no name', 'great value', 'compliments'
      ]) || cats.includes('snacks')) {
      return ProductCategory.SNACKS;
    }
    
    // Beverages (enhanced)
    if (this.matchesKeywords(name, [
        'juice', 'soda', 'water', 'coffee', 'tea', 'beer', 'wine', 'cola', 'sprite', 'pepsi',
        'coke', 'ginger ale', 'kombucha', 'smoothie', 'tropicana', 'minute maid', 'canada dry',
        'drink'
      ]) || cats.includes('beverages')) {
      return ProductCategory.BEVERAGES;
    }
    
    // Bakery (enhanced)
    if (this.matchesKeywords(name, [
        'cake', 'pie', 'donut', 'muffin', 'pastry', 'croissant', 'danish', 'scone', 'brownie'
      ]) || cats.includes('bakery')) {
      return ProductCategory.BAKERY;
    }
    
    // Packaged Foods (enhanced with Canadian brands and canned foods)
    if (this.matchesKeywords(name, [
        'soup', 'sauce', 'canned', 'jar', 'salsa', 'beans', 'tomatoes', 'corn', 'peas', 
        'tuna', 'salmon', 'sardines', 'olives', 'pickles', 'jam', 'jelly', 'peanut butter',
        'campbells', 'heinz', 'hunts', 'delmonte', 'presidents choice', 'no name', 'great value'
      ]) || cats.includes('packaged') || cats.includes('canned')) {
      return ProductCategory.PACKAGED_FOODS;
    }
    
    // Frozen Foods (enhanced)
    if (this.matchesKeywords(name, [
        'frozen', 'ice cream', 'pizza', 'fries', 'vegetables', 'berries', 'haagen dazs',
        'ben jerry', 'presidents choice', 'no name', 'great value'
      ]) || cats.includes('frozen')) {
      return ProductCategory.FROZEN_FOODS;
    }
    
    // Condiments & Sauces (enhanced)
    if (this.matchesKeywords(name, [
        'ketchup', 'mustard', 'mayo', 'dressing', 'oil', 'vinegar', 'bbq', 'hot sauce',
        'soy sauce', 'worcestershire', 'maple syrup', 'honey', 'heinz', 'french', 'sauce'
      ]) || cats.includes('condiments')) {
      return ProductCategory.CONDIMENTS_SAUCES;
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

    console.log(`🤔 Estimation for "${productName}":`, {
      category: category,
      sodium: estimations.sodium,
      sugars: estimations.sugars,
      isUltraProcessed: estimations.isUltraProcessed,
      addedSugars: estimations.addedSugars,
      nutrientDensity: estimations.nutrientDensity
    });
    
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
    // Costco-specific patterns for better estimates
    if (this.matchesKeywords(name, ['ff bs breast', 'grnd turkey'])) {
      return 75; // Fresh meat, low sodium
    }
    if (this.matchesKeywords(name, ['diced tom', 'grape tomato', 'chpd onion'])) {
      return 5; // Fresh vegetables, very low sodium
    }
    if (this.matchesKeywords(name, ['eggs', '18ct eggs'])) {
      return 140; // Eggs have moderate sodium
    }
    if (this.matchesKeywords(name, ['mont jack', 'cheese'])) {
      return 200; // Cheese has higher sodium
    }
    if (this.matchesKeywords(name, ['salsa', 'sauce'])) {
      return 400; // Sauces typically higher sodium
    }
    
    // High sodium foods
    if (this.matchesKeywords(name, ['pizza', 'chips', 'soup', 'deli', 'frozen dinner', 'pickle', 'olives', 'soy sauce'])) {
      return 800;
    }
    
    // Category-based estimation
    const categoryMeans = {
      [ProductCategory.FRESH_PRODUCE]: 8,
      [ProductCategory.DAIRY]: 180,
      [ProductCategory.MEAT_SEAFOOD]: 85,
      [ProductCategory.GRAINS_CEREALS]: 200,
      [ProductCategory.PACKAGED_FOODS]: 600,
      [ProductCategory.BEVERAGES]: 20,
      [ProductCategory.SNACKS]: 500,
      [ProductCategory.FROZEN_FOODS]: 700,
      [ProductCategory.CONDIMENTS_SAUCES]: 450,
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

    // Calculate overall score with improved weighting for Canadian dietary guidelines
    // Nutrient density gets higher weight as it represents overall food quality
    const overallScore = Math.round(
      (sodiumScore * 0.2) +        // 20% - Important but not the only factor
      (processingScore * 0.25) +   // 25% - Processing level is crucial for health
      (sugarScore * 0.2) +         // 20% - Sugar management is important
      (nutrientScore * 0.35)       // 35% - Overall nutrition quality gets highest weight
    );

    const recommendations = this.generateRecommendations(analyses);
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
    // Health Canada recommends <2300mg per day, but grocery items should be much lower
    // Adjusted for typical Canadian food consumption patterns
    if (averageSodium <= 150) return 100;  // Excellent - very low sodium
    if (averageSodium <= 300) return 85;   // Good - moderate sodium
    if (averageSodium <= 500) return 70;   // Fair - getting high
    if (averageSodium <= 700) return 50;   // Poor - high sodium
    if (averageSodium <= 1000) return 25;  // Very poor - very high
    return 10; // Extremely high - still give some points to avoid zeros
  }

  private calculateProcessingScore(ultraProcessedCount: number, totalItems: number): number {
    const ultraProcessedPercent = (ultraProcessedCount / totalItems) * 100;
    
    // More nuanced scoring that doesn't penalize too harshly for some processed foods
    if (ultraProcessedPercent === 0) return 100;  // Perfect - no ultra-processed
    if (ultraProcessedPercent <= 20) return 90;   // Excellent - minimal processing
    if (ultraProcessedPercent <= 40) return 75;   // Good - some processed items
    if (ultraProcessedPercent <= 60) return 55;   // Fair - moderate processing
    if (ultraProcessedPercent <= 80) return 35;   // Poor - mostly processed
    return 15; // Very poor - almost all processed, but not zero
  }

  private calculateSugarScore(totalSugar: number, addedSugarCount: number, totalItems: number): number {
    const averageSugar = totalSugar / totalItems;
    const addedSugarPercent = (addedSugarCount / totalItems) * 100;
    
    // More realistic sugar scoring based on Health Canada guidelines
    let baseScore = 100;
    
    // Natural sugars from fruits are different from added sugars
    if (averageSugar <= 3) baseScore = 100;      // Excellent - very low sugar
    else if (averageSugar <= 6) baseScore = 90;  // Very good - low sugar
    else if (averageSugar <= 10) baseScore = 80; // Good - moderate sugar
    else if (averageSugar <= 15) baseScore = 65; // Fair - getting high
    else if (averageSugar <= 20) baseScore = 45; // Poor - high sugar
    else if (averageSugar <= 30) baseScore = 25; // Very poor - very high
    else baseScore = 10; // Extremely high
    
    // Additional penalty for added sugars (more concerning than natural sugars)
    const addedSugarPenalty = addedSugarPercent * 0.4; // Each % of added sugar items costs 0.4 points
    
    return Math.max(5, Math.round(baseScore - addedSugarPenalty)); // Minimum score of 5
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
      recommendations: [{
        type: 'add',
        priority: 'high',
        message: 'No products found to analyze',
        reason: 'Receipt scanning did not detect any food items'
      }],
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

  private cacheAnalysis(productName: string, analysis: ProductAnalysis, source: 'cnf' | 'api' | 'estimation'): void {
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