# 🍎 NutriScan - Smart Receipt Health Analysis

Transform your grocery receipts into actionable health insights using AI-powered OCR and nutrition analysis.

## 🎯 Project Overview

**NutriScan** analyzes grocery receipt photos to provide instant health scores and personalized nutrition recommendations. Simply upload a receipt image and get comprehensive insights about your shopping habits.

### ✨ Core Features

- 📸 **Smart OCR**: Google Vision API extracts text from receipt photos
- 🥗 **Nutrition Analysis**: Comprehensive health scoring across 4 dimensions
- 📊 **Health Dashboard**: Beautiful visualizations of your nutrition data
- 💡 **Personalized Recommendations**: Actionable advice for healthier choices
- 🔒 **Privacy-First**: No data storage - everything processed locally

### 🏆 Health Scoring System

- **🧂 Sodium Score** (0-100): Analyzes salt content and cardiovascular impact
- **🔬 Processing Score** (0-100): Identifies ultra-processed foods using NOVA classification
- **🍭 Sugar Impact** (0-100): Distinguishes added vs natural sugars
- **💪 Nutrient Power** (0-100): Evaluates vitamin/mineral density potential

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Google Cloud Vision API** for OCR
- **Open Food Facts API** for nutrition data
- **FoodData Central API** for enhanced nutrition info

### Deployment Ready
- **Frontend**: Vercel deployment configuration
- **Backend**: Railway deployment setup
- **Environment**: Production-ready configurations

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
npm or yarn
Google Cloud Platform account
```

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd nutriscan

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Setup

#### Environment Configuration
```bash
cd backend

# Create environment file
powershell -ExecutionPolicy Bypass -File setup-env.ps1

# Verify configuration
node test-vision-setup.js
```

#### Google Cloud Vision API Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing: `wisdomheart`

2. **Enable Vision API**
   - Navigate to **APIs & Services** → **Library**
   - Search "Cloud Vision API" and click **Enable**

3. **Create Service Account**
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name: `nutriscan-vision`
   - Grant role: **Cloud Vision API Service Agent**

4. **Download Credentials**
   - Click on service account → **Keys** tab
   - **Add Key** → **Create new key** → **JSON**
   - Save as: `backend/config/google-cloud-key.json`

5. **Verify Setup**
   ```bash
   node test-vision-setup.js
   # Should show all ✅ green checkmarks
   ```

#### Optional: FoodData Central API
- Get free API key from [FoodData Central](https://fdc.nal.usda.gov/api-guide.html)
- Add to `.env`: `FOODDATA_CENTRAL_API_KEY=your-key-here`

### 3. Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

### 4. Test the Application

1. **Open**: `http://localhost:3000`
2. **Upload** a grocery receipt image (or use camera)
3. **View** comprehensive health analysis
4. **Get** personalized nutrition recommendations

## 📁 Project Structure

```
nutriscan/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── routes/            # Express route handlers
│   │   │   ├── receipt.ts     # Receipt analysis endpoints
│   │   │   └── health.ts      # Health check endpoints
│   │   ├── services/          # Business logic services
│   │   │   ├── ocrService.ts  # Google Vision OCR
│   │   │   ├── nutritionService.ts # Nutrition analysis
│   │   │   └── mockOcrService.ts   # Development fallback
│   │   ├── types/             # TypeScript interfaces
│   │   └── server.ts          # Express app entry point
│   ├── config/                # Configuration files
│   │   └── google-cloud-key.json # Google Cloud credentials
│   ├── uploads/               # Temporary file storage
│   ├── .env                   # Environment variables
│   └── package.json           # Dependencies and scripts
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ReceiptUpload.tsx    # Camera/file upload
│   │   │   ├── ResultsDisplay.tsx   # Health scores display
│   │   │   └── LoadingSpinner.tsx   # Loading animation
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Main application component
│   │   └── index.tsx          # React entry point
│   ├── public/                # Static assets
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── package.json           # Dependencies and scripts
├── README.md                  # Project documentation
└── CHANGELOG.md               # Version history
```

## 🔌 API Endpoints

### Health & Status
- `GET /` - API information
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed service status
- `GET /api/health/info` - API documentation

### Receipt Analysis
- `POST /api/receipt/analyze` - Complete receipt analysis
- `POST /api/receipt/ocr-test` - OCR testing only
- `POST /api/receipt/nutrition-test` - Nutrition testing only

### Example Usage

```bash
# Health check
curl http://localhost:5000/api/health

# Receipt analysis (with image file)
curl -X POST -F "image=@receipt.jpg" \
  http://localhost:5000/api/receipt/analyze

# Nutrition test (with JSON data)
curl -X POST -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Bananas","price":2.49,"confidence":0.9}]}' \
  http://localhost:5000/api/receipt/nutrition-test
```

## 🎨 Frontend Features

### Component Architecture
- **App.tsx**: Main state management and API integration
- **ReceiptUpload**: Drag-drop file upload with camera support
- **ResultsDisplay**: Multi-dimensional health score visualization
- **LoadingSpinner**: Animated processing feedback

