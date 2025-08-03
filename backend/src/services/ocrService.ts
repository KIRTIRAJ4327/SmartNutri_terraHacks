import * as vision from '@google-cloud/vision';
import { ReceiptItem } from '../types/receipt';
import * as fs from 'fs';

export class OCRService {
  private client: vision.ImageAnnotatorClient | null = null;

  constructor() {
    try {
      // Check for API key first (simpler method)
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      
      if (apiKey && projectId) {
        // Use API key authentication (simpler setup)
        this.client = new vision.ImageAnnotatorClient({
          apiKey: apiKey,
          projectId: projectId,
        });
        console.log('✅ Google Vision API client initialized with API key');
        return;
      }
      
      // Fallback to service account JSON file method
      const keyPath = process.env.GOOGLE_CLOUD_KEY_PATH;
      
      if (!keyPath || !projectId) {
        throw new Error('Google Cloud credentials not configured. Please set either:\n' +
          '1. GOOGLE_CLOUD_API_KEY and GOOGLE_CLOUD_PROJECT_ID (recommended), or\n' +
          '2. GOOGLE_CLOUD_KEY_PATH and GOOGLE_CLOUD_PROJECT_ID');
      }
      
      // Type assertion after null check - we know they're strings now
      const validKeyPath = keyPath as string;
      const validProjectId = projectId as string;
      
      if (!fs.existsSync(validKeyPath)) {
        throw new Error(`Google Cloud key file not found at: ${validKeyPath}`);
      }

      // Set up Google Cloud credentials with service account
      this.client = new vision.ImageAnnotatorClient({
        keyFilename: validKeyPath,
        projectId: validProjectId,
      });
      
      console.log('✅ Google Vision API client initialized with service account');
    } catch (err) {
      const error = err as Error;
      console.error('❌ Failed to initialize Google Vision API:', error.message);
      throw error;
    }
  }

