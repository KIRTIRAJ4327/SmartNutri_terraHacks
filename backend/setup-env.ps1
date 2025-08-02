# NutriScan Environment Setup Script
# Run this script to create your .env file

Write-Host "Setting up NutriScan environment..." -ForegroundColor Green

# Copy env.example to .env
Copy-Item "env.example" ".env" -Force

Write-Host "Created .env file from env.example" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Download your Google Cloud service account JSON key"
Write-Host "2. Place it in: .\config\google-cloud-key.json"
Write-Host "3. Update GOOGLE_CLOUD_PROJECT_ID in .env if needed"
Write-Host ""
Write-Host "Current configuration:" -ForegroundColor Cyan
Get-Content ".env"
Write-Host ""
Write-Host "Once configured, run: npm run dev" -ForegroundColor Green