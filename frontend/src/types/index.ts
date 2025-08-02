// Frontend TypeScript interfaces matching the backend API responses

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
  recommendations: string[];
  nutrientGaps: string[];
  analysisCount: number;
  processingTime: number;
  cacheHitRate: number;
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