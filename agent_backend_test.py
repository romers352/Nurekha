import requests
import sys
import json
from datetime import datetime

class NurekhaAgentAPITester:
    def __init__(self, base_url="https://customer-automation-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.agent_id = None
        self.channel_id = None
        self.conv_id = None
        self.faq_id = None
        self.product_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@nurekha.com", "password": "Admin@123"}
        )
        if success:
            print(f"   Logged in as: {response.get('email', 'Unknown')}")
        return success

    def test_create_agent(self):
        """Create a test agent"""
        success, response = self.run_test(
            "Create Agent",
            "POST",
            "agents",
            200,
            data={"name": f"Test Agent {datetime.now().strftime('%H%M%S')}"}
        )
        if success and 'agent_id' in response:
            self.agent_id = response['agent_id']
            print(f"   Created agent: {self.agent_id}")
        return success

    def test_get_agent(self):
        """Get specific agent"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Get Agent",
            "GET",
            f"agents/{self.agent_id}",
            200
        )
        return success

    def test_connect_channel(self):
        """Connect a channel to agent"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Connect Channel",
            "POST",
            f"agents/{self.agent_id}/channels",
            200,
            data={
                "channel_type": "facebook",
                "page_name": "Test Facebook Page",
                "page_id": "test_page_123"
            }
        )
        if success and 'channel_id' in response:
            self.channel_id = response['channel_id']
            print(f"   Connected channel: {self.channel_id}")
        return success

    def test_list_channels(self):
        """List agent channels"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "List Channels",
            "GET",
            f"agents/{self.agent_id}/channels",
            200
        )
        if success:
            print(f"   Found {len(response)} channels")
        return success

    def test_disconnect_channel(self):
        """Disconnect a channel"""
        if not self.agent_id or not self.channel_id:
            print("❌ No agent_id or channel_id available")
            return False
        
        success, response = self.run_test(
            "Disconnect Channel",
            "DELETE",
            f"agents/{self.agent_id}/channels/{self.channel_id}",
            200
        )
        return success

    def test_save_business_info(self):
        """Save business info"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        business_data = {
            "description": "Test business description",
            "contact_phone": "+977-1234567890",
            "contact_email": "test@business.com",
            "address": "Kathmandu, Nepal",
            "response_tone": "friendly",
            "response_language": "english",
            "business_hours": {
                "Monday": {"open": "09:00", "close": "18:00"},
                "Tuesday": {"open": "09:00", "close": "18:00"}
            }
        }
        
        success, response = self.run_test(
            "Save Business Info",
            "PUT",
            f"agents/{self.agent_id}/training/business-info",
            200,
            data=business_data
        )
        return success

    def test_get_business_info(self):
        """Get business info"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Get Business Info",
            "GET",
            f"agents/{self.agent_id}/training/business-info",
            200
        )
        return success

    def test_create_faq(self):
        """Create FAQ"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Create FAQ",
            "POST",
            f"agents/{self.agent_id}/training/faqs",
            200,
            data={
                "question": "What are your business hours?",
                "answer": "We are open Monday to Friday, 9 AM to 6 PM."
            }
        )
        if success and 'faq_id' in response:
            self.faq_id = response['faq_id']
            print(f"   Created FAQ: {self.faq_id}")
        return success

    def test_list_faqs(self):
        """List FAQs"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "List FAQs",
            "GET",
            f"agents/{self.agent_id}/training/faqs",
            200
        )
        if success:
            print(f"   Found {len(response)} FAQs")
        return success

    def test_delete_faq(self):
        """Delete FAQ"""
        if not self.agent_id or not self.faq_id:
            print("❌ No agent_id or faq_id available")
            return False
        
        success, response = self.run_test(
            "Delete FAQ",
            "DELETE",
            f"agents/{self.agent_id}/training/faqs/{self.faq_id}",
            200
        )
        return success

    def test_create_product(self):
        """Create product"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            f"agents/{self.agent_id}/training/products",
            200,
            data={
                "name": "Test Product",
                "price": 1500.0,
                "stock": 10,
                "category": "Electronics",
                "description": "A test product for testing purposes"
            }
        )
        if success and 'product_id' in response:
            self.product_id = response['product_id']
            print(f"   Created product: {self.product_id}")
        return success

    def test_list_products(self):
        """List products"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "List Products",
            "GET",
            f"agents/{self.agent_id}/training/products",
            200
        )
        if success:
            print(f"   Found {len(response)} products")
        return success

    def test_create_conversation(self):
        """Create conversation"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Create Conversation",
            "POST",
            f"agents/{self.agent_id}/conversations",
            200,
            data={
                "end_user_name": "Test Customer",
                "channel": "website"
            }
        )
        if success and 'conv_id' in response:
            self.conv_id = response['conv_id']
            print(f"   Created conversation: {self.conv_id}")
        return success

    def test_list_conversations(self):
        """List conversations"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "List Conversations",
            "GET",
            f"agents/{self.agent_id}/conversations",
            200
        )
        if success:
            print(f"   Found {len(response)} conversations")
        return success

    def test_send_message(self):
        """Send message in conversation"""
        if not self.agent_id or not self.conv_id:
            print("❌ No agent_id or conv_id available")
            return False
        
        success, response = self.run_test(
            "Send Message",
            "POST",
            f"agents/{self.agent_id}/conversations/{self.conv_id}/messages",
            200,
            data={
                "content": "Hello, this is a test message!",
                "sender_type": "agent"
            }
        )
        return success

    def test_list_messages(self):
        """List messages in conversation"""
        if not self.agent_id or not self.conv_id:
            print("❌ No agent_id or conv_id available")
            return False
        
        success, response = self.run_test(
            "List Messages",
            "GET",
            f"agents/{self.agent_id}/conversations/{self.conv_id}/messages",
            200
        )
        if success:
            print(f"   Found {len(response)} messages")
        return success

    def test_agent_stats(self):
        """Get agent statistics"""
        if not self.agent_id:
            print("❌ No agent_id available")
            return False
        
        success, response = self.run_test(
            "Agent Stats",
            "GET",
            f"agents/{self.agent_id}/stats",
            200
        )
        if success:
            stats = {k: v for k, v in response.items() if k.endswith('_count')}
            print(f"   Stats: {stats}")
        return success

def main():
    print("🚀 Starting Nurekha Agent API Tests...")
    print("=" * 50)
    
    tester = NurekhaAgentAPITester()
    
    # Test sequence - following the exact requirements from the review request
    tests = [
        ("Login", tester.test_login),
        ("Create Agent", tester.test_create_agent),
        ("Get Agent", tester.test_get_agent),
        ("Connect Channel", tester.test_connect_channel),
        ("List Channels", tester.test_list_channels),
        ("Disconnect Channel", tester.test_disconnect_channel),
        ("Save Business Info", tester.test_save_business_info),
        ("Get Business Info", tester.test_get_business_info),
        ("Create FAQ", tester.test_create_faq),
        ("List FAQs", tester.test_list_faqs),
        ("Delete FAQ", tester.test_delete_faq),
        ("Create Product", tester.test_create_product),
        ("List Products", tester.test_list_products),
        ("Create Conversation", tester.test_create_conversation),
        ("List Conversations", tester.test_list_conversations),
        ("Send Message", tester.test_send_message),
        ("List Messages", tester.test_list_messages),
        ("Agent Stats", tester.test_agent_stats),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All agent API tests passed!")
    else:
        print("⚠️  Some tests failed - check logs above")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())