# 🚀 NutriScan Deployment Guide

Complete guide for deploying NutriScan to production with Vercel (frontend) and Railway (backend).

## 📋 Pre-Deployment Checklist

### ✅ Backend Ready
- [ ] Google Cloud Vision API configured
- [ ] FoodData Central API key obtained (optional)
- [ ] Environment variables configured
- [ ] All tests passing: `npm run build && npm run dev`
- [ ] API endpoints responding: `curl http://localhost:5000/api/health`

### ✅ Frontend Ready
- [ ] Build successful: `npm run build`
- [ ] Components rendering correctly
- [ ] API integration working with backend
- [ ] Responsive design tested on mobile/desktop

---

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend for Production

```bash
cd frontend

# Test production build
npm run build

# Verify build output
ls build/
# Should see: static/, index.html, etc.
```

### 2. Environment Configuration

Create `frontend/.env.production`:
```bash
# Production API URL (update after backend deployment)
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel --prod

# Follow prompts:
# - Set up new project: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: nutriscan-frontend
# - Directory: ./
# - Override settings: No
```

#### Option B: GitHub Integration
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Select `frontend` directory
   - Deploy automatically

### 4. Configure Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com

# Update DNS settings:
# Type: CNAME
# Name: @ (or subdomain)
# Value: cname.vercel-dns.com
```

### 5. Environment Variables in Vercel

In Vercel dashboard:
1. **Project Settings** → **Environment Variables**
2. **Add**:
   - `REACT_APP_API_URL`: `https://your-backend-url.railway.app`
3. **Redeploy** after adding variables

---

## 🚂 Backend Deployment (Railway)

### 1. Prepare Backend for Production

```bash
cd backend

# Test production build
npm run build

# Verify dist output
ls dist/
# Should see: server.js, routes/, services/, etc.
```

### 2. Environment Configuration

Update `backend/.env` for production:
```bash
# Production environment
NODE_ENV=production
PORT=5000

# Google Cloud (same as development)
GOOGLE_CLOUD_PROJECT_ID=wisdomheart
GOOGLE_CLOUD_KEY_PATH=./config/google-cloud-key.json

# API Keys
FOODDATA_CENTRAL_API_KEY=your-production-key
```

### 3. Railway Configuration

Create `backend/railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health"
  }
}
```

### 4. Deploy to Railway

#### Option A: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd backend
railway init

# Deploy
railway up
```

#### Option B: GitHub Integration
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push origin main
   ```

2. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repository
   - Select `backend` directory

### 5. Environment Variables in Railway

In Railway dashboard:
1. **Variables** tab
2. **Add Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   GOOGLE_CLOUD_PROJECT_ID=wisdomheart
   GOOGLE_CLOUD_KEY_PATH=./config/google-cloud-key.json
   FOODDATA_CENTRAL_API_KEY=your-key
   ```

### 6. Upload Google Cloud Key

#### Option A: Railway CLI
```bash
# Upload file to Railway
railway shell
# In shell: upload config/google-cloud-key.json
```

#### Option B: Environment Variable
```bash
# Convert JSON to base64
base64 -i config/google-cloud-key.json

# Add to Railway variables:
GOOGLE_CLOUD_KEY_BASE64=your-base64-string

# Update server.ts to decode:
if (process.env.GOOGLE_CLOUD_KEY_BASE64) {
  const keyContent = Buffer.from(process.env.GOOGLE_CLOUD_KEY_BASE64, 'base64');
  fs.writeFileSync('./config/google-cloud-key.json', keyContent);
}
```

---

## 🔗 Connect Frontend to Backend

### 1. Update Frontend API URL

After backend deployment, update frontend:

```bash
# Update frontend/.env.production
REACT_APP_API_URL=https://your-actual-backend-url.railway.app
```

### 2. Redeploy Frontend

```bash
cd frontend
vercel --prod
```

### 3. Test Integration

```bash
# Test backend
curl https://your-backend-url.railway.app/api/health

# Test CORS (from frontend domain)
curl -H "Origin: https://your-frontend-url.vercel.app" \
  https://your-backend-url.railway.app/api/health
```

---

## 🛡️ Production Security

### Backend Security

#### Update CORS for Production
```typescript
// backend/src/server.ts
const allowedOrigins = [
  'http://localhost:3000',  // Development
  'https://your-frontend-url.vercel.app',  // Production
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

#### Environment Security
```bash
# Remove development keys
unset DEVELOPMENT_API_KEY

# Use production secrets
export NODE_ENV=production
export LOG_LEVEL=warn
```

### Frontend Security

#### Content Security Policy
```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://your-backend-url.railway.app;
               img-src 'self' data: https:;
               style-src 'self' 'unsafe-inline';">
```

#### Environment Variables
```bash
# Remove API URLs from client-side code
# Use REACT_APP_* variables only for public configuration
```

---

## 📊 Monitoring & Analytics

### Health Monitoring

#### Backend Health Checks
```bash
# Set up monitoring
curl https://your-backend-url.railway.app/api/health/detailed

# Expected response:
{
  "status": "healthy",
  "services": {
    "ocr": "operational",
    "nutrition": "operational",
    "cache": "operational"
  },
  "memory": {"used": 156, "total": 512, "unit": "MB"}
}
```

#### Frontend Monitoring
```typescript
// Add error tracking
window.addEventListener('error', (event) => {
  console.error('Frontend error:', event.error);
  // Send to monitoring service
});
```

### Performance Monitoring

#### API Response Times
```typescript
// backend/src/server.ts - already implemented
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});
```

#### Frontend Performance
```typescript
// src/App.tsx
const trackAnalysis = (processingTime: number) => {
  console.log(`Analysis completed in ${processingTime}ms`);
  // Send to analytics
};
```

---

## 🔄 CI/CD Pipeline (Advanced)

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy NutriScan

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Build
        run: cd backend && npm run build
      
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Build
        run: cd frontend && npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.BACKEND_URL }}
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Environment Secrets

