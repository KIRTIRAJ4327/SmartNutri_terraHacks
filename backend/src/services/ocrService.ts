import * as vision from '@google-cloud/vision';
import { ReceiptItem } from '../types/receipt';
import * as fs from 'fs';
import { MockOCRService } from './mockOcrService';

export class OCRService {
  private client: vision.ImageAnnotatorClient | null = null;
  private mockService: MockOCRService;
  private useMock: boolean = false;

  constructor() {
    this.mockService = new MockOCRService();
    
    try {
      // Check if Google Cloud credentials are available
      const keyPath = process.env.GOOGLE_CLOUD_KEY_PATH;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      
      if (!keyPath || !projectId) {
        console.log('⚠️  Google Cloud credentials not configured, using mock OCR service');
        this.useMock = true;
        return;
      }
      
      if (!fs.existsSync(keyPath)) {
        console.log('⚠️  Google Cloud key file not found, using mock OCR service');
        this.useMock = true;
        return;
      }

      // Set up Google Cloud credentials
      this.client = new vision.ImageAnnotatorClient({
        keyFilename: keyPath,
        projectId: projectId,
      });
      
      console.log('✅ Google Vision API client initialized');
    } catch (error) {
      console.log('⚠️  Failed to initialize Google Vision API, using mock OCR service:', error instanceof Error ? error.message : 'Unknown error');
      this.useMock = true;
    }
  }

  async extractText(imagePath: string): Promise<string> {
    // Use mock service if Google Cloud is not configured
    if (this.useMock || !this.client) {
      return await this.mockService.extractText(imagePath);
    }

    try {
      // Validate file exists and is readable
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Validate image format
      if (!this.validateImageFormat(imagePath)) {
        throw new Error('Unsupported image format. Please use JPG, PNG, BMP, GIF, WEBP, or TIFF');
      }

      const stats = fs.statSync(imagePath);
      if (stats.size === 0) {
        throw new Error('Image file is empty');
      }

      if (stats.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file too large (max 10MB)');
      }

      const [result] = await this.client.textDetection(imagePath);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        throw new Error('No text detected in image');
      }

      const extractedText = detections[0].description || '';
      
      if (extractedText.trim().length === 0) {
        throw new Error('No readable text found in image');
      }

      return extractedText;
    } catch (error) {
      console.error('OCR Error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
          throw new Error('Google Cloud credentials not configured properly');
        }
        
        if (error.message.includes('quota')) {
          throw new Error('Google Vision API quota exceeded');
        }
        
        if (error.message.includes('permission')) {
          throw new Error('Insufficient permissions for Google Vision API');
        }
        
        // Re-throw known errors or wrap unknown ones
        if (error.message.includes('Image file') || error.message.includes('No text detected') || error.message.includes('No readable text')) {
          throw error;
        }
      }
      
      throw new Error('Failed to extract text from image');
    }
  }

  parseReceiptText(rawText: string): ReceiptItem[] {
    const lines = rawText.split('\n').filter(line => line.trim());
    const items: ReceiptItem[] = [];
    
    // Enhanced parsing logic - look for patterns like:
    // "PRODUCT NAME    $XX.XX"
    // "BANANAS         2.49"
    // "MILK 2%      4.99"
    // "APPLE JUICE    $3.50"
    
    const priceRegex = /\$?\d+\.\d{2}/;
    const excludePatterns = [
      /^total/i,
      /^subtotal/i,
      /^tax/i,
      /^hst/i,
      /^gst/i,
      /^pst/i,
      /^cash/i,
      /^credit/i,
      /^debit/i,
      /^change/i,
      /^balance/i,
      /^\d{2}\/\d{2}\/\d{4}/, // dates
      /^\d{4}-\d{2}-\d{2}/, // dates
      /^store/i,
      /^receipt/i,
      /^thank you/i,
      /^customer/i,
      /^cashier/i,
      /^ref/i,
      /^trans/i
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip lines that match exclude patterns
      if (excludePatterns.some(pattern => pattern.test(line))) {
        continue;
      }
      
      const priceMatch = line.match(priceRegex);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace('$', ''));
        
        // Skip unreasonable prices (likely not products)
        if (price > 1000 || price < 0.01) {
          continue;
        }
        
        let productName = line.replace(priceMatch[0], '').trim();
        
        // Clean up product name
        productName = productName
          .replace(/^\d+\s*x\s*/i, '') // Remove quantity multipliers like "2 x"
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/[^\w\s&%-]/g, '') // Remove special characters except common ones
          .trim();
        
        // Filter out short/invalid names and ensure it looks like a product
        if (productName.length > 2 && productName.length < 50 && /[a-zA-Z]/.test(productName)) {
          // Calculate confidence based on various factors
          let confidence = 0.8;
          
          // Higher confidence for well-formatted product names
          if (/^[A-Z][A-Z\s&%-]+$/.test(productName)) {
            confidence = 0.9;
          }
          
          // Lower confidence for names with numbers or unusual patterns
          if (/\d/.test(productName) || productName.length < 4) {
            confidence = 0.6;
          }
          
          items.push({
            name: productName,
            price: price,
            confidence: Math.round(confidence * 100) / 100
          });
        }
      }
    }
    
    // Remove duplicate items (same name and price)
    const uniqueItems = items.filter((item, index, self) => 
      index === self.findIndex(t => t.name === item.name && t.price === item.price)
    );
    
    return uniqueItems;
  }

  /**
   * Validates if an image file is a supported format
   */
  private validateImageFormat(filePath: string): boolean {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.tiff'];
    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    return supportedExtensions.includes(extension);
  }

  /**
   * Analyzes the quality of extracted text to provide feedback
   */
  analyzeTextQuality(rawText: string): { quality: 'good' | 'fair' | 'poor'; issues: string[] } {
    const issues: string[] = [];
    let quality: 'good' | 'fair' | 'poor' = 'good';

    // Check text length
    if (rawText.length < 50) {
      issues.push('Very short text detected - receipt might be too small or blurry');
      quality = 'poor';
    }

    // Check for garbled text (too many special characters)
    const specialCharRatio = (rawText.match(/[^a-zA-Z0-9\s$.,]/g) || []).length / rawText.length;
    if (specialCharRatio > 0.3) {
      issues.push('Text appears garbled - image quality might be poor');
      if (quality === 'good') quality = 'fair';
    }

    // Check for presence of price patterns
    const priceMatches = rawText.match(/\$?\d+\.\d{2}/g) || [];
    if (priceMatches.length === 0) {
      issues.push('No price patterns detected - this might not be a receipt');
      quality = 'poor';
    } else if (priceMatches.length < 3) {
      issues.push('Few price patterns detected - receipt might be incomplete');
      if (quality === 'good') quality = 'fair';
    }

    return { quality, issues };
  }

  /**
   * Process a receipt image and return complete analysis
   */
  async processReceipt(imagePath: string): Promise<{
    rawText: string;
    items: ReceiptItem[];
    textQuality: { quality: 'good' | 'fair' | 'poor'; issues: string[] };
    totalItems: number;
    averagePrice: number;
  }> {
    const rawText = await this.extractText(imagePath);
    const items = this.parseReceiptText(rawText);
    const textQuality = this.analyzeTextQuality(rawText);
    
    const totalItems = items.length;
    const averagePrice = totalItems > 0 
      ? Math.round((items.reduce((sum, item) => sum + item.price, 0) / totalItems) * 100) / 100
      : 0;

    return {
      rawText,
      items,
      textQuality,
      totalItems,
      averagePrice
    };
  }

  /**
   * Clean up temporary files after processing
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary file:', filePath, error);
    }
  }
}