  async extractText(imagePath: string): Promise<string> {
    if (!this.client) {
      throw new Error('Google Vision API client not initialized');
    }

    try {
      // Validate image format
      if (!this.validateImageFormat(imagePath)) {
        throw new Error('Unsupported image format. Please use JPG, PNG, or other supported formats.');
      }

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      console.log(`🔄 Extracting text from: ${imagePath}`);
      
      // Perform text detection
      const [result] = await this.client.textDetection(imagePath);
      
      if (!result.textAnnotations || result.textAnnotations.length === 0) {
        throw new Error('No text detected in the image. Please ensure the receipt is clear and well-lit.');
      }
      
      const fullText = result.textAnnotations[0].description || '';
      
      if (fullText.trim().length === 0) {
        throw new Error('No readable text found in the image.');
      }
      
      console.log(`✅ Extracted ${fullText.length} characters of text`);
      return fullText;
      
    } catch (err) {
      const error = err as Error;
      
      // Handle specific Google Vision API errors
      if (error.message.includes('quota')) {
        throw new Error('Google Vision API quota exceeded. Please check your billing and quota settings.');
      }
      
      if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Permission denied. Your API key might not have Vision API enabled, or you need to use a service account. Please check your Google Cloud credentials and API permissions.');
      }
      
      if (error.message.includes('not been used') || error.message.includes('disabled')) {
        throw new Error('Google Vision API is not enabled. Please enable it in your Google Cloud Console.');
      }
      
      // Re-throw known errors or wrap unknown ones
      if (error.message.includes('Image file') || 
          error.message.includes('No text detected') || 
          error.message.includes('No readable text') ||
          error.message.includes('Unsupported image format') ||
          error.message.includes('not initialized')) {
        throw error;
      }
      
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  parseReceiptText(rawText: string): ReceiptItem[] {
    const lines = rawText.split('\n').filter(line => line.trim().length > 1);
    const items: ReceiptItem[] = [];

    console.log('📝 DEBUG: All lines from OCR:', lines);

    // Enhanced regex patterns for Canadian stores
    const priceOnlyRegex = /^\s*\$?(\d+\.\d{2})\s*[A-Z]?\s*$/; // Price with optional $ and tax letter
    const productLineRegex = /^\s*\d{5,}\s+(.+)$/; // Product code followed by product name (Costco style)
    const nameAndPriceRegex = /^(.+?)\s+\$(\d+\.\d{2})$/; // Name followed by price on same line
    
    // Walmart Canada specific patterns
    const walmartItemRegex = /^\s*(.+?)\s+(\d{12,14})\s*$/; // Product name + barcode
    const walmartPriceRegex = /^\s*\$(\d+\.\d{2})\s*[NTH]?\s*$/; // Price with tax code (N=Non-taxable, T=Taxable, H=HST)
    
    // Canadian-specific non-food keywords including French terms
    const commonNonFoodKeywords = [
      // English terms
      'total', 'subtotal', 'tax', 'hst', 'gst', 'pst', 'cash', 'credit', 'debit',
      'change', 'balance', 'card', 'entry', 'pin', 'approved', 'member', 'rewards',
      'points', 'savings', 'discount', 'coupon', 'rounding', 'invoice', 'clerk',
      'register', 'customer', 'receipt', 'phone', 'website', 'inc', 'ltd', 'llc',
      'authorization', 'auth', 'terminal', 'tran', 'seq', 'number', 'items', 'sold',
      'wholesale', 'thornton', 'washington', 'member', 'check', 'prntd', 'visa',
      'mastercard', 'tender', 'approval', 'reference', 'walmart', 'store', 'manager',
      'cashier', 'thank', 'you', 'visit', 'again', 'location', 'hours', 'survey',
      // French terms (for Quebec and bilingual receipts)
      'total', 'sous-total', 'taxe', 'tps', 'tvq', 'argent', 'crédit', 'débit',
      'monnaie', 'solde', 'carte', 'entrée', 'nip', 'approuvé', 'membre', 'récompenses',
      'points', 'économies', 'rabais', 'coupon', 'arrondi', 'facture', 'commis',
      'caisse', 'client', 'reçu', 'téléphone', 'site', 'web', 'inc', 'ltée',
      'autorisation', 'terminal', 'merci', 'visite', 'encore', 'magasin'
    ];

    // Process lines looking for different patterns
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      const prevLine = i > 0 ? lines[i - 1].trim() : '';

      console.log(`📝 DEBUG: Checking line ${i}: "${currentLine}" | Next: "${nextLine}" | Prev: "${prevLine}"`);

      // Pattern 1: Costco style (product code + name, then price on next line)
      const productMatch = currentLine.match(productLineRegex);
      const priceMatch = nextLine.match(priceOnlyRegex);

      if (productMatch && priceMatch) {
        const productName = productMatch[1].trim();
        const price = parseFloat(priceMatch[1]);
        
        if (this.processProduct(productName, price, commonNonFoodKeywords, items)) {
          i++; // Skip the price line since we've processed it
        }
        continue;
      }

      // Pattern 2: Walmart Canada style (product name + barcode, then price)
      const walmartItemMatch = currentLine.match(walmartItemRegex);
      const walmartPriceMatch = nextLine.match(walmartPriceRegex);
      
      if (walmartItemMatch && walmartPriceMatch) {
        const productName = walmartItemMatch[1].trim();
        const price = parseFloat(walmartPriceMatch[1]);
        
        console.log(`📝 DEBUG: Found Walmart pattern: "${productName}" - $${price}`);
        if (this.processProduct(productName, price, commonNonFoodKeywords, items)) {
          i++; // Skip the price line
        }
        continue;
      }

      // Pattern 3: Name and price on same line (restaurant style)
      const namePrice = currentLine.match(nameAndPriceRegex);
      if (namePrice) {
        const productName = namePrice[1].trim();
        const price = parseFloat(namePrice[2]);
        
        this.processProduct(productName, price, commonNonFoodKeywords, items);
        continue;
      }

      // Pattern 4: Canadian store patterns - product name on one line, price on next
      if (this.looksLikeFoodProduct(currentLine) && nextLine.match(priceOnlyRegex)) {
        const productName = currentLine;
        const price = parseFloat(nextLine.match(priceOnlyRegex)![1]);
        
        if (this.processProduct(productName, price, commonNonFoodKeywords, items)) {
          i++; // Skip the price line
        }
        continue;
      }

      // Pattern 5: Per-pound pricing format - look for product name before weight/price lines
      const perPoundRegex = /^\d+\.\d+\s+lb.*\$\d+\.\d+.*per\s+lb$/i;
      const finalPriceRegex = /^\$(\d+\.\d{2})$/;
      
      if (perPoundRegex.test(currentLine) && nextLine.match(finalPriceRegex)) {
        // Look for the product name in the previous lines (up to 3 lines back)
        for (let j = 1; j <= 3; j++) {
          const productLine = i - j >= 0 ? lines[i - j].trim() : '';
          if (productLine && this.looksLikeFoodProduct(productLine) && 
              !productLine.match(priceOnlyRegex) && 
              !perPoundRegex.test(productLine)) {
            
            const productName = productLine;
            const price = parseFloat(nextLine.match(finalPriceRegex)![1]);
            
            // Check if we haven't already processed this item
            const alreadyExists = items.some(item => 
              item.name === productName.trim() && Math.abs(item.price - price) < 0.01
            );
            
            if (!alreadyExists) {
              console.log(`📝 DEBUG: Found per-pound item: "${productName}" - $${price}`);
              this.processProduct(productName, price, commonNonFoodKeywords, items);
            }
            break;
          }
        }
        i++; // Skip the price line
        continue;
      }

      // Pattern 6: Price on current line, product name on previous line (some Canadian stores)
      if (currentLine.match(priceOnlyRegex) && this.looksLikeFoodProduct(prevLine)) {
        const productName = prevLine;
        const price = parseFloat(currentLine.match(priceOnlyRegex)![1]);
        
        // Check if we haven't already processed this item
        const alreadyExists = items.some(item => 
          item.name === productName.trim() && Math.abs(item.price - price) < 0.01
        );
        
        if (!alreadyExists) {
          this.processProduct(productName, price, commonNonFoodKeywords, items);
        }
        continue;
      }
    }

    // Remove duplicates
    const uniqueItems = items.filter((item, index, self) =>
      index === self.findIndex(t => t.name === item.name && t.price === item.price)
    );

    console.log(`📝 DEBUG: Final unique items count: ${uniqueItems.length}`, uniqueItems);
    return uniqueItems;
  }