In GitHub repository settings:
- `RAILWAY_TOKEN`: Railway deployment token
- `VERCEL_TOKEN`: Vercel deployment token  
- `BACKEND_URL`: Railway backend URL
- `GOOGLE_CLOUD_KEY`: Base64 encoded service account key

---

## 🧪 Production Testing

### Smoke Tests

```bash
# Backend smoke test
curl https://your-backend-url.railway.app/api/health
curl -X POST -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Test","price":1.99,"confidence":0.9}]}' \
  https://your-backend-url.railway.app/api/receipt/nutrition-test

# Frontend smoke test
curl -I https://your-frontend-url.vercel.app
# Should return: 200 OK
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > loadtest.yml << EOF
config:
  target: 'https://your-backend-url.railway.app'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/api/health"
EOF

# Run load test
artillery run loadtest.yml
```

---

## 📈 Scaling Considerations

### Backend Scaling

#### Railway Auto-scaling
- **Memory**: Start with 512MB, scale to 2GB if needed
- **CPU**: Railway auto-scales based on demand
- **Instances**: Multiple instances for high traffic

#### Database Scaling
- **Redis**: Add Redis for production caching
- **Connection Pooling**: Implement for nutrition APIs
- **Rate Limiting**: Prevent API abuse

### Frontend Scaling

#### Vercel Edge Network
- **Global CDN**: Automatic worldwide distribution
- **Edge Functions**: For server-side logic if needed
- **Image Optimization**: Automatic image compression

#### Performance Optimization
- **Code Splitting**: Lazy load components
- **Caching**: Service worker for offline support
- **Analytics**: Monitor real user performance

---

## 💰 Cost Optimization

### API Usage

#### Google Vision API
- **Free Tier**: 1,000 requests/month
- **Cost**: $1.50 per 1,000 requests
- **Optimization**: Image compression, caching

#### Open Food Facts
- **Free**: Unlimited requests
- **Rate Limiting**: Be respectful with requests
- **Caching**: 24-hour cache reduces requests

### Hosting Costs

#### Vercel
- **Free Tier**: 100GB bandwidth, unlimited requests
- **Pro**: $20/month for teams and advanced features

#### Railway
- **Free Tier**: $5 credit monthly
- **Pro**: Pay-as-you-go based on usage
- **Estimated**: $10-30/month for moderate traffic

---

## 🔧 Troubleshooting Production

### Common Issues

#### CORS Errors
```typescript
// Ensure backend allows frontend domain
const allowedOrigins = [
  'https://your-frontend-url.vercel.app'
];
```

#### Environment Variables
```bash
# Check Railway variables
railway variables

# Check Vercel variables
vercel env ls
```

#### API Timeouts
```typescript
// Increase timeout in nutrition service
const response = await axios.get(url, { timeout: 30000 });
```

#### Memory Issues
```bash
# Monitor Railway memory usage
railway logs

# Scale up if needed
railway scale --memory 1GB
```

### Debug Tools

#### Railway Debugging
```bash
# Connect to Railway shell
railway shell

# Check environment
env | grep GOOGLE

# Test API from server
curl localhost:5000/api/health
```

#### Vercel Debugging
```bash
# Check function logs
vercel logs

# Test build locally
vercel dev
```

---

## ✅ Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Google Cloud credentials valid
- [ ] Build successful for both apps
- [ ] CORS configured for production domains

### Deployment
- [ ] Backend deployed to Railway
- [ ] Environment variables added to Railway
- [ ] Google Cloud key uploaded securely
- [ ] Health check endpoint responding
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured
- [ ] Custom domains configured (if applicable)

### Post-deployment
- [ ] End-to-end testing completed
- [ ] Performance monitoring set up
- [ ] Error tracking configured
- [ ] Documentation updated with URLs
- [ ] Team notified of deployment

### Production URLs
- **Frontend**: `https://your-frontend-url.vercel.app`
- **Backend**: `https://your-backend-url.railway.app`
- **API Docs**: `https://your-backend-url.railway.app/api/health/info`

---

**🎉 Congratulations! NutriScan is now live in production!**

Your users can now transform grocery receipts into health insights at scale! 🥗📱✨