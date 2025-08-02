/**
 * OCRService Usage Examples
 * 
 * This file shows how to use the OCRService class for receipt processing.
 * Make sure to set up your Google Cloud credentials before using.
 */

import { OCRService } from './ocrService';

// Example usage
async function exampleUsage() {
  const ocrService = new OCRService();
  
  try {
    // Method 1: Basic text extraction
    const imagePath = './uploads/receipt.jpg';
    const rawText = await ocrService.extractText(imagePath);
    console.log('Extracted text:', rawText);
    
    // Method 2: Parse receipt items
    const items = ocrService.parseReceiptText(rawText);
    console.log('Parsed items:', items);
    
    // Method 3: Complete receipt processing (recommended)
    const analysis = await ocrService.processReceipt(imagePath);
    console.log('Complete analysis:', analysis);
    
    // Method 4: Analyze text quality
    const quality = ocrService.analyzeTextQuality(rawText);
    console.log('Text quality:', quality);
    
    // Cleanup temporary files
    await ocrService.cleanupFile(imagePath);
    
  } catch (error) {
    console.error('OCR processing failed:', error.message);
  }
}

// Example error handling
async function exampleErrorHandling() {
  const ocrService = new OCRService();
  
  try {
    await ocrService.extractText('./non-existent-file.jpg');
  } catch (error) {
    switch (error.message) {
      case 'Image file not found':
        console.log('Please check the file path');
        break;
      case 'No text detected in image':
        console.log('Try a clearer image or different angle');
        break;
      case 'Google Cloud credentials not configured properly':
        console.log('Please set up your Google Cloud credentials');
        break;
      default:
        console.log('Unexpected error:', error.message);
    }
  }
}

export { exampleUsage, exampleErrorHandling };