  private looksLikeFoodProduct(line: string): boolean {
    const foodKeywords = [
      // Proteins
      'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna', 'ham', 'bacon',
      'sausage', 'ground', 'steak', 'roast', 'chops', 'wings', 'breast', 'thigh',
      
      // Dairy & Eggs
      'milk', 'cheese', 'eggs', 'butter', 'yogurt', 'cream', 'sour', 'cottage',
      'cheddar', 'mozzarella', 'parmesan', 'swiss', 'goat', 'yoghurt',
      
      // Fruits & Vegetables
      'apple', 'banana', 'orange', 'tomato', 'potato', 'onion', 'carrot', 'lettuce',
      'spinach', 'broccoli', 'celery', 'cucumber', 'pepper', 'mushroom', 'corn',
      'peas', 'beans', 'avocado', 'strawberry', 'grape', 'lemon', 'lime', 'garlic',
      'ginger', 'cilantro', 'parsley', 'basil', 'kale', 'cabbage', 'cauliflower',
      
      // Grains & Starches  
      'bread', 'rice', 'pasta', 'cereal', 'oats', 'quinoa', 'flour', 'bagel',
      'tortilla', 'crackers', 'chips', 'pretzels', 'granola', 'muffin',
      
      // Canned & Packaged Foods
      'soup', 'sauce', 'salsa', 'beans', 'tomatoes', 'corn', 'peas', 'tuna',
      'salmon', 'sardines', 'olives', 'pickles', 'jam', 'jelly', 'peanut',
      'almond', 'cashew', 'walnut', 'raisins', 'dried', 'canned', 'jarred',
      'frozen', 'diced', 'whole', 'sliced', 'crushed', 'paste', 'puree',
      
      // Beverages
      'juice', 'soda', 'water', 'coffee', 'tea', 'beer', 'wine', 'cola',
      'sprite', 'pepsi', 'coke', 'ginger ale', 'kombucha', 'smoothie',
      
      // Snacks & Treats
      'pizza', 'burger', 'sandwich', 'salad', 'cookie', 'chocolate', 'candy',
      'ice cream', 'cake', 'pie', 'donut', 'muffin', 'brownie',
      
      // Cooking ingredients
      'oil', 'vinegar', 'salt', 'pepper', 'sugar', 'honey', 'syrup', 'vanilla',
      'cinnamon', 'oregano', 'thyme', 'rosemary', 'cumin', 'paprika',
      
      // Canadian/International
      'maple', 'syrup', 'tourtiere', 'poutine', 'tim', 'hortons', 'kraft',
      'presidents', 'choice', 'no name', 'great value', 'compliments',
      
      // Generic food terms
      'organic', 'natural', 'fresh', 'lean', 'fat-free', 'low-fat', 'whole',
      'grain', 'wheat', 'gluten', 'free', 'diet', 'light', 'reduced',
      'sodium', 'unsalted', 'sweet', 'spicy', 'mild', 'hot', 'cold'
    ];
    
    const lowerLine = line.toLowerCase();
    
    // Check for food keywords
    const hasKeyword = foodKeywords.some(keyword => lowerLine.includes(keyword));
    
    // Check for all caps text (common for product names)
    const isAllCaps = /^[A-Z\s&%-]{3,}$/.test(line);
    
    // Check for product patterns (brand + descriptor)
    const hasProductPattern = /\b(great value|no name|presidents choice|compliments|kirkland|organic|natural)\b/i.test(line);
    
    // Check for measurement indicators (often food items)
    const hasMeasurement = /\b(\d+\s*(g|kg|ml|l|oz|lb|lbs|count|ct|pack|pk))\b/i.test(line);
    
    // Check for food-specific patterns
    const hasFoodPattern = /\b(pack of|case of|\d+\s*pack|\d+\s*ct|dozen|fresh|frozen|canned)\b/i.test(line);
    
    return hasKeyword || (isAllCaps && line.length < 50) || hasProductPattern || hasMeasurement || hasFoodPattern;
  }

