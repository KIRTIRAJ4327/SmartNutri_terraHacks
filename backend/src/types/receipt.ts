export interface ReceiptItem {
  name: string;
  price: number;
  confidence: number;
}

export interface ReceiptAnalysis {
  items: ReceiptItem[];
  totalItems: number;
  totalAmount?: number;
  processingTime: number;
}

export interface OCRResult {
  rawText: string;
  items: ReceiptItem[];
  confidence: number;
}