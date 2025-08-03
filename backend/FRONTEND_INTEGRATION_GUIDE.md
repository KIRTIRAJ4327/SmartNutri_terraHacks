# 🎨 Frontend Integration Guide - MVP Features

## 📡 **NEW API RESPONSE FORMAT**

The backend now returns a much richer response with recommendations and history:

```typescript
interface ApiResponse {
  success: boolean;
  timestamp: string;
  receiptId: string; // NEW: Unique ID for this receipt
  receipt: {
    itemsFound: number;
    topItems: ReceiptItem[];
    date: string | null; // NEW: Extracted receipt date
    store: string | null; // NEW: Store name
    location: string | null; // NEW: Store location
    textQuality: { quality: 'good' | 'fair' | 'poor'; issues: string[] };
  };
  analysis: {
    overallScore: number; // 0-100
    sodiumScore: number;
    processingScore: number;
    sugarScore: number;
    nutrientScore: number;
    recommendations: Array<{ // NEW: Smart recommendations
      type: 'swap' | 'reduce' | 'add';
      priority: 'high' | 'medium' | 'low';
      message: string;
      reason: string;
    }>;
    // ... other nutrition data
  };
  history: { // NEW: Historical context
    totalReceipts: number;
    averageHealthScore: number;
    trendDirection: 'improving' | 'declining' | 'stable';
    isImproving: boolean;
    recentRecommendations: Recommendation[];
  };
}
```

---

## 🎯 **SIMPLE FRONTEND UPDATES**

### **1. Display Recommendations**

Add this component to show smart recommendations:

```jsx
function RecommendationsList({ recommendations }) {
  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '💡';
    }
  };

  const getTypeAction = (type) => {
    switch(type) {
      case 'swap': return 'REPLACE';
      case 'reduce': return 'REDUCE';
      case 'add': return 'ADD';
      default: return 'TIP';
    }
  };

  return (
    <div className="recommendations">
      <h3>💡 Smart Recommendations</h3>
      {recommendations.map((rec, index) => (
        <div key={index} className={`recommendation priority-${rec.priority}`}>
          <div className="rec-header">
            {getPriorityIcon(rec.priority)} 
            <span className="rec-action">[{getTypeAction(rec.type)}]</span>
          </div>
          <div className="rec-message">{rec.message}</div>
          <div className="rec-reason">💭 {rec.reason}</div>
        </div>
      ))}
    </div>
  );
}
```

### **2. Show Progress Indicators**

Add progress tracking:

```jsx
function ProgressIndicator({ history }) {
  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  return (
    <div className="progress-card">
      <h4>📊 Your Progress</h4>
      <div className="stats">
        <div className="stat">
          <span className="label">Total Scans:</span>
          <span className="value">{history.totalReceipts}</span>
        </div>
        <div className="stat">
          <span className="label">Average Score:</span>
          <span className="value">{history.averageHealthScore}/100</span>
        </div>
        <div className="stat">
          <span className="label">Trend:</span>
          <span className="value">
            {getTrendIcon(history.trendDirection)} {history.trendDirection.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### **3. Enhanced Receipt Display**

Show receipt metadata:

```jsx
function ReceiptInfo({ receipt }) {
  return (
    <div className="receipt-info">
      <h3>📄 Receipt Details</h3>
      <div className="receipt-meta">
        {receipt.date && (
          <div className="meta-item">
            📅 <strong>Date:</strong> {receipt.date}
          </div>
        )}
        {receipt.store && (
          <div className="meta-item">
            🏪 <strong>Store:</strong> {receipt.store}
          </div>
        )}
        {receipt.location && (
          <div className="meta-item">
            📍 <strong>Location:</strong> {receipt.location}
          </div>
        )}
        <div className="meta-item">
          🛒 <strong>Items Found:</strong> {receipt.itemsFound}
        </div>
      </div>
    </div>
  );
}
```

### **4. Quick CSS for Recommendations**

```css
.recommendations {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.recommendation {
  margin: 10px 0;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.recommendation.priority-high {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.recommendation.priority-medium {
  border-left-color: #ffc107;
  background: #fffbf0;
}

.recommendation.priority-low {
  border-left-color: #28a745;
  background: #f0fff4;
}

.rec-header {
  font-weight: bold;
  margin-bottom: 5px;
}

.rec-action {
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  margin-left: 5px;
}

.rec-reason {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.progress-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
}

.stats {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 0.9em;
  opacity: 0.9;
}

.stat .value {
  display: block;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 5px;
}
```

---

## 🚀 **INTEGRATION EXAMPLE**

Update your main App component:

```jsx
function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReceiptUpload = async (file) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/receipt/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>🍃 NutriScan</h1>
      
      {!result && (
        <FileUpload onUpload={handleReceiptUpload} loading={loading} />
      )}

      {result && (
        <div className="results">
          {/* Receipt Info */}
          <ReceiptInfo receipt={result.receipt} />
          
          {/* Health Score */}
          <HealthScore analysis={result.analysis} />
          
          {/* Smart Recommendations */}
          <RecommendationsList 
            recommendations={result.analysis.recommendations} 
          />
          
          {/* Progress Tracking */}
          <ProgressIndicator history={result.history} />
          
          {/* Action Button */}
          <button 
            onClick={() => setResult(null)}
            className="scan-another-btn"
          >
            📸 Scan Another Receipt
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 **NEW API ENDPOINTS**

### **Get History**
```
GET /api/receipt/history?limit=10
```

Response:
```json
{
  "success": true,
  "history": [
    {
      "id": "receipt_123_abc",
      "date": "2025-08-03T00:00:00.000Z",
      "storeName": "LOBLAWS",
      "location": "Toronto, ON",
      "items": [...],
      "nutritionAnalysis": {...},
      "totalItems": 5,
      "averagePrice": 5.99
    }
  ],
  "stats": {
    "totalReceipts": 8,
    "averageHealthScore": 68,
    "trendDirection": "improving"
  }
}
```

### **Get Specific Receipt**
```
GET /api/receipt/history/:receiptId
```

---

## 🎯 **MVP USER EXPERIENCE**

With these updates, your users will now experience:

1. **📸 Instant Analysis** - Scan receipt, get immediate health insights
2. **💡 Actionable Guidance** - Specific recommendations, not generic advice  
3. **📈 Progress Tracking** - See improvement over time
4. **🎯 Personalized Experience** - Based on their actual shopping patterns

**This creates the compelling "aha moment": _"Holy shit, I had no idea I was eating 4,000mg of sodium per day!"_**

---

## 🏆 **READY FOR DEMO!**

Your MVP now has:
- ✅ Smart receipt parsing with improved accuracy
- ✅ Instant health scoring with 4 component scores  
- ✅ Smart, actionable recommendations
- ✅ Automatic history tracking and trends
- ✅ Rich API responses ready for frontend

**Perfect for hackathon demonstration! 🚀**