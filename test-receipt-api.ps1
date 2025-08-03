# Test NutriScan Receipt Analysis API
Write-Host "🧪 Testing NutriScan Receipt Analysis API" -ForegroundColor Cyan

# Create a simple test receipt text file
$testReceiptContent = @"
GROCERY STORE RECEIPT
Date: 2025-01-08
================

Coca Cola 330ml     $1.99
Fresh Bananas       $2.49  
Whole Wheat Bread   $3.29
Greek Yogurt        $4.99
Potato Chips        $2.79

TOTAL: $15.55
Thank you!
"@

# Save test receipt
$testReceiptPath = "test-receipt.txt"
$testReceiptContent | Out-File -FilePath $testReceiptPath -Encoding UTF8

Write-Host "📄 Created test receipt: $testReceiptPath" -ForegroundColor Green

# Test the API endpoint
Write-Host "🔄 Testing receipt analysis..." -ForegroundColor Yellow

try {
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBinary = [System.IO.File]::ReadAllBytes($testReceiptPath)
    $encoding = [System.Text.Encoding]::GetEncoding("iso-8859-1")
    
    $bodyLines = @(
        "--$boundary",
        'Content-Disposition: form-data; name="receipt"; filename="test-receipt.txt"',
        'Content-Type: text/plain',
        '',
        $encoding.GetString($fileBinary),
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/receipt/analyze" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body `
        -TimeoutSec 30
    
    Write-Host "✅ API Response Received!" -ForegroundColor Green
    Write-Host ""
    
    # Display results
    Write-Host "📊 Analysis Results:" -ForegroundColor Cyan
    Write-Host "─" * 40 -ForegroundColor Gray
    
    Write-Host "Overall Health Score: $($response.analysis.overallScore)/100" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🧂 Sodium Score: $($response.analysis.sodiumScore)/100" -ForegroundColor $(if($response.analysis.sodiumScore -gt 70) {"Green"} elseif($response.analysis.sodiumScore -gt 40) {"Yellow"} else {"Red"})
    Write-Host "🏭 Processing Score: $($response.analysis.processingScore)/100" -ForegroundColor $(if($response.analysis.processingScore -gt 70) {"Green"} elseif($response.analysis.processingScore -gt 40) {"Yellow"} else {"Red"})
    Write-Host "🍯 Sugar Score: $($response.analysis.sugarScore)/100" -ForegroundColor $(if($response.analysis.sugarScore -gt 70) {"Green"} elseif($response.analysis.sugarScore -gt 40) {"Yellow"} else {"Red"})
    Write-Host "💪 Nutrient Score: $($response.analysis.nutrientScore)/100" -ForegroundColor $(if($response.analysis.nutrientScore -gt 70) {"Green"} elseif($response.analysis.nutrientScore -gt 40) {"Yellow"} else {"Red"})
    
    Write-Host ""
    Write-Host "🛒 Items Analyzed: $($response.items.Count)" -ForegroundColor White
    foreach($item in $response.items) {
        Write-Host "  • $($item.name) - $($item.price)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "💡 Top Recommendations:" -ForegroundColor Cyan
    $response.analysis.recommendations[0..2] | ForEach-Object {
        Write-Host "  • $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "⏱️ Processing Time: $($response.processingTime)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ API Test Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*Unable to connect*") {
        Write-Host ""
        Write-Host "💡 Make sure backend is running:" -ForegroundColor Yellow
        Write-Host "   cd backend" -ForegroundColor Yellow
        Write-Host "   npm run dev" -ForegroundColor Yellow
    }
}

# Cleanup
Remove-Item $testReceiptPath -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "🧹 Test completed and cleaned up!" -ForegroundColor Green