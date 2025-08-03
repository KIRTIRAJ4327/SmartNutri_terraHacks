# 🚀 NutriScan Setup Guide

## 📋 Prerequisites

- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **Google Cloud Account** (For Vision API)
- **USDA API Key** (For nutrition data)

## 🔑 API Keys Setup

### 1. Google Cloud Vision API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Vision API**
4. Create a **Service Account** 
5. Download the **JSON key file**
6. Save it securely (DO NOT commit to git!)

### 2. USDA FoodData Central API
1. Go to [FDC API Guide](https://fdc.nal.usda.gov/api-guide.html)
2. Request an API key (free)
3. Save the key securely

## 💻 Installation

### Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API keys:
# GOOGLE_CLOUD_PROJECT_ID=your-project-id
# GOOGLE_CLOUD_KEY_PATH=path/to/service-account-key.json
# FOODDATA_CENTRAL_API_KEY=your-api-key

# Start the server
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🧪 Testing

```bash
# Test backend
cd backend
npm test

# Test comprehensive features
node final-comprehensive-test.js
```

## 🔒 Security Notes

- **NEVER** commit `.env` files to git
- **NEVER** commit Google Cloud JSON keys
- Use environment variables in production
- Keep API keys secure and rotate regularly

## 🆘 Troubleshooting

### Common Issues:
1. **Port 5000 in use**: Kill process with `taskkill /F /IM node.exe`
2. **API errors**: Check your keys in `.env`
3. **CORS issues**: Ensure backend is running on port 5000
4. **Build errors**: Clear node_modules and reinstall

### Getting Help:
- Check the logs in terminal
- Verify API keys are correct
- Ensure all dependencies are installed
- Test with the provided test scripts

## 🎯 Ready to Demo!

Once setup is complete, you'll have:
- ✅ Backend API running on `http://localhost:5000`
- ✅ Frontend app on `http://localhost:3000`
- ✅ All features working (OCR, nutrition analysis, gamification)
- ✅ Beautiful UI with smooth animations

**Your NutriScan is ready to impress! 🍃✨**