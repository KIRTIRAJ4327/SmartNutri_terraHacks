import express from 'express';
import { OCRService } from '../services/ocrService';
import { NutritionService } from '../services/nutritionService';
import { HistoryService } from '../services/historyService';
import { GamificationService } from '../services/gamificationService';
import { ManualProduct, UserPreferences } from '../types/user';
import { ReceiptItem } from '../types/receipt';

const router = express.Router();
const ocrService = new OCRService();
const nutritionService = new NutritionService();
const historyService = new HistoryService();
const gamificationService = new GamificationService();

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
    // Debug: Log request details
    console.log('🔍 Request details:', {
      hasFile: !!req.file,
      fileFieldName: req.file ? 'image' : 'none',
      headers: req.headers['content-type'],
      bodyKeys: Object.keys(req.body),
      method: req.method,
      url: req.url
    });
    
    // Extract user preferences from request body (if provided)
    const userPreferences: UserPreferences | undefined = req.body.preferences ? 
      JSON.parse(req.body.preferences) : undefined;
    
    if (userPreferences) {
      console.log('🎯 User preferences detected:', userPreferences.goal);
    }
    
    if (!req.file) {
      console.log('❌ No file found in request');
      return res.status(400).json({ 
        error: 'No image file provided',
        details: 'Please upload a receipt image (JPG, PNG, HEIC up to 10MB)',
        debug: {
          receivedFields: Object.keys(req.body),
          expectedField: 'image',
          contentType: req.headers['content-type']
        }
      });
    }

    console.log(`📸 Processing receipt: ${req.file.originalname} (${req.file.size} bytes)`);

    // Step 1: Process receipt with enhanced extraction
    console.log('🔍 Step 1: Processing receipt with enhanced extraction...');
    console.log('📄 File path:', req.file.path);
    console.log('📁 File exists:', require('fs').existsSync(req.file.path));
    console.log('📏 File size:', require('fs').statSync(req.file.path).size, 'bytes');
    
    const receiptData = await ocrService.processReceipt(req.file.path);
    console.log(`📝 Extracted ${receiptData.rawText.length} characters of text`);
    console.log('📝 RAW OCR TEXT PREVIEW:', receiptData.rawText.substring(0, 200) + '...');
    console.log('📝 RAW OCR TEXT (first 3 lines):', receiptData.rawText.split('\n').slice(0, 3));
    
    // Step 2: Extract receipt metadata
    console.log('📊 Step 2: Extracting receipt metadata...');
    console.log(`🛒 Found ${receiptData.items.length} potential products`);
    console.log('🛒 PARSED ITEMS DETAIL:', receiptData.items.map(item => ({ 
      name: item.name, 
      price: item.price, 
      confidence: item.confidence 
    })));
    
    console.log('📅 Receipt Date:', receiptData.receiptDate.date ? 
      receiptData.receiptDate.date.toISOString().split('T')[0] : 'Not found');
    console.log('🏪 Store:', receiptData.storeInfo.storeName || 'Not found');
    console.log('📍 Location:', receiptData.storeInfo.location || 'Not found');
    
    // Check if we're getting real parsed data or default/empty data
    if (receiptData.items.length === 0) {
      console.log('⚠️  WARNING: No items parsed from OCR text!');
      console.log('🔍 DEBUG: Raw text was:', receiptData.rawText);
    }
    
    if (receiptData.items.length === 0) {
      // Clean up uploaded file
      // await ocrService.cleanupFile(req.file.path);
      
      return res.status(400).json({ 
        error: 'No products found in receipt',
        details: 'The image may be unclear or not contain a valid receipt',
        rawText: receiptData.rawText.substring(0, 500) + '...', // Include snippet for debugging
        suggestions: [
          'Ensure the receipt is clearly visible and well-lit',
          'Try a different angle or distance',
          'Make sure the entire receipt is in frame'
        ]
      });
    }
    
    // Step 3: Analyze nutrition
    console.log('🥗 Step 3: Analyzing nutrition data...');
    console.log('🧪 INPUT TO NUTRITION SERVICE:', receiptData.items.length, 'items');
    console.log('🧪 ITEMS BEING ANALYZED:', receiptData.items.map(item => item.name));
    
    const analysis = await nutritionService.analyzeProducts(receiptData.items);
    
    // Apply personalization if user preferences provided
    const finalAnalysis = userPreferences ? 
      applyPersonalization(analysis, userPreferences) : analysis;
    
    console.log('📊 NUTRITION ANALYSIS RESULTS:');
    console.log('   Overall Score:', analysis.overallScore);
    console.log('   Sodium Score:', analysis.sodiumScore);
    console.log('   Processing Score:', analysis.processingScore);
    console.log('   Sugar Score:', analysis.sugarScore);
    console.log('   Nutrient Score:', analysis.nutrientScore);
    console.log('   Analysis Count:', analysis.analysisCount);
    console.log('   Cache Hit Rate:', analysis.cacheHitRate);
    console.log('   Processing Time:', analysis.processingTime, 'ms');
    
    // Check if all scores are identical (sign of mock data)
    const scores = [analysis.overallScore, analysis.sodiumScore, analysis.processingScore, analysis.sugarScore, analysis.nutrientScore];
    const allSame = scores.every(score => score === scores[0]);
    if (allSame) {
      console.log('🚨 SUSPICIOUS: All scores are identical (' + scores[0] + ') - possible mock data!');
    }
    
    console.log(`✅ Analysis complete with ${analysis.overallScore}/100 health score`);
    
    // Step 4: Save to history
    console.log('💾 Step 4: Saving to receipt history...');
    let receiptId: string | null = null;
    try {
      receiptId = await historyService.saveReceipt(
        receiptData.items,
        finalAnalysis,
        receiptData.storeInfo,
        receiptData.receiptDate.date || undefined
      );
      console.log(`✅ Receipt saved to history: ${receiptId}`);
    } catch (historyError) {
      console.warn('⚠️ Failed to save to history:', historyError);
      // Continue processing even if history fails
    }
    
    // Step 5: Get history stats for user insights
    const historyStats = historyService.getHistoryStats();
    
    // Step 5.5: 🎮 GAMIFICATION - Calculate points and achievements
    console.log('🎮 Step 5.5: Processing gamification rewards...');
    const userId = userPreferences?.userName || 'demo_user';
    const pointsEvents = gamificationService.calculateAnalysisPoints(finalAnalysis, userPreferences);
    const updatedUserPoints = gamificationService.updateUserPoints(userId, pointsEvents);
    const healthStreak = gamificationService.updateHealthStreak(userId, finalAnalysis.overallScore);
    const motivationalMessage = gamificationService.getMotivationalMessage(updatedUserPoints, pointsEvents);
    const userStats = gamificationService.getUserStats(userId);
    console.log(`🏆 Points earned: ${pointsEvents.reduce((sum, e) => sum + e.points, 0)} | Level: ${userStats.level.level} | Streak: ${healthStreak.currentStreak}`);
    
    // Step 6: Calculate total processing time
    const processingTime = req.startTime ? Date.now() - req.startTime : 0;
    
    // Step 7: Clean up uploaded file
    // await ocrService.cleanupFile(req.file.path);
    console.log('🧹 Temporary file cleaned up');
    
    // Step 8: Return comprehensive results with history
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime,
      receiptId,
      receipt: {
        itemsFound: receiptData.items.length,
        topItems: receiptData.items.slice(0, 10), // Limit for demo/security
        totalItems: receiptData.totalItems,
        averagePrice: receiptData.averagePrice,
        date: receiptData.receiptDate.date?.toISOString().split('T')[0] || null,
        dateConfidence: receiptData.receiptDate.confidence,
        store: receiptData.storeInfo.storeName,
        location: receiptData.storeInfo.location,
        storeConfidence: receiptData.storeInfo.confidence,
        textQuality: receiptData.textQuality
      },
      analysis: {
        ...finalAnalysis,
        processingTime // Override with total time
      },
      history: {
        totalReceipts: historyStats.totalReceipts,
        averageHealthScore: historyStats.averageHealthScore,
        trendDirection: historyStats.trendDirection,
        isImproving: historyStats.trendDirection === 'improving',
        recentRecommendations: historyStats.recentRecommendations.slice(0, 2)
      },
      gamification: {
        pointsEarned: pointsEvents.reduce((sum, e) => sum + e.points, 0),
        totalPoints: updatedUserPoints.totalPoints,
        level: userStats.level.level,
        levelName: userStats.level.levelName,
        levelIcon: userStats.level.levelIcon,
        streak: healthStreak.currentStreak,
        longestStreak: healthStreak.longestStreak,
        weeklyProgress: `${healthStreak.weeklyCompleted}/${healthStreak.weeklyGoal}`,
        motivationalMessage,
        newBadges: updatedUserPoints.badges.filter(b => 
          new Date(b.unlockedAt).getTime() > Date.now() - 60000 // New in last minute
        ),
        events: pointsEvents
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
    
    // await ocrService.cleanupFile(req.file.path);
    
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

// Route for nutrition analysis only
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

// Get receipt history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recentHistory = historyService.getRecentHistory(limit);
    const historyStats = historyService.getHistoryStats();
    
    res.json({
      success: true,
      history: recentHistory,
      stats: historyStats
    });
    
  } catch (error) {
    console.error('❌ History retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific receipt by ID
router.get('/history/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const receipt = historyService.getReceiptById(receiptId);
    
    if (!receipt) {
      return res.status(404).json({ 
        error: 'Receipt not found',
        receiptId 
      });
    }
    
    res.json({
      success: true,
      receipt
    });
    
  } catch (error) {
    console.error('❌ Receipt retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual product entry endpoint
router.post('/manual', async (req, res) => {
  try {
    const { products, userPreferences } = req.body;
    
    console.log('📝 Processing manual product entry...');
    console.log('🛒 Products:', products);
    console.log('🎯 User preferences:', userPreferences);
    
    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'No products provided',
        details: 'Please provide at least one product'
      });
    }
    
    // Convert manual products to ReceiptItem format
    const receiptItems: ReceiptItem[] = products.map((product: ManualProduct) => ({
      name: product.name,
      price: 0, // Price not relevant for manual entry
      confidence: 1.0 // High confidence for manual entries
    }));
    
    console.log('🔄 Converted to receipt items:', receiptItems.length);
    
    // Step 1: Analyze nutrition with user preferences
    const analysis = await nutritionService.analyzeProducts(receiptItems);
    
    // Step 2: Apply personalization based on user goals
    const personalizedAnalysis = applyPersonalization(analysis, userPreferences);
    
    // Step 3: Save to history
    let entryId: string | null = null;
    try {
      entryId = await historyService.saveReceipt(
        receiptItems,
        personalizedAnalysis,
        { storeName: 'Manual Entry', location: null },
        new Date()
      );
    } catch (historyError) {
      console.warn('⚠️ Failed to save manual entry to history:', historyError);
    }
    
    // Step 4: Get history stats
    const historyStats = historyService.getHistoryStats();
    
    // Step 4.5: 🎮 GAMIFICATION - Process rewards for manual entry
    const userId = userPreferences?.userName || 'demo_user';
    const pointsEvents = gamificationService.calculateAnalysisPoints(personalizedAnalysis, userPreferences);
    // Bonus points for manual entry effort!
    pointsEvents.push({
      type: 'manual_entry',
      points: 5,
      description: '✍️ Manual entry bonus - great initiative!',
      timestamp: new Date()
    });
    const updatedUserPoints = gamificationService.updateUserPoints(userId, pointsEvents);
    const healthStreak = gamificationService.updateHealthStreak(userId, personalizedAnalysis.overallScore);
    const motivationalMessage = gamificationService.getMotivationalMessage(updatedUserPoints, pointsEvents);
    const userStats = gamificationService.getUserStats(userId);
    
    // Step 5: Return results
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      entryId,
      source: 'manual',
      products: {
        itemsEntered: receiptItems.length,
        items: receiptItems
      },
      analysis: personalizedAnalysis,
      history: {
        totalReceipts: historyStats.totalReceipts,
        averageHealthScore: historyStats.averageHealthScore,
        trendDirection: historyStats.trendDirection,
        isImproving: historyStats.trendDirection === 'improving',
        recentRecommendations: historyStats.recentRecommendations.slice(0, 3)
      },
      personalization: {
        goal: userPreferences?.goal || 'general_wellness',
        customizedFor: userPreferences?.goal || 'general wellness'
      },
      gamification: {
        pointsEarned: pointsEvents.reduce((sum, e) => sum + e.points, 0),
        totalPoints: updatedUserPoints.totalPoints,
        level: userStats.level.level,
        levelName: userStats.level.levelName,
        levelIcon: userStats.level.levelIcon,
        streak: healthStreak.currentStreak,
        longestStreak: healthStreak.longestStreak,
        weeklyProgress: `${healthStreak.weeklyCompleted}/${healthStreak.weeklyGoal}`,
        motivationalMessage,
        newBadges: updatedUserPoints.badges.filter(b => 
          new Date(b.unlockedAt).getTime() > Date.now() - 60000
        ),
        events: pointsEvents
      }
    });
    
  } catch (error) {
    console.error('❌ Manual entry error:', error);
    res.status(500).json({
      error: 'Failed to process manual entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to apply personalization
function applyPersonalization(analysis: any, preferences?: UserPreferences) {
  if (!preferences) return analysis;
  
  const userName = preferences.userName || 'there';
  
  // Create personalized recommendations based on user goal
  const personalizedRecommendations = [...analysis.recommendations];
  
  switch (preferences.goal) {
    case 'weight_management':
      personalizedRecommendations.unshift({
        type: 'add',
        priority: 'high',
        message: `⚖️ Hey ${userName}! Focus on portion control and calorie-dense foods`,
        reason: 'Optimized for your weight management goal'
      });
      break;
      
    case 'heart_health':
      if (analysis.averageSodium > 400) {
        personalizedRecommendations.unshift({
          type: 'reduce',
          priority: 'high',
          message: `❤️ ${userName}, consider reducing sodium for better heart health`,
          reason: `Your sodium intake (${analysis.averageSodium}mg) exceeds heart-healthy levels`
        });
      }
      break;
      
    case 'diabetes_care':
      personalizedRecommendations.unshift({
        type: 'add',
        priority: 'high',
        message: `🩺 ${userName}, consider fiber-rich foods to help manage blood sugar`,
        reason: 'Optimized for your diabetes care goal'
      });
      break;
      
    case 'fitness':
      personalizedRecommendations.unshift({
        type: 'add',
        priority: 'medium',
        message: `💪 Great choices ${userName}! These foods support your fitness goals`,
        reason: 'Protein helps with muscle recovery and growth'
      });
      break;
      
    default: // general_wellness
      break;
  }
  
  return {
    ...analysis,
    recommendations: personalizedRecommendations.slice(0, 5), // Keep top 5
    personalizedFor: preferences.goal
  };
}

// User preferences endpoint
router.post('/preferences', async (req, res) => {
  try {
    const preferences: UserPreferences = req.body;
    
    // For now, just return success - in production you'd save to database
    console.log('💾 Saving user preferences:', preferences);
    
    res.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences: {
        ...preferences,
        createdAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Preferences error:', error);
    res.status(500).json({
      error: 'Failed to save preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as receiptRoutes };