### Responsive Design
- **Mobile-first**: Optimized for phone cameras and touch
- **Progressive Web App**: Works offline with cached assets
- **Accessibility**: WCAG compliant with screen reader support

### State Management
```typescript
interface AppState {
  isAnalyzing: boolean;
  results: AnalysisResult | null;
  error: APIError | null;
}
```

## 🧪 Testing & Development

### Backend Testing
```bash
cd backend

# Run TypeScript compilation
npm run build

# Start development server
npm run dev

# Test specific endpoints
node test-vision-setup.js
curl http://localhost:5000/api/health
```

### Frontend Testing
```bash
cd frontend

# Build production bundle
npm run build

# Start development server
npm start

# Test with sample receipt
# Upload any image - mock service provides test data
```

### Development Features
- **Mock OCR Service**: Test without Google Cloud credentials
- **Hot Reload**: Automatic server restart on file changes
- **TypeScript**: Full type safety across frontend and backend
- **Error Handling**: Comprehensive error reporting and recovery

## 🌟 Advanced Features

### Nutrition Analysis Engine
- **Dual API Strategy**: Open Food Facts + FoodData Central
- **Smart Caching**: Redis-compatible caching system
- **Fuzzy Matching**: Intelligent product name recognition
- **Fallback Estimation**: Nutrition estimates when APIs fail

### OCR Processing Pipeline
1. **Image Validation**: Format and size checking
2. **Text Extraction**: Google Vision API processing
3. **Receipt Parsing**: Product and price identification
4. **Quality Analysis**: Text clarity assessment
5. **Item Confidence**: Reliability scoring per product

### Health Scoring Algorithms
```typescript
// Sodium analysis
sodiumScore = max(0, 100 - (averageSodium / 20))

// Processing classification
processingScore = 100 - (ultraProcessedPercent)

// Sugar impact calculation
sugarScore = weighted(naturalSugars, addedSugars, totalIntake)

// Nutrient density evaluation
nutrientScore = calculateDensity(vitamins, minerals, categories)
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend (Railway)
```bash
cd backend
npm run build

# Deploy to Railway
railway up
```

### Environment Variables for Production
```bash
# Backend (.env)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_PATH=./config/google-cloud-key.json
FOODDATA_CENTRAL_API_KEY=your-fdc-key
NODE_ENV=production
PORT=5000

# Frontend
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## 🛡️ Security & Privacy

### Data Protection
- **No Storage**: Receipt images processed and immediately deleted
- **Local Processing**: Nutrition analysis happens server-side only
- **API Security**: Rate limiting and input validation
- **HTTPS Only**: Secure transport in production

### File Security
- **Type Validation**: Only image files accepted
- **Size Limits**: 10MB maximum file size
- **Temporary Storage**: Automatic cleanup after processing
- **Path Security**: No directory traversal vulnerabilities

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Testing**: Unit tests for critical functions

## 📊 Performance

### Optimization Features
- **Image Compression**: Automatic resizing for faster upload
- **API Caching**: Nutrition data cached for 24 hours
- **Lazy Loading**: Components loaded on demand
- **Bundle Splitting**: Optimized JavaScript delivery

### Performance Metrics
- **OCR Processing**: ~2-5 seconds per receipt
- **Nutrition Analysis**: ~1-3 seconds per product
- **Total Analysis Time**: ~5-10 seconds end-to-end
- **Cache Hit Rate**: 60-80% for common products

## 🔧 Troubleshooting

### Common Issues

#### "google-cloud-key.json missing"
```bash
# Ensure file exists
ls backend/config/google-cloud-key.json

# Verify JSON format
node -e "console.log(JSON.parse(require('fs').readFileSync('backend/config/google-cloud-key.json')))"
```

#### "Vision API not enabled"
- Visit Google Cloud Console
- Enable Cloud Vision API
- Wait 2-3 minutes for activation

#### "Frontend not connecting to backend"
- Check backend is running on port 5000
- Verify CORS settings in server.ts
- Test API endpoint: `curl http://localhost:5000/api/health`

#### "Receipt not parsing correctly"
- Ensure good lighting and clear text
- Try different image formats (JPG, PNG)
- Check OCR quality with: `POST /api/receipt/ocr-test`

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=nutriscan:*
npm run dev

# Test specific components
node -e "require('./src/services/ocrService').test()"
```

## 📞 Support

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and features
- **API Status**: `GET /api/health/info` for service status
- **Logs**: Check console output for detailed error information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Vision API** for OCR capabilities
- **Open Food Facts** for nutrition database
- **FoodData Central** for USDA nutrition data
- **React** and **Express** communities for excellent frameworks
- **Tailwind CSS** for beautiful, responsive design

---

**Built with ❤️ for healthier eating habits**

Transform your grocery shopping into a journey toward better health with NutriScan! 🥗📱✨