#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Meme Generator
Tests all backend endpoints with various scenarios including error handling
"""

import requests
import json
import base64
import io
from PIL import Image
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

def create_test_image():
    """Create a simple test image for upload testing"""
    img = Image.new('RGB', (100, 100), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    return img_buffer

def test_root_endpoint():
    """Test the root API endpoint"""
    print("\n=== Testing Root Endpoint ===")
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('message') == 'Meme Generator API':
                print("✅ Root endpoint working correctly")
                return True
            else:
                print("❌ Root endpoint returned unexpected message")
                return False
        else:
            print("❌ Root endpoint failed")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {str(e)}")
        return False

def test_meme_templates():
    """Test GET /api/memes/templates endpoint"""
    print("\n=== Testing Meme Templates Endpoint ===")
    try:
        response = requests.get(f"{API_BASE}/memes/templates")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            
            if data.get('success') and 'data' in data:
                templates = data['data']
                print(f"Number of templates: {len(templates)}")
                
                if templates:
                    # Check first template structure
                    first_template = templates[0]
                    required_fields = ['id', 'name', 'url', 'width', 'height', 'box_count']
                    
                    if all(field in first_template for field in required_fields):
                        print("✅ Meme templates endpoint working correctly")
                        print(f"Sample template: {first_template['name']} (ID: {first_template['id']})")
                        return True, templates
                    else:
                        print("❌ Template structure missing required fields")
                        return False, []
                else:
                    print("❌ No templates returned")
                    return False, []
            else:
                print("❌ Invalid response structure")
                return False, []
        else:
            print(f"❌ Templates endpoint failed with status {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Templates endpoint error: {str(e)}")
        return False, []

def test_meme_creation_without_credentials(template_id):
    """Test POST /api/memes/create without Imgflip credentials"""
    print("\n=== Testing Meme Creation Without Credentials ===")
    try:
        payload = {
            "template_id": template_id,
            "boxes": [
                {
                    "text": "Test Top Text",
                    "x": 0,
                    "y": 0,
                    "width": 100,
                    "height": 50,
                    "color": "#ffffff",
                    "outline_color": "#000000"
                },
                {
                    "text": "Test Bottom Text",
                    "x": 0,
                    "y": 50,
                    "width": 100,
                    "height": 50,
                    "color": "#ffffff",
                    "outline_color": "#000000"
                }
            ],
            "font_family": "Impact",
            "font_size": 36
        }
        
        response = requests.post(f"{API_BASE}/memes/create", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 500:
            data = response.json()
            if "Imgflip credentials not configured" in data.get('detail', ''):
                print("✅ Meme creation correctly handles missing credentials")
                return True
            else:
                print("❌ Unexpected error message for missing credentials")
                return False
        else:
            print("❌ Expected 500 error for missing credentials")
            return False
    except Exception as e:
        print(f"❌ Meme creation test error: {str(e)}")
        return False

def test_file_upload():
    """Test POST /api/upload endpoint"""
    print("\n=== Testing File Upload Endpoint ===")
    try:
        # Test with PNG image
        test_image = create_test_image()
        files = {'file': ('test.png', test_image, 'image/png')}
        
        response = requests.post(f"{API_BASE}/upload", files=files)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            
            if data.get('success') and 'data' in data:
                upload_data = data['data']
                required_fields = ['id', 'filename', 'url']
                
                if all(field in upload_data for field in required_fields):
                    print("✅ File upload working correctly")
                    print(f"Uploaded file ID: {upload_data['id']}")
                    print(f"Data URL length: {len(upload_data['url'])}")
                    
                    # Verify it's a valid data URL
                    if upload_data['url'].startswith('data:image/png;base64,'):
                        print("✅ Data URL format is correct")
                        return True, upload_data
                    else:
                        print("❌ Invalid data URL format")
                        return False, None
                else:
                    print("❌ Upload response missing required fields")
                    return False, None
            else:
                print("❌ Invalid upload response structure")
                return False, None
        else:
            print(f"❌ File upload failed with status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ File upload error: {str(e)}")
        return False, None

def test_invalid_file_upload():
    """Test file upload with invalid file type"""
    print("\n=== Testing Invalid File Upload ===")
    try:
        # Create a text file instead of image
        files = {'file': ('test.txt', io.StringIO('This is not an image'), 'text/plain')}
        
        response = requests.post(f"{API_BASE}/upload", files=files)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            if "File must be an image" in data.get('detail', ''):
                print("✅ Invalid file upload correctly rejected")
                return True
            else:
                print("❌ Unexpected error message for invalid file")
                return False
        else:
            print("❌ Expected 400 error for invalid file type")
            return False
    except Exception as e:
        print(f"❌ Invalid file upload test error: {str(e)}")
        return False

def test_get_user_memes():
    """Test GET /api/memes endpoint"""
    print("\n=== Testing Get User Memes Endpoint ===")
    try:
        response = requests.get(f"{API_BASE}/memes")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            
            if data.get('success') and 'data' in data:
                memes = data['data']
                print(f"Number of memes: {len(memes)}")
                print("✅ Get user memes endpoint working correctly")
                return True, memes
            else:
                print("❌ Invalid memes response structure")
                return False, []
        else:
            print(f"❌ Get memes failed with status {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Get memes error: {str(e)}")
        return False, []

def test_delete_nonexistent_meme():
    """Test DELETE /api/memes/{meme_id} with non-existent ID"""
    print("\n=== Testing Delete Non-existent Meme ===")
    try:
        fake_meme_id = "non-existent-meme-id"
        response = requests.delete(f"{API_BASE}/memes/{fake_meme_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            data = response.json()
            if "Meme not found" in data.get('detail', ''):
                print("✅ Delete non-existent meme correctly returns 404")
                return True
            else:
                print("❌ Unexpected error message for non-existent meme")
                return False
        else:
            print("❌ Expected 404 error for non-existent meme")
            return False
    except Exception as e:
        print(f"❌ Delete meme test error: {str(e)}")
        return False

def test_custom_meme_creation(image_url):
    """Test POST /api/memes/create-custom endpoint"""
    print("\n=== Testing Custom Meme Creation ===")
    try:
        payload = {
            "image_url": image_url,
            "text_lines": [
                {"text": "Custom Top Text", "position": "top"},
                {"text": "Custom Bottom Text", "position": "bottom"}
            ],
            "font_family": "Impact",
            "font_size": 36,
            "text_color": "#ffffff"
        }
        
        response = requests.post(f"{API_BASE}/memes/create-custom", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get('success') and 'data' in data:
                meme_data = data['data']
                if 'meme_id' in meme_data:
                    print("✅ Custom meme creation working correctly")
                    return True
                else:
                    print("❌ Custom meme response missing meme_id")
                    return False
            else:
                print("❌ Invalid custom meme response structure")
                return False
        else:
            print(f"❌ Custom meme creation failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Custom meme creation error: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS configuration"""
    print("\n=== Testing CORS Configuration ===")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(f"{API_BASE}/memes/templates", headers=headers)
        print(f"OPTIONS Status Code: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        cors_headers = response.headers
        if 'access-control-allow-origin' in cors_headers:
            print("✅ CORS headers present")
            return True
        else:
            print("❌ CORS headers missing")
            return False
    except Exception as e:
        print(f"❌ CORS test error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Comprehensive Backend API Tests")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Root endpoint
    results['root'] = test_root_endpoint()
    
    # Test 2: Meme templates
    templates_success, templates = test_meme_templates()
    results['templates'] = templates_success
    
    # Test 3: Meme creation without credentials
    if templates:
        template_id = templates[0]['id']
        results['meme_creation_no_creds'] = test_meme_creation_without_credentials(template_id)
    else:
        results['meme_creation_no_creds'] = False
        print("❌ Skipping meme creation test - no templates available")
    
    # Test 4: File upload
    upload_success, upload_data = test_file_upload()
    results['file_upload'] = upload_success
    
    # Test 5: Invalid file upload
    results['invalid_file_upload'] = test_invalid_file_upload()
    
    # Test 6: Get user memes
    memes_success, memes = test_get_user_memes()
    results['get_memes'] = memes_success
    
    # Test 7: Delete non-existent meme
    results['delete_meme'] = test_delete_nonexistent_meme()
    
    # Test 8: Custom meme creation
    if upload_data:
        results['custom_meme'] = test_custom_meme_creation(upload_data['url'])
    else:
        results['custom_meme'] = False
        print("❌ Skipping custom meme test - no uploaded image available")
    
    # Test 9: CORS configuration
    results['cors'] = test_cors_headers()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the detailed output above.")
    
    return results

if __name__ == "__main__":
    run_all_tests()