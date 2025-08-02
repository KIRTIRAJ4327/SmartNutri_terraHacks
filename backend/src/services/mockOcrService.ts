import { ReceiptItem } from '../types/receipt';

/**
 * Mock OCR Service for testing without Google Vision API
 * Returns realistic receipt data for development
 */
export class MockOCRService {
  async extractText(imagePath: string): Promise<string> {
    console.log('🔄 MockOCRService: Simulating OCR extraction...');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock receipt text
    return `METRO GROCERY STORE
123 MAIN ST, TORONTO ON
DATE: 2024-08-02 15:30

BANANAS ORGANIC        2.49
BREAD WHOLE WHEAT      3.99
MILK 2% 1L            4.29
COCA COLA 2L          2.99
CHIPS LAYS REGULAR    4.49
CHICKEN BREAST        12.99
BROCCOLI FRESH        3.49
ORANGE JUICE 1L       5.99
YOGURT GREEK PLAIN    6.99
APPLES ROYAL GALA     4.99

SUBTOTAL             52.70
TAX                   6.85
TOTAL                59.55

THANK YOU FOR SHOPPING!`;
  }

  parseReceiptText(rawText: string): ReceiptItem[] {
    console.log('🔄 MockOCRService: Parsing receipt text...');
    
    const lines = rawText.split('\n').filter(line => line.trim());
    const items: ReceiptItem[] = [];
    
    // Enhanced parsing patterns
    const priceRegex = /\$?(\d+\.?\d{2})\s*$/;
    const excludePatterns = [
      /^(METRO|GROCERY|STORE|DATE|SUBTOTAL|TAX|TOTAL|THANK|CASH|CARD|CHANGE)/i,
      /^\d{1,3}\s+(MAIN|ST|STREET|AVE|AVENUE|BLVD|BOULEVARD)/i,
      /^\d{4}-\d{2}-\d{2}/,
      /^\d{2}:\d{2}/,
      /^[\d\s\-\(\)]+$/
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header/footer lines
      if (excludePatterns.some(pattern => pattern.test(line))) {
        continue;
      }
      
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        const productName = line.replace(priceMatch[0], '').trim();
        
        // Clean product name
        const cleanName = productName
          .replace(/^\d+\s*x?\s*/i, '') // Remove quantity
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanName.length > 2 && price > 0) {
          items.push({
            name: cleanName,
            price: price,
            confidence: 0.95 // High confidence for mock data
          });
        }
      }
    }
    
    console.log(`✅ MockOCRService: Found ${items.length} items`);
    return items;
  }
  
  /**
   * Simulate text quality analysis
   */
  analyzeTextQuality(text: string) {
    return {
      quality: 'good' as const,
      issues: [] as string[]
    };
  }
  
  /**
   * Process receipt with full workflow
   */
  async processReceipt(imagePath: string) {
    const rawText = await this.extractText(imagePath);
    const items = this.parseReceiptText(rawText);
    const quality = this.analyzeTextQuality(rawText);
    
    return {
      rawText,
      items,
      quality,
      processingTime: 1000,
      source: 'mock' as const
    };
  }
}