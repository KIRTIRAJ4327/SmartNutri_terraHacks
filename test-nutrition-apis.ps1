# Test Nutrition APIs
Write-Host "🧪 Testing Nutrition API Coordination" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Test 1: Check if backend is running
Write-Host "`n1. Testing Backend Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Host " ✅ PASS" -ForegroundColor Green
    Write-Host "   Backend Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Start backend with: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test Open Food Facts API directly
Write-Host "`n2. Testing Open Food Facts API..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "https://world.openfoodfacts.org/api/v0/search?search_terms=banana&json=1&page_size=1" -Method GET -TimeoutSec 10
    Write-Host " ✅ PASS" -ForegroundColor Green
    Write-Host "   Found $($response.products.Count) products" -ForegroundColor Gray
    if ($response.products.Count -gt 0) {
        Write-Host "   Sample product: $($response.products[0].product_name)" -ForegroundColor Gray
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 This might be a network issue" -ForegroundColor Yellow
}

# Test 3: Test our backend with a simple POST (should fail but show us the error)
Write-Host "`n3. Testing Backend Receipt Endpoint..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/receipt/analyze" -Method POST -TimeoutSec 10
    Write-Host " ✅ PASS (unexpected)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host " ✅ EXPECTED ERROR" -ForegroundColor Yellow
        Write-Host "   Status: 400 (No file provided - expected)" -ForegroundColor Gray
    } else {
        Write-Host " ❌ UNEXPECTED ERROR" -ForegroundColor Red
        Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Check if nutrition service is being called
Write-Host "`n4. Checking Backend Console..." -ForegroundColor Yellow
Write-Host "   💡 Look at your backend terminal for:" -ForegroundColor White
Write-Host "   - '🥗 Step 3: Analyzing nutrition data...'" -ForegroundColor White
Write-Host "   - API call errors or timeouts" -ForegroundColor White
Write-Host "   - '✅ Analysis complete' message" -ForegroundColor White

Write-Host "`n🔍 Diagnosis:" -ForegroundColor Cyan
Write-Host "   If backend health passes but nutrition fails:" -ForegroundColor White
Write-Host "   1. Network connectivity issue with Open Food Facts" -ForegroundColor White
Write-Host "   2. Timeout in nutrition service calls" -ForegroundColor White
Write-Host "   3. Missing error handling in nutrition analysis" -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Upload a receipt in your frontend" -ForegroundColor White
Write-Host "   2. Watch the backend console for detailed logs" -ForegroundColor White
Write-Host "   3. Check if '🥗 Step 3' appears and completes" -ForegroundColor White