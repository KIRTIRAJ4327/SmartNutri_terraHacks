"""
CORD-v2 Dataset Downloader for NutriScan Testing
Downloads receipt images from the CORD-v2 dataset and prepares them for testing
"""

import os
import json
from datasets import load_dataset
from PIL import Image
import requests
from io import BytesIO

def download_cord_receipts(num_samples=20, output_dir="test-receipts"):
    """
    Download receipt images from CORD-v2 dataset
    
    Args:
        num_samples: Number of receipt images to download
        output_dir: Directory to save the images
    """
    
    print("🚀 Loading CORD-v2 dataset...")
    
    try:
        # Load the CORD-v2 dataset
        ds = load_dataset("naver-clova-ix/cord-v2")
        
        print(f"✅ Dataset loaded successfully!")
        print(f"📊 Available splits: {list(ds.keys())}")
        
        # Use the test split for our testing
        test_data = ds['test']
        print(f"📄 Total receipts in test set: {len(test_data)}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Download sample images
        print(f"\n📸 Downloading {min(num_samples, len(test_data))} receipt images...")
        
        successful_downloads = 0
        metadata = []
        
        for i, sample in enumerate(test_data):
            if successful_downloads >= num_samples:
                break
                
            try:
                # Get the image
                image = sample['image']
                
                # Generate filename
                filename = f"cord_receipt_{i+1:03d}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                # Save the image
                if isinstance(image, Image.Image):
                    # Convert to RGB if necessary (some images might be RGBA)
                    if image.mode in ('RGBA', 'LA', 'P'):
                        image = image.convert('RGB')
                    
                    image.save(filepath, 'JPEG', quality=95)
                    
                    print(f"✅ Downloaded: {filename}")
                    
                    # Save metadata
                    ground_truth = sample.get('ground_truth', {})
                    metadata.append({
                        'filename': filename,
                        'original_index': i,
                        'image_size': image.size,
                        'has_ground_truth': bool(ground_truth),
                        'ground_truth_keys': list(ground_truth.keys()) if ground_truth else []
                    })
                    
                    successful_downloads += 1
                    
                else:
                    print(f"⚠️  Skipped sample {i+1}: Invalid image format")
                    
            except Exception as e:
                print(f"❌ Failed to download sample {i+1}: {str(e)}")
                continue
        
        # Save metadata file
        metadata_file = os.path.join(output_dir, 'cord_metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n🎉 Download completed!")
        print(f"✅ Successfully downloaded: {successful_downloads} receipt images")
        print(f"📁 Images saved to: {output_dir}/")
        print(f"📄 Metadata saved to: {metadata_file}")
        
        # Show sample ground truth structure
        if len(test_data) > 0 and test_data[0].get('ground_truth'):
            print(f"\n📋 Sample ground truth structure:")
            gt_keys = list(test_data[0]['ground_truth'].keys())
            print(f"   Available fields: {gt_keys}")
        
        return successful_downloads
        
    except Exception as e:
        print(f"❌ Error loading dataset: {str(e)}")
        print(f"💡 Make sure you have internet connection and sufficient disk space")
        return 0

def create_batch_test_script():
    """Create a specialized batch testing script for CORD dataset"""
    
    script_content = '''"""
CORD Dataset Batch Tester for NutriScan
Processes CORD-v2 receipt images and compares with ground truth
"""

import json
import os
from test_batch_receipts import batchProcessReceipts

def test_cord_receipts():
    """Test NutriScan with CORD dataset receipts"""
    
    print("🧪 Testing NutriScan with CORD-v2 Dataset")
    print("=" * 50)
    
    # Check if CORD metadata exists
    metadata_file = "test-receipts/cord_metadata.json"
    
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        print(f"📄 Found {len(metadata)} CORD receipt images")
        print("🚀 Starting batch processing...\\n")
        
        # Run batch processing
        results = batchProcessReceipts()
        
        # Additional CORD-specific analysis
        print("\\n📊 CORD Dataset Analysis:")
        print("-" * 30)
        
        for item in metadata:
            filename = item['filename']
            print(f"📄 {filename}")
            print(f"   Original size: {item['image_size']}")
            print(f"   Has ground truth: {item['has_ground_truth']}")
            
        return results
    else:
        print(f"❌ CORD metadata not found at {metadata_file}")
        print("💡 Run download-cord-dataset.py first")
        return None

if __name__ == "__main__":
    test_cord_receipts()
'''
    
    with open('test-cord-receipts.py', 'w') as f:
        f.write(script_content)
    
    print("📝 Created specialized CORD testing script: test-cord-receipts.py")

if __name__ == "__main__":
    print("🎯 CORD-v2 Dataset Downloader for NutriScan")
    print("=" * 50)
    
    # Download receipt images
    num_downloaded = download_cord_receipts(num_samples=20)
    
    if num_downloaded > 0:
        create_batch_test_script()
        
        print(f"\n🚀 Next Steps:")
        print(f"1. Make sure your NutriScan backend is running")
        print(f"2. Run: python test-cord-receipts.py")
        print(f"3. Or use the regular batch processor: node test-batch-receipts.js")
        print(f"\n💡 The CORD dataset contains real receipt images with ground truth data!")
        print(f"📊 Perfect for validating your OCR accuracy and nutrition analysis!")
    else:
        print(f"\n❌ No images were downloaded. Please check your internet connection.")