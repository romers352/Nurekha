import requests
import sys
import json
from datetime import datetime

class NurekhaAPITester:
    def __init__(self, base_url="https://customer-automation-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_check(self):
        """Test API health"""
        try:
            response = self.session.get(f"{self.base_url}/api/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        try:
            data = {
                "email": "admin@nurekha.com",
                "password": "Admin@123"
            }
            response = self.session.post(f"{self.base_url}/api/auth/login", json=data)
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                details = f"Logged in as: {user_data.get('email', 'Unknown')}, Role: {user_data.get('role', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Admin Login", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False, {}

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                details = f"User: {user_data.get('email', 'Unknown')}, Role: {user_data.get('role', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Auth Me Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, str(e))
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/stats")
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                details = f"Quota: {stats.get('message_quota', 'N/A')}, Used: {stats.get('messages_used', 'N/A')}, Agents: {stats.get('active_agents', 'N/A')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Dashboard Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Dashboard Stats", False, str(e))
            return False

    def test_list_agents(self):
        """Test listing agents"""
        try:
            response = self.session.get(f"{self.base_url}/api/agents")
            success = response.status_code == 200
            
            if success:
                agents = response.json()
                details = f"Found {len(agents)} agents"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("List Agents", success, details)
            return success, agents if success else []
        except Exception as e:
            self.log_test("List Agents", False, str(e))
            return False, []

    def test_create_agent(self):
        """Test creating an agent"""
        try:
            data = {"name": f"Test Agent {datetime.now().strftime('%H%M%S')}"}
            response = self.session.post(f"{self.base_url}/api/agents", json=data)
            success = response.status_code == 201
            
            if success:
                agent = response.json()
                details = f"Created agent: {agent.get('name', 'Unknown')} (ID: {agent.get('agent_id', 'Unknown')[:12]}...)"
                return success, agent.get('agent_id')
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                return success, None
            
            self.log_test("Create Agent", success, details)
        except Exception as e:
            self.log_test("Create Agent", False, str(e))
            return False, None

    def test_delete_agent(self, agent_id):
        """Test deleting an agent"""
        if not agent_id:
            self.log_test("Delete Agent", False, "No agent ID provided")
            return False
            
        try:
            response = self.session.delete(f"{self.base_url}/api/agents/{agent_id}")
            success = response.status_code == 200
            
            if success:
                details = f"Deleted agent: {agent_id[:12]}..."
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Delete Agent", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Agent", False, str(e))
            return False

    def test_register_user(self):
        """Test user registration with Nepal mobile validation"""
        try:
            timestamp = datetime.now().strftime('%H%M%S')
            data = {
                "full_name": f"Test User {timestamp}",
                "email": f"test{timestamp}@example.com",
                "mobile": "9812345678",  # Valid Nepal mobile
                "business_name": f"Test Business {timestamp}",
                "business_types": ["E-commerce"],
                "password": "TestPass123!"
            }
            response = self.session.post(f"{self.base_url}/api/auth/register", json=data)
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                details = f"Registered user: {user_data.get('email', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("User Registration", success, details)
            return success
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_forgot_password(self):
        """Test forgot password endpoint"""
        try:
            data = {"email": "admin@nurekha.com"}
            response = self.session.post(f"{self.base_url}/api/auth/forgot-password", json=data)
            success = response.status_code == 200
            
            if success:
                details = "Forgot password request accepted"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Forgot Password", success, details)
            return success
        except Exception as e:
            self.log_test("Forgot Password", False, str(e))
            return False

    def test_logout(self):
        """Test logout endpoint"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            success = response.status_code == 200
            
            if success:
                details = "Logout successful"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Logout", success, details)
            return success
        except Exception as e:
            self.log_test("Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Nurekha Backend API Tests")
        print("=" * 50)
        
        # Test API health first
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False
        
        # Test admin login
        login_success, user_data = self.test_admin_login()
        if not login_success:
            print("❌ Admin login failed. Cannot proceed with authenticated tests.")
            return False
        
        # Test authenticated endpoints
        self.test_auth_me()
        self.test_dashboard_stats()
        
        # Test agent management
        agents_success, existing_agents = self.test_list_agents()
        if agents_success:
            create_success, agent_id = self.test_create_agent()
            if create_success and agent_id:
                self.test_delete_agent(agent_id)
        
        # Test other auth endpoints
        self.test_forgot_password()
        
        # Test user registration (this will create a new session)
        self.test_register_user()
        
        # Test logout (should clear cookies)
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

def main():
    tester = NurekhaAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "test_results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())