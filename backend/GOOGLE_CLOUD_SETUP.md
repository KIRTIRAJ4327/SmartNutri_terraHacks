# Google Cloud Vision API Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `wisdomheart` (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Search for "**Cloud Vision API**"
5. Click **Enable**

### Step 2: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: `nutriscan-vision`
   - **Description**: `Service account for NutriScan OCR`
4. Click **Create and Continue**
5. Grant role: **Cloud Vision API Service Agent**
6. Click **Continue** → **Done**

### Step 3: Generate Key

1. Click on your newly created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Download the file
6. **Rename** it to `google-cloud-key.json`
7. **Move** it to: `E:\NutriScan\backend\config\google-cloud-key.json`

### Step 4: Verify Setup

```bash
# Test the configuration
node test-vision-setup.js

# Should show all ✅ green checkmarks
```

### Step 5: Start the Server

```bash
# Start backend with OCR enabled
npm run dev

# Test OCR endpoint
curl -X POST -F "image=@test-receipt.jpg" http://localhost:5000/api/receipt/ocr-test
```

## 🔍 Troubleshooting

### Error: "google-cloud-key.json missing"
- Ensure the JSON file is in `backend/config/google-cloud-key.json`
- Check file permissions

### Error: "Invalid credentials"
- Verify the JSON file is valid (run `node test-vision-setup.js`)
- Ensure the service account has Vision API permissions

### Error: "Project not found"
- Update `GOOGLE_CLOUD_PROJECT_ID` in `.env` to match your project

### Error: "API not enabled"
- Enable Cloud Vision API in Google Cloud Console
- Wait 2-3 minutes for activation

## 💡 Alternative: Environment Variables

Instead of a JSON file, you can use environment variables:

```bash
# .env file
GOOGLE_APPLICATION_CREDENTIALS=./config/google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 🎯 Testing OCR

Once setup is complete, test with:

```javascript
// Test with a receipt image
const ocrService = new OCRService();
const text = await ocrService.extractText('path/to/receipt.jpg');
console.log('Extracted text:', text);
```

## 📊 Cost Estimation

- **Vision API**: $1.50 per 1,000 requests
- **Free tier**: 1,000 requests/month
- **Typical usage**: ~$0.15 per 100 receipt scans

Perfect for development and testing! 🎉