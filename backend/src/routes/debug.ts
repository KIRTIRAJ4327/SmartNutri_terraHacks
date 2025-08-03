/**
 * Debug Routes for Component Testing
 * Separate endpoints to test each part of the pipeline
 */

import { Router } from 'express';
import { OCRService } from '../services/ocrService';
import { NutritionService } from '../services/nutritionService';
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ dest: './uploads/' });

const ocrService = new OCRService();
const nutritionService = new NutritionService();

// Test 1: OCR Only - Upload image and get raw text
router.post('/test-ocr-only', upload.single('image'), async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing OCR Only');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('📄 File:', req.file.originalname, req.file.size, 'bytes');
    
    const rawText = await ocrService.extractText(req.file.path);
    
    console.log('📝 OCR Result Length:', rawText.length);
    console.log('📝 OCR Preview:', rawText.substring(0, 300));
    
    // Cleanup
    await ocrService.cleanupFile(req.file.path);
    
    res.json({
      success: true,
      test: 'OCR Only',
      fileName: req.file.originalname,
      textLength: rawText.length,
      rawText: rawText,
      preview: rawText.substring(0, 500)
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] OCR Test Failed:', error);
    res.status(500).json({ 
      error: 'OCR test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test 2: Parsing Only - Send text and get products
router.post('/test-parsing-only', (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing Parsing Only');
    
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    console.log('📝 Input text length:', text.length);
    console.log('📝 Input preview:', text.substring(0, 200));
    
    const items = ocrService.parseReceiptText(text);
    
    console.log('🛒 Parsed items count:', items.length);
    console.log('🛒 Parsed items:', items);
    
    res.json({
      success: true,
      test: 'Parsing Only',
      inputLength: text.length,
      itemsFound: items.length,
      items: items
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Parsing Test Failed:', error);
    res.status(500).json({ 
      error: 'Parsing test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test 3: Nutrition Only - Send products and get analysis
router.post('/test-nutrition-only', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing Nutrition Only');
    
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'No items array provided' });
    }
    
    console.log('🛒 Input items count:', items.length);
    console.log('🛒 Input items:', items);
    
    const analysis = await nutritionService.analyzeProducts(items);
    
    console.log('📊 Analysis result:', analysis);
    
    res.json({
      success: true,
      test: 'Nutrition Only',
      inputCount: items.length,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Nutrition Test Failed:', error);
    res.status(500).json({ 
      error: 'Nutrition test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test 4: Known Good Data - Hardcoded test with expected results
router.get('/test-known-data', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing with Known Good Data');
    
    // Test with simple, known products
    const testItems = [
      { name: "COCA COLA", price: 2.99, confidence: 0.9 },
      { name: "BANANAS", price: 1.49, confidence: 0.9 },
      { name: "MILK", price: 3.99, confidence: 0.9 }
    ];
    
    console.log('🛒 Test items:', testItems);
    
    const analysis = await nutritionService.analyzeProducts(testItems);
    
    console.log('📊 Analysis for known data:', analysis);
    
    // Check if results are suspicious
    const scores = [analysis.overallScore, analysis.sodiumScore, analysis.processingScore, analysis.sugarScore, analysis.nutrientScore];
    const allSame = scores.every(score => score === scores[0]);
    
    res.json({
      success: true,
      test: 'Known Good Data',
      testItems: testItems,
      analysis: analysis,
      suspicious: allSame,
      allScoresIdentical: allSame ? scores[0] : false
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Known Data Test Failed:', error);
    res.status(500).json({ 
      error: 'Known data test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test 5: Environment Check - Verify all APIs are working
router.get('/test-environment', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing Environment Setup');
    
    const results: {
      googleVision: boolean;
      nutritionAPIs: boolean;
      environment: string | undefined;
      hasGoogleCloudKey: boolean;
      hasGoogleCloudProject: boolean;
      hasAPIKey: boolean;
      errors: string[];
    } = {
      googleVision: false,
      nutritionAPIs: false,
      environment: process.env.NODE_ENV,
      hasGoogleCloudKey: !!process.env.GOOGLE_CLOUD_KEY_PATH,
      hasGoogleCloudProject: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      hasAPIKey: !!process.env.GOOGLE_CLOUD_API_KEY,
      errors: []
    };
    
    // Test Google Vision
    try {
      const testOCR = new OCRService();
      results.googleVision = true;
      console.log('✅ Google Vision API initialized');
    } catch (error) {
      results.errors.push('Google Vision: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.log('❌ Google Vision failed');
    }
    
    // Test nutrition service
    try {
      const testNutrition = new NutritionService();
      const testResult = await testNutrition.analyzeProducts([
        { name: "TEST PRODUCT", price: 1.99, confidence: 0.9 }
      ]);
      results.nutritionAPIs = testResult.overallScore !== undefined;
      console.log('✅ Nutrition service working');
    } catch (error) {
      results.errors.push('Nutrition: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.log('❌ Nutrition service failed');
    }
    
    res.json({
      success: true,
      test: 'Environment Check',
      results: results
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Environment Test Failed:', error);
    res.status(500).json({ 
      error: 'Environment test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;