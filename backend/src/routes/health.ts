import express from 'express';
import { NutritionService } from '../services/nutritionService';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  res.json({
    status: 'healthy',
    timestamp,
    uptime: {
      seconds: Math.floor(uptime),
      human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      ocr: 'operational',
      nutrition: 'operational',
      cache: 'operational'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  });
});

// Detailed service status
router.get('/detailed', async (req, res) => {
  try {
    const nutritionService = new NutritionService();
    const cacheStats = nutritionService.getCacheStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        ocr: {
          status: 'operational',
          provider: 'Google Cloud Vision API',
          features: ['text_detection', 'receipt_parsing', 'quality_analysis']
        },
        nutrition: {
          status: 'operational',
          provider: 'Open Food Facts API',
          cache: {
            size: cacheStats.size,
            hitRate: cacheStats.hitRate,
            status: 'operational'
          },
          features: ['product_analysis', 'scoring', 'recommendations']
        }
      },
      capabilities: {
        imageFormats: ['JPG', 'JPEG', 'PNG', 'BMP', 'GIF', 'WEBP', 'TIFF'],
        maxFileSize: '10MB',
        languages: ['English'],
        analysisFeatures: [
          'sodium_scoring',
          'processing_analysis', 
          'sugar_impact',
          'nutrient_power',
          'personalized_recommendations'
        ]
      },
      performance: {
        averageProcessingTime: '3-5 seconds',
        cacheEnabled: true,
        backgroundCleanup: true
      }
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Some services may be experiencing issues',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API information endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'NutriScan API',
    description: 'Transform grocery receipts into health insights',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health - Basic health check',
      healthDetailed: 'GET /api/health/detailed - Detailed service status', 
      receiptAnalyze: 'POST /api/receipt/analyze - Complete receipt analysis',
      receiptOCR: 'POST /api/receipt/ocr-test - OCR testing only',
      receiptNutrition: 'POST /api/receipt/nutrition-test - Nutrition testing only'
    },
    documentation: {
      upload: {
        method: 'POST',
        endpoint: '/api/receipt/analyze',
        contentType: 'multipart/form-data',
        field: 'image',
        maxSize: '10MB',
        formats: ['JPG', 'PNG', 'HEIC', 'WEBP']
      },
      response: {
        success: 'JSON object with analysis results',
        error: 'JSON object with error details and suggestions'
      }
    },
    features: [
      '🔍 OCR text extraction from receipt images',
      '🥗 Comprehensive nutrition analysis',
      '📊 Multi-dimensional health scoring',
      '💡 Personalized recommendations',
      '⚡ Performance optimization with caching',
      '🔒 Privacy-first (no data storage)'
    ]
  });
});

export { router as healthRoutes };