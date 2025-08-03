// Frontend TypeScript interfaces matching the backend API responses

export interface Recommendation {
  type: 'swap' | 'reduce' | 'add';
  priority: 'high' | 'medium' | 'low';
  message: string;
  reason: string;
}

export interface AnalysisResult {
  overallScore: number;
  sodiumScore: number;
  processingScore: number;
  sugarScore: number;
  nutrientScore: number;
  averageSodium: number;
  ultraProcessedPercent: number;
  totalSugarIntake: number;
  addedSugarPercent: number;
  recommendations: Recommendation[];
  nutrientGaps: string[];
  analysisCount: number;
  processingTime: number;
  cacheHitRate: number;
  personalizedFor?: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  confidence: number;
}

export interface TextQuality {
  quality: 'good' | 'fair' | 'poor';
  issues: string[];
}

export interface APIResponse {
  success: boolean;
  timestamp: string;
  processingTime: number;
  receipt: {
    itemsFound: number;
    topItems: ReceiptItem[];
    textQuality: TextQuality;
  };
  analysis: AnalysisResult;
  metadata: {
    fileInfo: {
      originalName: string;
      size: number;
      mimeType: string;
    };
    performance: {
      totalProcessingTime: number;
      nutritionAnalysisTime: number;
      cacheHitRate: number;
      itemsAnalyzed: number;
    };
  };
}

export interface APIError {
  error: string;
  details: string;
  timestamp: string;
  processingTime: number;
  support?: {
    tips: string[];
    contact: string;
  };
  suggestions?: string[];
}

export interface UploadState {
  isAnalyzing: boolean;
  results: AnalysisResult | null;
  error: APIError | null;
  file: File | null;
}

// New types for personalization features
export interface UserPreferences {
  goal: 'weight_management' | 'heart_health' | 'diabetes_care' | 'fitness' | 'general_wellness';
  focusAreas: string[];
  dietaryRestrictions?: string[];
  createdAt?: Date;
  userName?: string;
}

export interface ManualProduct {
  name: string;
  quantity: number;
  unit: 'pieces' | 'lb' | 'kg' | 'oz' | 'cups' | 'servings';
}

export interface GoalOption {
  id: UserPreferences['goal'];
  title: string;
  description: string;
  icon: string;
  focusAreas: string[];
  color: string;
}

export interface HistoryStats {
  totalReceipts: number;
  averageHealthScore: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  isImproving: boolean;
  recentRecommendations: Recommendation[];
}

export interface GamificationData {
  pointsEarned: number;
  totalPoints: number;
  level: number;
  levelName: string;
  levelIcon: string;
  streak: number;
  longestStreak: number;
  weeklyProgress: string;
  motivationalMessage: string;
  newBadges: Badge[];
  events: PointsEvent[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  pointsRequired?: number;
  unlockedAt: string;
}

export interface PointsEvent {
  type: 'analysis_completed' | 'recommendation_followed' | 'streak_maintained' | 'goal_achieved' | 'first_scan' | 'manual_entry' | 'health_improved';
  points: number;
  description: string;
  multiplier?: number;
  timestamp: string;
}

export interface EnhancedAPIResponse extends APIResponse {
  receiptId?: string;
  source?: 'receipt' | 'manual';
  history?: HistoryStats;
  personalization?: {
    goal: string;
    customizedFor: string;
  };
  gamification?: GamificationData;
}