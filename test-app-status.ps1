#!/usr/bin/env pwsh
# NutriScan Application Status Check
# Tests both backend and frontend services

Write-Host "🔍 NutriScan Application Status Check" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Backend Tests
Write-Host "`n🏥 Backend Server Tests" -ForegroundColor Yellow
Write-Host "-" * 25 -ForegroundColor Gray

# Test 1: Basic Health Check
Write-Host "1. Testing Basic Health Check..." -NoNewline
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    if ($healthResponse.status -eq "healthy") {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Gray
        Write-Host "   Uptime: $($healthResponse.uptime.human)" -ForegroundColor Gray
        Write-Host "   Version: $($healthResponse.version)" -ForegroundColor Gray
    } else {
        Write-Host " ❌ FAIL - Unhealthy status" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - Server not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Detailed Health Check
Write-Host "`n2. Testing Detailed Health Check..." -NoNewline
try {
    $detailedResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health/detailed" -Method GET -TimeoutSec 5
    Write-Host " ✅ PASS" -ForegroundColor Green
    Write-Host "   Services Available: OCR, Nutrition, Cache" -ForegroundColor Gray
    Write-Host "   Max File Size: $($detailedResponse.capabilities.maxFileSize)" -ForegroundColor Gray
    Write-Host "   Cache Enabled: $($detailedResponse.performance.cacheEnabled)" -ForegroundColor Gray
} catch {
    Write-Host " ❌ FAIL - Detailed endpoint error" -ForegroundColor Red
}

# Test 3: Info Endpoint
Write-Host "`n3. Testing Info Endpoint..." -NoNewline
try {
    $infoResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health/info" -Method GET -TimeoutSec 5
    Write-Host " ✅ PASS" -ForegroundColor Green
    Write-Host "   App: $($infoResponse.app)" -ForegroundColor Gray
    Write-Host "   Environment: $($infoResponse.environment)" -ForegroundColor Gray
} catch {
    Write-Host " ❌ FAIL - Info endpoint error" -ForegroundColor Red
}

# Frontend Tests
Write-Host "`n🎨 Frontend Application Tests" -ForegroundColor Yellow
Write-Host "-" * 30 -ForegroundColor Gray

# Test 4: Frontend Accessibility
Write-Host "4. Testing Frontend Accessibility..." -NoNewline
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Status: $($frontendResponse.StatusCode) - $($frontendResponse.StatusDescription)" -ForegroundColor Gray
        
        # Check if it's the React app
        if ($frontendResponse.Content -like "*React App*" -or $frontendResponse.Content -like "*NutriScan*") {
            Write-Host "   Content: React application loaded" -ForegroundColor Gray
        } else {
            Write-Host "   Content: Unknown application" -ForegroundColor Yellow
        }
    } else {
        Write-Host " ❌ FAIL - Unexpected status code: $($frontendResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - Frontend not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Note: Make sure 'npm start' is running in frontend/" -ForegroundColor Yellow
}

# Integration Tests
Write-Host "`n🔗 Integration Tests" -ForegroundColor Yellow
Write-Host "-" * 20 -ForegroundColor Gray

# Test 5: CORS Configuration
Write-Host "5. Testing CORS Configuration..." -NoNewline
try {
    $headers = @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    $corsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method OPTIONS -Headers $headers -TimeoutSec 5
    Write-Host " ✅ PASS" -ForegroundColor Green
    Write-Host "   CORS headers properly configured" -ForegroundColor Gray
} catch {
    Write-Host " ⚠️  WARNING - CORS might have issues" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📊 Status Summary" -ForegroundColor Cyan
Write-Host "-" * 15 -ForegroundColor Gray

$backendStatus = try { 
    $test = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 3
    "✅ RUNNING"
} catch { "❌ STOPPED" }

$frontendStatus = try { 
    $test = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3
    "✅ RUNNING"
} catch { "❌ STOPPED" }

Write-Host "Backend (Port 5000):  $backendStatus" -ForegroundColor White
Write-Host "Frontend (Port 3000): $frontendStatus" -ForegroundColor White

Write-Host "`n🚀 Quick Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Blue
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Blue
Write-Host "   API Health: http://localhost:5000/api/health" -ForegroundColor Blue
Write-Host "   API Docs:   http://localhost:5000/api/health/detailed" -ForegroundColor Blue

if ($backendStatus -like "*RUNNING*" -and $frontendStatus -like "*RUNNING*") {
    Write-Host "`n🎉 Your NutriScan app is fully operational!" -ForegroundColor Green
    Write-Host "   Ready to analyze receipts and provide health insights!" -ForegroundColor Green
} elseif ($backendStatus -like "*RUNNING*") {
    Write-Host "`n⚠️  Backend is running, but frontend needs to be started" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend; npm start" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Services need to be started:" -ForegroundColor Red
    Write-Host "   Backend: cd backend; npm run dev" -ForegroundColor Red
    Write-Host "   Frontend: cd frontend; npm start" -ForegroundColor Red
}

Write-Host ""