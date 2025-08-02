import { ReceiptItem } from './receipt';

export interface ProductAnalysis {
  name: string;
  sodium: number; // mg per serving
  isUltraProcessed: boolean;
  nutritionGrade: string; // A, B, C, D, E or 'unknown'
  found: boolean;
  sugarContent: number; // grams per serving
  addedSugars: boolean; // true if contains added sugars
  nutrientDensity: number; // 0-100 score
  productCategory: ProductCategory;
  confidence: number; // 0-1
}

export interface NutritionAnalysis {
  overallScore: number; // 0-100
  sodiumScore: number; // 0-100
  processingScore: number; // 0-100
  sugarScore: number; // 0-100 (higher is better, less sugar)
  nutrientScore: number; // 0-100 (nutrient power)
  averageSodium: number; // mg
  ultraProcessedPercent: number; // percentage
  totalSugarIntake: number; // estimated grams
  addedSugarPercent: number; // percentage of items with added sugars
  nutrientGaps: string[]; // identified deficiencies
  recommendations: string[];
  analysisCount: number;
  processingTime: number;
  cacheHitRate: number; // performance metric
}

export interface OpenFoodFactsProduct {
  product_name?: string;
  nutrition_grade_fr?: string;
  nova_group?: number; // 1-4, 4 = ultra-processed
  nutriments?: {
    sodium?: number;
    'sodium_100g'?: number;
    sugars?: number;
    'sugars_100g'?: number;
    'saturated-fat'?: number;
    fiber?: number;
    proteins?: number;
    'vitamin-c'?: number;
    calcium?: number;
    iron?: number;
    energy?: number;
  };
  ingredients_text?: string;
  categories?: string;
  additives_tags?: string[];
  nutrient_levels?: {
    salt?: 'low' | 'moderate' | 'high';
    sugars?: 'low' | 'moderate' | 'high';
    'saturated-fat'?: 'low' | 'moderate' | 'high';
  };
}

export interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  skip: number;
}

export enum ProductCategory {
  FRESH_PRODUCE = 'fresh_produce',
  DAIRY = 'dairy',
  MEAT_SEAFOOD = 'meat_seafood',
  GRAINS_CEREALS = 'grains_cereals',
  PACKAGED_FOODS = 'packaged_foods',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  FROZEN_FOODS = 'frozen_foods',
  CONDIMENTS_SAUCES = 'condiments_sauces',
  BAKERY = 'bakery',
  UNKNOWN = 'unknown'
}

export interface NutritionCache {
  [productName: string]: {
    analysis: ProductAnalysis;
    timestamp: number;
    source: 'api' | 'estimation';
  };
}

export interface RecommendationRule {
  condition: (analysis: NutritionAnalysis) => boolean;
  message: string;
  priority: number; // 1-5, 5 = highest
  category: 'sodium' | 'processing' | 'sugar' | 'nutrients' | 'general';
}

export interface NutrientProfile {
  vitamins: { [key: string]: number }; // mg/IU per serving
  minerals: { [key: string]: number }; // mg per serving
  macros: {
    protein: number; // grams
    fiber: number; // grams
    healthyFats: number; // grams
  };
}