  private processProduct(productName: string, price: number, nonFoodKeywords: string[], items: ReceiptItem[]): boolean {
    console.log(`📝 DEBUG: Found potential product: "${productName}" - $${price}`);

    // Validate price range
    if (price > 500 || price < 0.1) {
      console.log(`📝 DEBUG: Price out of range: $${price}`);
      return false;
    }

    // Clean product name
    let cleanedName = productName
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&%#-]/g, '')
      .trim();

    console.log(`📝 DEBUG: Cleaned name: "${cleanedName}"`);

    // Validate product name
    if (cleanedName.length < 2 || !/[a-zA-Z]/.test(cleanedName)) {
      console.log(`📝 DEBUG: Product name too short or no letters: "${cleanedName}"`);
      return false;
    }

    // Check against non-food keywords
    const lowerCaseName = cleanedName.toLowerCase();
    if (nonFoodKeywords.some(keyword => lowerCaseName.includes(keyword))) {
      console.log(`📝 DEBUG: Filtered out non-food keyword: "${cleanedName}"`);
      return false;
    }

    // Skip if contains long numbers (likely codes)
    if (/\d{4,}/.test(cleanedName)) {
      console.log(`📝 DEBUG: Filtered out long numbers: "${cleanedName}"`);
      return false;
    }

    // Calculate confidence
    let confidence = 0.75;
    if (/^[A-Z\s&%-]+$/.test(cleanedName)) confidence += 0.1;
    if (cleanedName.length > 4) confidence += 0.05;
    if (price > 1.0) confidence += 0.05;

    const item = {
      name: cleanedName,
      price: price,
      confidence: Math.min(Math.round(confidence * 100) / 100, 0.95)
    };

    console.log(`📝 DEBUG: Adding item:`, item);
    items.push(item);
    return true;
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
   * Extract date from receipt text
   */
  extractReceiptDate(rawText: string): { date: Date | null; confidence: number } {
    const lines = rawText.split('\n');
    
    // Common date patterns on receipts
    const datePatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,           // MM/DD/YYYY or MM-DD-YYYY
      /(\d{2,4}[-\/]\d{1,2}[-\/]\d{1,2})/,           // YYYY/MM/DD or YYYY-MM-DD
      /(\w{3}[-\s]\d{1,2}[-\s]\d{2,4})/,             // Jun-26-2025
      /(\d{1,2}\s+\w{3}\s+\d{2,4})/,                 // 26 Jun 2025
      /(\w{3}\s+\d{1,2},?\s+\d{2,4})/,               // Jun 26, 2025
      /(\d{1,2}:\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4})/ // Time with date
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            const dateStr = match[1];
            console.log(`📅 Found potential date: "${dateStr}" in line: "${line}"`);
            
            // Try to parse the date
            let parsedDate: Date | null = null;
            
            // Handle different formats
            if (dateStr.includes('-') || dateStr.includes('/')) {
              parsedDate = new Date(dateStr);
            } else if (dateStr.includes(' ')) {
              parsedDate = new Date(dateStr);
            }
            
            // Validate the parsed date
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              const currentYear = new Date().getFullYear();
              const dateYear = parsedDate.getFullYear();
              
              // Reasonable date range check (past 5 years to future 1 year)
              if (dateYear >= currentYear - 5 && dateYear <= currentYear + 1) {
                console.log(`✅ Valid receipt date found: ${parsedDate.toISOString().split('T')[0]}`);
                return { date: parsedDate, confidence: 0.9 };
              }
            }
          } catch (error) {
            console.log(`❌ Failed to parse date: ${match[1]}`);
            continue;
          }
        }
      }
    }
    
    console.log(`⚠️ No valid date found in receipt`);
    return { date: null, confidence: 0 };
  }

  /**
   * Extract store information from receipt
   */
  extractStoreInfo(rawText: string): { 
    storeName: string | null; 
    location: string | null; 
    confidence: number 
  } {
    const lines = rawText.split('\n');
    let storeName: string | null = null;
    let location: string | null = null;
    
    // Common store patterns
    const storePatterns = [
      /^(COSTCO|WALMART|METRO|LOBLAWS|SOBEYS|SAFEWAY|SUPERSTORE)/i,
      /^([A-Z\s]{3,30})\s+(SUPERMARKET|GROCERY|MARKET|STORE)/i,
      /^([A-Z\s&]+)\s+INC\.?$/i
    ];
    
    // Location patterns
    const locationPatterns = [
      /([A-Z\s]+),\s+(ON|BC|AB|SK|MB|QC|NB|NS|PE|NL|YT|NT|NU)\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d/i, // Canadian postal code
      /(\d+\s+[A-Z\s]+(?:ST|AVE|BLVD|RD|DR|WAY|LANE)\.?)/i // Street address
    ];
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      
      // Check for store name
      if (!storeName) {
        for (const pattern of storePatterns) {
          const match = line.match(pattern);
          if (match) {
            storeName = match[1] || match[0];
            console.log(`🏪 Found store: "${storeName}"`);
            break;
          }
        }
      }
      
      // Check for location
      if (!location) {
        for (const pattern of locationPatterns) {
          const match = line.match(pattern);
          if (match) {
            location = match[0];
            console.log(`📍 Found location: "${location}"`);
            break;
          }
        }
      }
    }
    
    const confidence = (storeName ? 0.5 : 0) + (location ? 0.4 : 0);
    return { storeName, location, confidence };
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
    receiptDate: { date: Date | null; confidence: number };
    storeInfo: { storeName: string | null; location: string | null; confidence: number };
  }> {
    const rawText = await this.extractText(imagePath);
    const items = this.parseReceiptText(rawText);
    const textQuality = this.analyzeTextQuality(rawText);
    const receiptDate = this.extractReceiptDate(rawText);
    const storeInfo = this.extractStoreInfo(rawText);
    
    const totalItems = items.length;
    const averagePrice = totalItems > 0 
      ? Math.round((items.reduce((sum, item) => sum + item.price, 0) / totalItems) * 100) / 100
      : 0;

    return {
      rawText,
      items,
      textQuality,
      totalItems,
      averagePrice,
      receiptDate,
      storeInfo
    };
  }

  /**
   * Clean up temporary files after processing
   */
  async cleanupFile(filePath: string): Promise<void> {
    // try {
    //   if (fs.existsSync(filePath)) {
    //     fs.unlinkSync(filePath);
    //   }
    // } catch (error) {
    //   console.warn('Failed to cleanup temporary file:', filePath, error);
    // }
  }
}