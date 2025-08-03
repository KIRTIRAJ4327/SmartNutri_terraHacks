export interface UserPreferences {
  goal: 'weight_management' | 'heart_health' | 'diabetes_care' | 'fitness' | 'general_wellness';
  focusAreas: string[];
  dietaryRestrictions?: string[];
  createdAt: Date;
  userName?: string; // Sweet personalization! 😊
}

export interface ManualProduct {
  name: string;
  quantity: number;
  unit: 'pieces' | 'lb' | 'kg' | 'oz' | 'cups' | 'servings';
  confidence: number; // Set to 1.0 for manual entries
}

export interface ManualEntry {
  products: ManualProduct[];
  entryDate: Date;
  source: 'manual';
}