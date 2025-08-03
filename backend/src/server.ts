import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import path from 'path';
import fs from 'fs';
import { receiptRoutes } from './routes/receipt';
import { healthRoutes } from './routes/health';
import debugRoutes from './routes/debug';

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Update with actual frontend URL
    : ['http://localhost:3000', 'http://localhost:3001'], // Development origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type']
};

// Global middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

// File filter for security
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/bmp',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/heic',
    'image/heif'
  ];
  
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please use JPG, PNG, HEIC, or WEBP.`));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Error handling for multer
const handleMulterError = (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          details: 'Please upload an image smaller than 10MB',
          maxSize: '10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          details: 'Please upload only one image at a time'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          details: 'Please use the "image" field for file uploads'
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          details: error.message
        });
    }
  }
  
  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({
      error: 'Unsupported file type',
      details: error.message,
      supportedFormats: ['JPG', 'PNG', 'HEIC', 'WEBP', 'BMP', 'GIF', 'TIFF']
    });
  }
  
  next(error);
};

// Route definitions
app.use('/api/health', healthRoutes);
app.use('/api/receipt', upload.single('image'), handleMulterError, receiptRoutes);
app.use('/api/debug', debugRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NutriScan API',
    version: '1.0.0',
    status: 'operational',
    description: 'Transform grocery receipts into health insights',
    documentation: '/api/health/info',
    endpoints: {
      health: '/api/health',
      analyze: '/api/receipt/analyze'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/health/detailed',
      'GET /api/health/info',
      'POST /api/receipt/analyze',
      'POST /api/receipt/ocr-test',
      'POST /api/receipt/nutrition-test'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Global error handler:', error);
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Cleanup old upload files on startup (files older than 1 hour)
const cleanupOldFiles = () => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    let cleanedCount = 0;
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < oneHourAgo) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old upload files`);
    }
  } catch (error) {
    console.warn('⚠️  File cleanup warning:', error);
  }
};

// Start server
app.listen(PORT, () => {
  console.log('🚀 NutriScan API Server Starting...');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/health/info`);
  console.log('✅ Server ready to accept requests');
  
  // Run initial cleanup
  // cleanupOldFiles();
  
  // Schedule periodic cleanup every hour
  // setInterval(cleanupOldFiles, 60 * 60 * 1000);
});

export default app;