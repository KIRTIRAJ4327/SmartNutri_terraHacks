import express from 'express';
import { OCRService } from '../services/ocrService';
import { NutritionService } from '../services/nutritionService';

const router = express.Router();
const ocrService = new OCRService();
const nutritionService = new NutritionService();

// Extend Request type to include timing
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

// Middleware to add start time for performance tracking
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

router.post('/analyze', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided',
        details: 'Please upload a receipt image (JPG, PNG, HEIC up to 10MB)'
      });
    }

    console.log(`📸 Processing receipt: ${req.file.originalname} (${req.file.size} bytes)`);

    // Step 1: Extract text from receipt
    console.log('🔍 Step 1: Extracting text from receipt...');
    const rawText = await ocrService.extractText(req.file.path);
    console.log(`📝 Extracted ${rawText.length} characters of text`);
    
    // Step 2: Parse receipt items
    console.log('📊 Step 2: Parsing receipt items...');
    const items = ocrService.parseReceiptText(rawText);
    console.log(`🛒 Found ${items.length} potential products`);
    
    if (items.length === 0) {
      // Clean up uploaded file
      await ocrService.cleanupFile(req.file.path);
      
      return res.status(400).json({ 
        error: 'No products found in receipt',
        details: 'The image may be unclear or not contain a valid receipt',
        rawText: rawText.substring(0, 500) + '...', // Include snippet for debugging
        suggestions: [
          'Ensure the receipt is clearly visible and well-lit',
          'Try a different angle or distance',
          'Make sure the entire receipt is in frame'
        ]
      });
    }
    
    // Step 3: Analyze nutrition
    console.log('🥗 Step 3: Analyzing nutrition data...');
    const analysis = await nutritionService.analyzeProducts(items);
    console.log(`✅ Analysis complete with ${analysis.overallScore}/100 health score`);
    
    // Step 4: Calculate total processing time
    const processingTime = req.startTime ? Date.now() - req.startTime : 0;
    
    // Step 5: Clean up uploaded file
    await ocrService.cleanupFile(req.file.path);
    console.log('🧹 Temporary file cleaned up');
    
    // Step 6: Return comprehensive results
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime,
      receipt: {
        itemsFound: items.length,
        topItems: items.slice(0, 10), // Limit for demo/security
        textQuality: ocrService.analyzeTextQuality(rawText)
      },
      analysis: {
        ...analysis,
        processingTime // Override with total time
      },
      metadata: {
        fileInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        },
        performance: {
          totalProcessingTime: processingTime,
          nutritionAnalysisTime: analysis.processingTime,
          cacheHitRate: analysis.cacheHitRate,
          itemsAnalyzed: analysis.analysisCount
        }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Receipt analysis error:', error);
    
    // Clean up uploaded file in case of error
    if (req.file) {
      await ocrService.cleanupFile(req.file.path).catch(console.warn);
    }
    
    // Determine error type and provide appropriate response
    let statusCode = 500;
    let errorMessage = 'Failed to analyze receipt';
    let details = 'An unexpected error occurred during processing';
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // OCR-specific errors
      if (errorMsg.includes('no text detected') || errorMsg.includes('no readable text')) {
        statusCode = 400;
        errorMessage = 'No text detected in image';
        details = 'The image may be too blurry, dark, or not contain readable text';
      } else if (errorMsg.includes('file not found') || errorMsg.includes('file too large')) {
        statusCode = 400;
        errorMessage = 'Invalid file';
        details = error.message;
      } else if (errorMsg.includes('google cloud') || errorMsg.includes('vision api')) {
        statusCode = 503;
        errorMessage = 'OCR service temporarily unavailable';
        details = 'Please try again in a few moments';
      } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'Service temporarily overwhelmed';
        details = 'Please wait a moment before trying again';
      }
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details,
      timestamp: new Date().toISOString(),
      processingTime: req.startTime ? Date.now() - req.startTime : 0,
      support: {
        tips: [
          'Ensure good lighting when taking the photo',
          'Keep the receipt flat and fully visible',
          'Use a high-resolution image'
        ],
        contact: 'If problems persist, please contact support'
      }
    });
  }
});

// Additional route for testing OCR only (development/debugging)
router.post('/ocr-test', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const rawText = await ocrService.extractText(req.file.path);
    const items = ocrService.parseReceiptText(rawText);
    const textQuality = ocrService.analyzeTextQuality(rawText);
    
    await ocrService.cleanupFile(req.file.path);
    
    res.json({
      success: true,
      rawText,
      items,
      textQuality,
      itemCount: items.length,
      processingTime: req.startTime ? Date.now() - req.startTime : 0
    });
    
  } catch (error) {
    if (req.file) {
      await ocrService.cleanupFile(req.file.path).catch(console.warn);
    }
    
    res.status(500).json({ 
      error: 'OCR test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route for nutrition analysis only (for testing with mock data)
router.post('/nutrition-test', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: 'Expected array of items with name, price, and confidence'
      });
    }
    
    const analysis = await nutritionService.analyzeProducts(items);
    
    res.json({
      success: true,
      analysis,
      processingTime: req.startTime ? Date.now() - req.startTime : 0,
      cacheStats: nutritionService.getCacheStats()
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Nutrition test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as receiptRoutes };