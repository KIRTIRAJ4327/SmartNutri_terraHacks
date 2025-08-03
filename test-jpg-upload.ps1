# Test JPG Upload to NutriScan API
Write-Host "📸 Testing JPG Upload to NutriScan API" -ForegroundColor Cyan

# Check if backend is running
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend is running (Version: $($healthCheck.version))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not running! Start with: cd backend && npm run dev" -ForegroundColor Red
    exit 1
}

# Create a test image file (dummy JPG - just for testing the upload mechanism)
$testImagePath = "test-receipt.jpg"
$dummyJpgHeader = [byte[]](0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46)
$dummyJpgContent = $dummyJpgHeader + [System.Text.Encoding]::ASCII.GetBytes("FAKE JPG CONTENT FOR TESTING UPLOAD MECHANISM")
[System.IO.File]::WriteAllBytes($testImagePath, $dummyJpgContent)

Write-Host "📁 Created test JPG file: $testImagePath" -ForegroundColor Green

# Test the upload
Write-Host "🔄 Testing file upload..." -ForegroundColor Yellow

try {
    # PowerShell multipart upload
    $uri = "http://localhost:5000/api/receipt/analyze"
    $fileBinary = [System.IO.File]::ReadAllBytes($testImagePath)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    $bodyLines = @(
        "--$boundary",
        'Content-Disposition: form-data; name="receipt"; filename="test-receipt.jpg"',
        'Content-Type: image/jpeg',
        '',
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBinary),
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    Write-Host "📤 Sending request to: $uri" -ForegroundColor Blue
    Write-Host "📏 Body size: $($body.Length) bytes" -ForegroundColor Blue
    
    $response = Invoke-RestMethod -Uri $uri `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body `
        -TimeoutSec 30
    
    Write-Host "✅ Upload successful!" -ForegroundColor Green
    Write-Host "📊 Response received:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
} catch {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get response content
    try {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseContent = $reader.ReadToEnd()
        Write-Host "Response Content: $responseContent" -ForegroundColor Yellow
    } catch {
        Write-Host "Could not read error response content" -ForegroundColor Yellow
    }
}

# Cleanup
Remove-Item $testImagePath -ErrorAction SilentlyContinue
Write-Host "🧹 Cleaned up test file" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 Debugging Tips:" -ForegroundColor Cyan
Write-Host "   1. Check backend console for detailed error logs" -ForegroundColor White
Write-Host "   2. Verify uploads/ directory exists and is writable" -ForegroundColor White
Write-Host "   3. Check Google Cloud credentials are properly configured" -ForegroundColor White
Write-Host "   4. Try with a smaller, clearer image" -ForegroundColor White