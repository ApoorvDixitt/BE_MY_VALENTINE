#!/usr/bin/env python3
"""
Backend API Testing for Letters You Can't Send - Valentine Edition
Tests all CRUD operations, payment flow, and letter generation
"""

import requests
import time
import json
from datetime import datetime, timezone, timedelta

class ValentineAPITester:
    def __init__(self):
        self.base_url = "https://unsent-valentine.preview.emergentagent.com/api"
        self.test_order_id = None
        self.test_letter_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name, success, response_data=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)}")
        else:
            self.failed_tests.append({"test": test_name, "error": str(error)})
            print(f"❌ {test_name} - FAILED")
            if error:
                print(f"   Error: {error}")

    def make_request(self, method, endpoint, data=None, timeout=30):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            
            return response
        except Exception as e:
            return None, str(e)

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        response = self.make_request('GET', '')
        success = response and response.status_code == 200
        if success:
            data = response.json()
            success = "Valentine Edition" in data.get('message', '')
        self.log_result("Root endpoint", success, response.json() if success else None, 
                       f"Status: {response.status_code if response else 'No response'}")
        
        # Test health endpoint
        response = self.make_request('GET', 'health')
        success = response and response.status_code == 200
        if success:
            data = response.json()
            success = data.get('status') == 'ok'
        self.log_result("Health check", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_pricing_endpoint(self):
        """Test geo-based pricing endpoint"""
        print("\n🔍 Testing Geo-based Pricing...")
        
        response = self.make_request('GET', 'pricing')
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            required_fields = ['price', 'currency', 'symbol', 'display', 'country']
            success = all(field in data for field in required_fields)
            
            if success:
                # Verify pricing structure
                price = data.get('price')
                currency = data.get('currency')
                success = isinstance(price, (int, float)) and currency in ['USD', 'INR']
                print(f"   Pricing: {data.get('display')} ({data.get('country')})")
        
        self.log_result("Geo-based pricing endpoint", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_create_order(self):
        """Test order creation with valid data including language field"""
        print("\n🔍 Testing Order Creation with Language...")
        
        order_data = {
            "context": "valentine-partner",
            "name": "Alex",
            "feelings": "deeply in love but struggling with distance",
            "missing": "your laugh and the way you make coffee in the morning", 
            "memory": "that rainy Sunday when we stayed in bed all day talking",
            "unsaid": "I'm scared of losing what we have but excited about our future",
            "tone": "gentle-romantic",
            "delivery_type": "sealed",
            "reveal_at": None,
            "language": "english"  # New language field
        }
        
        response = self.make_request('POST', 'orders', order_data)
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            required_fields = ['order_id', 'status', 'payment_confirmed', 'letter_ready']
            success = all(field in data for field in required_fields)
            if success and data.get('status') == 'created':
                self.test_order_id = data.get('order_id')
                print(f"   Created order ID: {self.test_order_id}")
        
        self.log_result("Create order with language", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_create_hindi_order(self):
        """Test order creation with Hindi language"""
        print("\n🔍 Testing Hindi Language Order...")
        
        order_data = {
            "context": "miss-cant-talk",
            "name": "प्रिया",
            "feelings": "तुम्हारी याद में डूबा हुआ",
            "missing": "तुम्हारी आवाज़ और हंसी",
            "memory": "वो शाम जब हमने छत पर तारे देखे थे",
            "unsaid": "मैं तुमसे बहुत प्यार करता हूं",
            "tone": "deep-emotional",
            "delivery_type": "sealed",
            "reveal_at": None,
            "language": "hindi"
        }
        
        response = self.make_request('POST', 'orders', order_data)
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = data.get('status') == 'created'
            print(f"   Created Hindi order ID: {data.get('order_id')}")
        
        self.log_result("Create Hindi language order", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_create_hinglish_order(self):
        """Test order creation with Hinglish language"""
        print("\n🔍 Testing Hinglish Language Order...")
        
        order_data = {
            "context": "long-distance",
            "name": "Jaan",
            "feelings": "bohot yaad aati hai tumhari",
            "missing": "tumhara saath aur baatein",
            "memory": "wo raat jab hum phone pe subah tak baat karte rahe",
            "unsaid": "tumhare bina sab kuch adhoora lagta hai",
            "tone": "gentle-romantic",
            "delivery_type": "unsent",
            "reveal_at": None,
            "language": "hinglish"
        }
        
        response = self.make_request('POST', 'orders', order_data)
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = data.get('status') == 'created'
            print(f"   Created Hinglish order ID: {data.get('order_id')}")
        
        self.log_result("Create Hinglish language order", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_timed_delivery_order(self):
        """Test order creation with timed delivery"""
        print("\n🔍 Testing Timed Delivery Order...")
        
        # Set reveal time to 1 minute from now
        reveal_time = (datetime.now(timezone.utc) + timedelta(minutes=1)).isoformat()
        
        order_data = {
            "context": "long-distance",
            "name": "Taylor",
            "feelings": "missing you terribly",
            "missing": "your voice and presence",
            "memory": "our first valentine's day together",
            "unsaid": "I wish you were here right now",
            "tone": "deep-emotional",
            "delivery_type": "timed",
            "reveal_at": reveal_time
        }
        
        response = self.make_request('POST', 'orders', order_data)
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = (data.get('delivery_type') == 'timed' and 
                      data.get('reveal_at') == reveal_time)
        
        self.log_result("Create timed delivery order", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_get_order(self):
        """Test getting order by ID"""
        print("\n🔍 Testing Order Retrieval...")
        
        if not self.test_order_id:
            self.log_result("Get order", False, None, "No test order ID available")
            return
        
        response = self.make_request('GET', f'orders/{self.test_order_id}')
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = data.get('order_id') == self.test_order_id
        
        self.log_result("Get order by ID", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_mock_payment(self):
        """Test mock payment confirmation"""
        print("\n🔍 Testing Mock Payment...")
        
        if not self.test_order_id:
            self.log_result("Mock payment", False, None, "No test order ID available")
            return
        
        response = self.make_request('POST', f'orders/{self.test_order_id}/pay/mock-success')
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = (data.get('payment_confirmed') == True and 
                      data.get('status') in ['paid', 'generating'])
            print(f"   Payment status: {data.get('status')}")
        
        self.log_result("Mock payment confirmation", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_letter_generation_polling(self):
        """Test letter generation by polling order status"""
        print("\n🔍 Testing Letter Generation (30s timeout)...")
        
        if not self.test_order_id:
            self.log_result("Letter generation", False, None, "No test order ID available")
            return
        
        start_time = time.time()
        timeout = 35  # 35 second timeout
        
        while time.time() - start_time < timeout:
            response = self.make_request('GET', f'orders/{self.test_order_id}')
            
            if response and response.status_code == 200:
                data = response.json()
                status = data.get('status')
                letter_ready = data.get('letter_ready', False)
                letter_token = data.get('letter_token')
                
                print(f"   Status: {status}, Ready: {letter_ready}")
                
                if status == 'complete' and letter_ready and letter_token:
                    self.test_letter_token = letter_token
                    self.log_result("Letter generation", True, data)
                    return
                elif status == 'failed':
                    self.log_result("Letter generation", False, data, "Letter generation failed")
                    return
            
            time.sleep(3)  # Poll every 3 seconds
        
        self.log_result("Letter generation", False, None, "Timed out waiting for letter generation")

    def test_get_letter(self):
        """Test getting letter content by token"""
        print("\n🔍 Testing Letter Retrieval...")
        
        if not self.test_letter_token:
            self.log_result("Get letter", False, None, "No test letter token available")
            return
        
        response = self.make_request('GET', f'letters/{self.test_letter_token}')
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = (len(data.get('content', '')) > 100 and  # Letter should be substantial
                      data.get('delivery_type') == 'sealed')
            print(f"   Letter length: {len(data.get('content', ''))} characters")
            print(f"   Delivery type: {data.get('delivery_type')}")
        
        self.log_result("Get letter content", success, 
                       {k: v for k, v in response.json().items() if k != 'content'} if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_open_letter(self):
        """Test marking letter as opened"""
        print("\n🔍 Testing Letter Opening...")
        
        if not self.test_letter_token:
            self.log_result("Open letter", False, None, "No test letter token available")
            return
        
        response = self.make_request('POST', f'letters/{self.test_letter_token}/open')
        success = response and response.status_code == 200
        
        if success:
            data = response.json()
            success = data.get('status') in ['opened', 'already_opened']
        
        self.log_result("Open letter", success, response.json() if success else None,
                       f"Status: {response.status_code if response else 'No response'}")

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases...")
        
        # Test invalid order ID
        response = self.make_request('GET', 'orders/invalid-id')
        success = response and response.status_code == 404
        self.log_result("Invalid order ID returns 404", success, None,
                       f"Status: {response.status_code if response else 'No response'}")
        
        # Test invalid letter token
        response = self.make_request('GET', 'letters/invalid-token')
        success = response and response.status_code == 404
        self.log_result("Invalid letter token returns 404", success, None,
                       f"Status: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Backend API Tests for Valentine Edition")
        print(f"Testing against: {self.base_url}")
        
        self.test_health_check()
        self.test_pricing_endpoint()
        self.test_create_order()
        self.test_create_hindi_order()
        self.test_create_hinglish_order()
        self.test_timed_delivery_order()
        self.test_get_order()
        self.test_mock_payment()
        self.test_letter_generation_polling()
        self.test_get_letter()
        self.test_open_letter()
        self.test_error_cases()
        
        # Print summary
        print(f"\n📊 Test Summary")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "N/A")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        return self.tests_passed, self.tests_run, self.failed_tests

if __name__ == "__main__":
    tester = ValentineAPITester()
    passed, total, failures = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    exit(0 if passed == total else 1)