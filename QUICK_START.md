# 🚀 NutriScan Quick Start Guide

Get NutriScan running in 5 minutes! This guide gets you from zero to analyzing receipts quickly.

## ⚡ Super Quick Setup (For Testing)

The app works immediately with mock data - no API keys required for testing!

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

### 2. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### 3. Test the App
- Open: `http://localhost:3000`
- Upload any image file
- Get instant mock nutrition analysis!

**✅ That's it! The app is working with realistic mock data.**

---

## 🔑 Full Setup (Real OCR)

For real receipt processing with Google Vision API:

### 1. Google Cloud Setup (5 minutes)

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Create/Select Project**: `wisdomheart` (or your project name)
3. **Enable API**: Search "Cloud Vision API" → Enable
4. **Create Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Name: `nutriscan-vision`
   - Role: `Cloud Vision API Service Agent`
5. **Download Key**:
   - Service Account → Keys → Add Key → JSON
   - Save as: `backend/config/google-cloud-key.json`

### 2. Configure Environment
```bash
cd backend

# Create .env file
powershell -ExecutionPolicy Bypass -File setup-env.ps1

# Test setup
node test-vision-setup.js
# Should show all ✅ green checkmarks
```

### 3. Restart with Real OCR
```bash
# Stop servers (Ctrl+C) and restart
npm run dev  # Backend
npm start    # Frontend
```

**🎉 Now upload real receipt photos for actual OCR processing!**

---

## 📱 Usage Tips

### Best Receipt Photos
- ✅ **Good lighting** - avoid shadows
- ✅ **Flat surface** - no wrinkles or folds  
- ✅ **Full receipt** - capture entire receipt
- ✅ **High resolution** - clear text

### What You'll Get
- **🎯 Overall Health Score** (0-100)
- **🧂 Sodium Analysis** - cardiovascular impact
- **🔬 Processing Level** - ultra-processed food detection
- **🍭 Sugar Impact** - added vs natural sugars
- **💪 Nutrient Power** - vitamin/mineral potential
- **💡 Personalized Recommendations** - actionable health advice

### Example Analysis
```
📊 Your Health Score: 85/100 (Good!)

🧂 Sodium: 92/100 (128mg average - excellent!)
🔬 Processing: 75/100 (25% ultra-processed foods)
🍭 Sugar: 88/100 (12g total, 0% added sugars)
💪 Nutrients: 78/100 (good vitamin potential)

💡 Recommendations:
• Add more leafy greens for iron and folate
• Great job avoiding ultra-processed foods!
• Consider whole grain options for B vitamins
```

---

## 🛠️ Troubleshooting

### Frontend Won't Start
```bash
# Check you're in frontend directory
cd frontend
npm start
```

### Backend API Errors
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Should return: {"status":"healthy",...}
```

### OCR Not Working
```bash
# Verify Google Cloud setup
cd backend
node test-vision-setup.js

# All checks should be ✅ green
```

### File Upload Issues
- **Max size**: 10MB
- **Formats**: JPG, PNG, BMP, GIF, WEBP, TIFF
- **Mobile**: Use camera capture for best results

---

## 🎯 Development Mode

### With Mock Data (No APIs)
- Perfect for UI development
- Returns realistic grocery receipt data
- All features work except real image processing

### With Real APIs
- Process actual receipt photos
- Real nutrition data lookups
- Full production experience

### API Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Test nutrition analysis
curl -X POST -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Bananas","price":2.49,"confidence":0.9}]}' \
  http://localhost:5000/api/receipt/nutrition-test
```

---

## 🚀 Deployment

When ready to deploy:

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway)
```bash
cd backend  
npm run build
railway up
```

**Environment variables needed for production - see README.md for full details.**

---

## 💬 Need Help?

1. **Check README.md** - comprehensive documentation
2. **Check CHANGELOG.md** - feature details
3. **Test endpoints** - `curl http://localhost:5000/api/health`
4. **Check logs** - console output shows detailed errors
5. **File issues** - GitHub Issues for bugs and features

---

**🎉 Happy receipt analyzing! Transform your grocery shopping into health insights with NutriScan!** 🥗📱✨