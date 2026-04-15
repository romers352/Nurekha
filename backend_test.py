import requests
import sys
import json
from datetime import datetime

class NurekhaAPITester:
    def __init__(self, base_url="https://api-fixes-ui.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_agent_id = None

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

    def test_auth_register_without_business_types(self):
        """Test auth register WITHOUT business_types (should default to [])"""
        try:
            timestamp = datetime.now().strftime('%H%M%S')
            data = {
                "full_name": "Test User",
                "email": f"testuser123{timestamp}@test.com",
                "mobile": "9812345678",
                "business_name": "Test Biz",
                "password": "TestPass1!"
                # Note: business_types is intentionally omitted
            }
            response = self.session.post(f"{self.base_url}/api/auth/register", json=data)
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                # Verify business_types defaults to []
                business_types = user_data.get('business_types', None)
                if business_types == []:
                    details = f"Registered user: {user_data.get('email', 'Unknown')}, business_types defaulted to []"
                else:
                    success = False
                    details = f"FAILED: business_types should default to [], got: {business_types}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Auth Register Without business_types", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Register Without business_types", False, str(e))
            return False

    def test_agent_creation_with_business_type(self):
        """Test agent creation with business_type field"""
        try:
            data = {
                "name": "Hotel Bot",
                "business_type": "Hotel"
            }
            response = self.session.post(f"{self.base_url}/api/agents", json=data)
            success = response.status_code in [200, 201]  # Accept both 200 and 201
            
            if success:
                agent = response.json()
                # Verify business_type field is included in response
                business_type = agent.get('business_type')
                if business_type == "Hotel":
                    details = f"Created agent: {agent.get('name', 'Unknown')} with business_type: {business_type}"
                    self.created_agent_id = agent.get('agent_id')
                else:
                    success = False
                    details = f"FAILED: business_type should be 'Hotel', got: {business_type}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Agent Creation with business_type", success, details)
            return success, self.created_agent_id if success else None
        except Exception as e:
            self.log_test("Agent Creation with business_type", False, str(e))
            return False, None

    def test_agent_rename(self, agent_id):
        """Test agent rename via PATCH"""
        if not agent_id:
            self.log_test("Agent Rename", False, "No agent ID provided")
            return False
            
        try:
            data = {"name": "Renamed Bot"}
            response = self.session.patch(f"{self.base_url}/api/agents/{agent_id}", json=data)
            success = response.status_code == 200
            
            if success:
                agent = response.json()
                new_name = agent.get('name')
                if new_name == "Renamed Bot":
                    details = f"Successfully renamed agent to: {new_name}"
                else:
                    success = False
                    details = f"FAILED: name should be 'Renamed Bot', got: {new_name}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Agent Rename", success, details)
            return success
        except Exception as e:
            self.log_test("Agent Rename", False, str(e))
            return False

    def test_agent_deactivate(self, agent_id):
        """Test agent deactivate via PATCH"""
        if not agent_id:
            self.log_test("Agent Deactivate", False, "No agent ID provided")
            return False
            
        try:
            data = {"status": "inactive"}
            response = self.session.patch(f"{self.base_url}/api/agents/{agent_id}", json=data)
            success = response.status_code == 200
            
            if success:
                agent = response.json()
                status = agent.get('status')
                if status == "inactive":
                    details = f"Successfully deactivated agent, status: {status}"
                else:
                    success = False
                    details = f"FAILED: status should be 'inactive', got: {status}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Agent Deactivate", success, details)
            return success
        except Exception as e:
            self.log_test("Agent Deactivate", False, str(e))
            return False

    def test_notifications_endpoints(self):
        """Test all notification endpoints"""
        try:
            # Test GET /api/notifications
            response = self.session.get(f"{self.base_url}/api/notifications")
            list_success = response.status_code == 200
            
            if list_success:
                notifications = response.json()
                has_notifications = len(notifications) >= 1  # Should have at least 1 from agent creation
                details = f"Found {len(notifications)} notifications"
                if not has_notifications:
                    list_success = False
                    details += " (Expected at least 1 notification from agent creation)"
            else:
                details = f"GET notifications failed - Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("GET /api/notifications", list_success, details)
            
            # Test GET /api/notifications/unread-count
            response = self.session.get(f"{self.base_url}/api/notifications/unread-count")
            count_success = response.status_code == 200
            
            if count_success:
                count_data = response.json()
                unread_count = count_data.get('unread_count', 0)
                details = f"Unread count: {unread_count}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("GET /api/notifications/unread-count", count_success, details)
            
            # Test PATCH /api/notifications/{id}/read (mark one as read)
            mark_read_success = False
            if list_success and notifications:
                notification_id = notifications[0].get('notification_id')
                if notification_id:
                    response = self.session.patch(f"{self.base_url}/api/notifications/{notification_id}/read")
                    mark_read_success = response.status_code == 200
                    
                    if mark_read_success:
                        details = f"Successfully marked notification {notification_id[:12]}... as read"
                    else:
                        details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                else:
                    details = "No notification_id found in first notification"
            else:
                details = "No notifications available to mark as read"
            
            self.log_test("PATCH /api/notifications/{id}/read", mark_read_success, details)
            
            # Test POST /api/notifications/mark-all-read
            response = self.session.post(f"{self.base_url}/api/notifications/mark-all-read")
            mark_all_success = response.status_code == 200
            
            if mark_all_success:
                result = response.json()
                marked_count = result.get('marked_count', 0)
                details = f"Marked {marked_count} notifications as read"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("POST /api/notifications/mark-all-read", mark_all_success, details)
            
            return list_success and count_success and mark_read_success and mark_all_success
            
        except Exception as e:
            self.log_test("Notifications Endpoints", False, str(e))
            return False

    def test_dashboard_stats_with_charts(self):
        """Test dashboard stats endpoint with chart data"""
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/stats")
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                # Verify required chart data fields
                agent_distribution = stats.get('agent_message_distribution', [])
                daily_usage = stats.get('daily_usage', [])
                
                has_agent_distribution = isinstance(agent_distribution, list)
                has_daily_usage = isinstance(daily_usage, list)
                
                if has_agent_distribution and has_daily_usage:
                    details = f"Dashboard stats with charts - agent_distribution: {len(agent_distribution)} items, daily_usage: {len(daily_usage)} items"
                else:
                    success = False
                    details = f"FAILED: Missing chart data - agent_distribution: {type(agent_distribution)}, daily_usage: {type(daily_usage)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Dashboard Stats with Charts", success, details)
            return success
        except Exception as e:
            self.log_test("Dashboard Stats with Charts", False, str(e))
            return False

    def test_agent_stats_with_charts(self, agent_id):
        """Test agent stats endpoint with chart data"""
        if not agent_id:
            self.log_test("Agent Stats with Charts", False, "No agent ID provided")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/api/agents/{agent_id}/stats")
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                # Verify required chart data fields
                message_distribution = stats.get('message_distribution', [])
                daily_activity = stats.get('daily_activity', [])
                
                has_message_distribution = isinstance(message_distribution, list)
                has_daily_activity = isinstance(daily_activity, list)
                
                if has_message_distribution and has_daily_activity:
                    details = f"Agent stats with charts - message_distribution: {len(message_distribution)} items, daily_activity: {len(daily_activity)} items"
                else:
                    success = False
                    details = f"FAILED: Missing chart data - message_distribution: {type(message_distribution)}, daily_activity: {type(daily_activity)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Agent Stats with Charts", success, details)
            return success
        except Exception as e:
            self.log_test("Agent Stats with Charts", False, str(e))
            return False

    def test_business_types_endpoint(self):
        """Test business types endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/business-types")
            success = response.status_code == 200
            
            if success:
                business_types = response.json()
                if isinstance(business_types, list) and len(business_types) > 0:
                    details = f"Found {len(business_types)} business types: {business_types[:3]}..."
                else:
                    success = False
                    details = f"FAILED: Expected non-empty list, got: {type(business_types)} with {len(business_types) if isinstance(business_types, list) else 'N/A'} items"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Business Types Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Business Types Endpoint", False, str(e))
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

    def test_billing_plans(self):
        """Test GET /api/billing/plans"""
        try:
            response = self.session.get(f"{self.base_url}/api/billing/plans")
            success = response.status_code == 200
            
            if success:
                plans = response.json()
                expected_plans = ["free", "pro", "enterprise"]
                plan_ids = [p.get("plan_id") for p in plans]
                has_all_plans = all(plan_id in plan_ids for plan_id in expected_plans)
                success = success and has_all_plans and len(plans) == 3
                details = f"Found {len(plans)} plans: {plan_ids}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Billing Plans", success, details)
            return success, plans if success else []
        except Exception as e:
            self.log_test("Billing Plans", False, str(e))
            return False, []

    def test_billing_initiate_khalti(self):
        """Test POST /api/billing/initiate with Khalti"""
        try:
            data = {
                "plan_id": "pro",
                "payment_method": "khalti"
            }
            response = self.session.post(f"{self.base_url}/api/billing/initiate", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                has_required_fields = all(field in result for field in ["payment_id", "payment_url", "pidx"])
                success = success and has_required_fields
                details = f"Payment ID: {result.get('payment_id', 'N/A')[:12]}..., Has URL: {bool(result.get('payment_url'))}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Billing Initiate Khalti", success, details)
            return success, result if success else {}
        except Exception as e:
            self.log_test("Billing Initiate Khalti", False, str(e))
            return False, {}

    def test_billing_initiate_esewa(self):
        """Test POST /api/billing/initiate with eSewa"""
        try:
            data = {
                "plan_id": "pro",
                "payment_method": "esewa"
            }
            response = self.session.post(f"{self.base_url}/api/billing/initiate", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                has_required_fields = "payment_id" in result and "esewa_form" in result
                success = success and has_required_fields
                details = f"Payment ID: {result.get('payment_id', 'N/A')[:12]}..., Has eSewa form: {bool(result.get('esewa_form'))}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Billing Initiate eSewa", success, details)
            return success, result if success else {}
        except Exception as e:
            self.log_test("Billing Initiate eSewa", False, str(e))
            return False, {}

    def test_billing_verify(self, payment_data):
        """Test POST /api/billing/verify"""
        if not payment_data:
            self.log_test("Billing Verify", False, "No payment data provided")
            return False
            
        try:
            data = {
                "payment_id": payment_data.get("payment_id"),
                "method": "khalti",
                "pidx": payment_data.get("pidx")
            }
            response = self.session.post(f"{self.base_url}/api/billing/verify", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Status: {result.get('status', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Billing Verify", success, details)
            return success
        except Exception as e:
            self.log_test("Billing Verify", False, str(e))
            return False

    def test_billing_history(self):
        """Test GET /api/billing/history"""
        try:
            response = self.session.get(f"{self.base_url}/api/billing/history")
            success = response.status_code == 200
            
            if success:
                history = response.json()
                details = f"Found {len(history)} payment records"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Billing History", success, details)
            return success
        except Exception as e:
            self.log_test("Billing History", False, str(e))
            return False

    def test_create_order(self, agent_id):
        """Test POST /api/orders"""
        if not agent_id:
            self.log_test("Create Order", False, "No agent ID provided")
            return False, None
            
        try:
            data = {
                "agent_id": agent_id,
                "end_user_name": "Test Customer",
                "items": [
                    {"name": "Test Product 1", "quantity": 2, "price": 500},
                    {"name": "Test Product 2", "quantity": 1, "price": 1000}
                ],
                "total_amount": 2000,
                "payment_method": "cod",
                "delivery_address": "Test Address, Kathmandu",
                "notes": "Test order"
            }
            response = self.session.post(f"{self.base_url}/api/orders", json=data)
            success = response.status_code == 200
            
            if success:
                order = response.json()
                details = f"Created order: {order.get('order_id', 'Unknown')}, Status: {order.get('order_status', 'Unknown')}"
                return success, order.get('order_id')
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                return success, None
            
            self.log_test("Create Order", success, details)
        except Exception as e:
            self.log_test("Create Order", False, str(e))
            return False, None

    def test_list_orders(self, agent_id):
        """Test GET /api/orders"""
        try:
            url = f"{self.base_url}/api/orders"
            if agent_id:
                url += f"?agent_id={agent_id}"
            
            response = self.session.get(url)
            success = response.status_code == 200
            
            if success:
                orders = response.json()
                details = f"Found {len(orders)} orders"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("List Orders", success, details)
            return success, orders if success else []
        except Exception as e:
            self.log_test("List Orders", False, str(e))
            return False, []

    def test_update_order_status(self, order_id):
        """Test PATCH /api/orders/{id}/status"""
        if not order_id:
            self.log_test("Update Order Status", False, "No order ID provided")
            return False
            
        try:
            data = {"status": "confirmed"}
            response = self.session.patch(f"{self.base_url}/api/orders/{order_id}/status", json=data)
            success = response.status_code == 200
            
            if success:
                order = response.json()
                details = f"Updated order {order_id[:12]}... to status: {order.get('order_status', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Update Order Status", success, details)
            return success
        except Exception as e:
            self.log_test("Update Order Status", False, str(e))
            return False

    def test_bulk_faq_upload(self, agent_id):
        """Test POST /api/agents/{id}/training/faqs/bulk"""
        if not agent_id:
            self.log_test("Bulk FAQ Upload", False, "No agent ID provided")
            return False
            
        try:
            data = {
                "faqs": [
                    {"question": "What are your business hours?", "answer": "We are open Monday to Friday, 9 AM to 6 PM."},
                    {"question": "Do you deliver?", "answer": "Yes, we deliver across Kathmandu valley."},
                    {"question": "What payment methods do you accept?", "answer": "We accept cash, eSewa, Khalti, and bank transfer."}
                ]
            }
            response = self.session.post(f"{self.base_url}/api/agents/{agent_id}/training/faqs/bulk", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Imported {result.get('imported', 0)} FAQs"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Bulk FAQ Upload", success, details)
            return success
        except Exception as e:
            self.log_test("Bulk FAQ Upload", False, str(e))
            return False

    def test_bulk_product_upload(self, agent_id):
        """Test POST /api/agents/{id}/training/products/bulk"""
        if not agent_id:
            self.log_test("Bulk Product Upload", False, "No agent ID provided")
            return False
            
        try:
            data = {
                "products": [
                    {"name": "Nepali Tea Set", "price": 1500, "stock": 50, "category": "Beverages", "description": "Traditional Nepali tea set with 6 cups", "sku": "TEA-001"},
                    {"name": "Pashmina Shawl", "price": 3500, "stock": 20, "category": "Clothing", "description": "Handwoven pashmina from Nepal", "sku": "PSH-001"}
                ]
            }
            response = self.session.post(f"{self.base_url}/api/agents/{agent_id}/training/products/bulk", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Imported {result.get('imported', 0)} products"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Bulk Product Upload", success, details)
            return success
        except Exception as e:
            self.log_test("Bulk Product Upload", False, str(e))
            return False

    def test_agent_test_chat(self, agent_id):
        """Test POST /api/agents/{id}/test-chat"""
        if not agent_id:
            self.log_test("Agent Test Chat", False, "No agent ID provided")
            return False
            
        try:
            data = {"message": "What are your business hours?"}
            response = self.session.post(f"{self.base_url}/api/agents/{agent_id}/test-chat", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Response: {result.get('response', 'No response')[:50]}..., Source: {result.get('source', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Agent Test Chat", success, details)
            return success
        except Exception as e:
            self.log_test("Agent Test Chat", False, str(e))
            return False

    def test_support_tickets(self):
        """Test support ticket creation and listing"""
        try:
            # Create a support ticket
            create_data = {
                "subject": "Test Support Ticket",
                "message": "This is a test support ticket created by automated testing.",
                "priority": "medium"
            }
            create_response = self.session.post(f"{self.base_url}/api/support/tickets", json=create_data)
            create_success = create_response.status_code == 200
            
            if not create_success:
                self.log_test("Create Support Ticket", False, f"Status: {create_response.status_code}")
                return False
                
            ticket = create_response.json()
            ticket_id = ticket.get('ticket_id')
            self.log_test("Create Support Ticket", True, f"Created ticket: {ticket_id}")
            
            # List support tickets
            list_response = self.session.get(f"{self.base_url}/api/support/tickets")
            list_success = list_response.status_code == 200
            
            if list_success:
                tickets = list_response.json()
                details = f"Found {len(tickets)} tickets"
            else:
                details = f"Status: {list_response.status_code}, Response: {list_response.text[:200]}"
            
            self.log_test("List Support Tickets", list_success, details)
            return create_success and list_success
            
        except Exception as e:
            self.log_test("Support Tickets", False, str(e))
            return False

    def test_profile_update(self):
        """Test PUT /api/auth/profile"""
        try:
            data = {
                "full_name": "Updated Admin Name",
                "mobile": "9812345678",
                "business_name": "Updated Business Name"
            }
            response = self.session.put(f"{self.base_url}/api/auth/profile", json=data)
            success = response.status_code == 200
            
            if success:
                user = response.json()
                details = f"Updated profile: {user.get('full_name', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Profile Update", success, details)
            return success
        except Exception as e:
            self.log_test("Profile Update", False, str(e))
            return False

    def test_change_password(self):
        """Test POST /api/auth/change-password"""
        try:
            data = {
                "current_password": "Admin@123",
                "new_password": "NewAdmin@123"
            }
            response = self.session.post(f"{self.base_url}/api/auth/change-password", json=data)
            success = response.status_code == 200
            
            if success:
                details = "Password changed successfully"
                # Change it back
                revert_data = {
                    "current_password": "NewAdmin@123",
                    "new_password": "Admin@123"
                }
                self.session.post(f"{self.base_url}/api/auth/change-password", json=revert_data)
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Change Password", success, details)
            return success
        except Exception as e:
            self.log_test("Change Password", False, str(e))
            return False

    def test_billing_credits(self):
        """Test GET /api/billing/credits"""
        try:
            response = self.session.get(f"{self.base_url}/api/billing/credits")
            success = response.status_code == 200
            
            if success:
                credits = response.json()
                details = f"Found {len(credits)} credit packs"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Billing Credits", success, details)
            return success, credits if success else []
        except Exception as e:
            self.log_test("Billing Credits", False, str(e))
            return False, []

    def test_buy_credits(self):
        """Test POST /api/billing/buy-credits"""
        try:
            data = {
                "pack_id": "msg_1k",
                "payment_method": "khalti"
            }
            response = self.session.post(f"{self.base_url}/api/billing/buy-credits", json=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Purchase result: {result.get('message', 'Success')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Buy Credits", success, details)
            return success
        except Exception as e:
            self.log_test("Buy Credits", False, str(e))
            return False

    def test_order_refund(self, order_id):
        """Test POST /api/orders/{id}/refund"""
        if not order_id:
            self.log_test("Order Refund", False, "No order ID provided")
            return False
            
        try:
            data = {
                "reason": "Test refund",
                "amount": 1000
            }
            response = self.session.post(f"{self.base_url}/api/orders/{order_id}/refund", json=data)
            success = response.status_code == 200
            
            if success:
                order = response.json()
                details = f"Refunded order {order_id[:12]}..., Status: {order.get('payment_status', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Order Refund", success, details)
            return success
        except Exception as e:
            self.log_test("Order Refund", False, str(e))
            return False

    def test_agent_settings(self, agent_id):
        """Test PUT /api/agents/{id}/settings"""
        if not agent_id:
            self.log_test("Agent Settings", False, "No agent ID provided")
            return False
            
        try:
            data = {
                "greeting_message": "Hello! Welcome to our updated business. How can I help you?",
                "fallback_message": "I'm not sure about that. Let me connect you with our updated team.",
                "response_tone": "friendly",
                "response_language": "english",
                "auto_reply_delay": 2,
                "max_conversation_length": 100,
                "collect_user_info": True,
                "handoff_keywords": ["human", "manager", "speak to someone"]
            }
            response = self.session.put(f"{self.base_url}/api/agents/{agent_id}/settings", json=data)
            success = response.status_code == 200
            
            if success:
                agent = response.json()
                details = f"Updated agent settings: {agent.get('name', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Agent Settings", success, details)
            return success
        except Exception as e:
            self.log_test("Agent Settings", False, str(e))
            return False

    def test_websocket_connection(self):
        """Test WebSocket connection (basic connectivity test)"""
        try:
            import websocket
            import json
            import threading
            import time
            
            # Create a test conversation first
            conv_data = {
                "end_user_name": "WebSocket Test User",
                "channel": "website"
            }
            
            # Get an agent first
            agents_response = self.session.get(f"{self.base_url}/api/agents")
            if agents_response.status_code != 200:
                self.log_test("WebSocket Test", False, "No agents available for WebSocket test")
                return False
                
            agents = agents_response.json()
            if not agents:
                self.log_test("WebSocket Test", False, "No agents found for WebSocket test")
                return False
                
            agent_id = agents[0].get('agent_id')
            
            # Create conversation
            conv_response = self.session.post(f"{self.base_url}/api/agents/{agent_id}/conversations", json=conv_data)
            if conv_response.status_code != 200:
                self.log_test("WebSocket Test", False, "Failed to create test conversation")
                return False
                
            conv = conv_response.json()
            conv_id = conv.get('conv_id')
            
            # Test WebSocket connection
            ws_url = self.base_url.replace("https://", "wss://").replace("http://", "ws://")
            ws_url = f"{ws_url}/ws/chat/{conv_id}"
            
            connected = False
            message_received = False
            
            def on_open(ws):
                nonlocal connected
                connected = True
                # Send a test message
                test_msg = {"content": "WebSocket test message", "sender_type": "agent"}
                ws.send(json.dumps(test_msg))
            
            def on_message(ws, message):
                nonlocal message_received
                message_received = True
                ws.close()
            
            def on_error(ws, error):
                pass
            
            def on_close(ws, close_status_code, close_msg):
                pass
            
            ws = websocket.WebSocketApp(ws_url,
                                      on_open=on_open,
                                      on_message=on_message,
                                      on_error=on_error,
                                      on_close=on_close)
            
            # Run WebSocket in a thread with timeout
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection and message
            time.sleep(3)
            
            success = connected and message_received
            details = f"Connected: {connected}, Message received: {message_received}"
            
            self.log_test("WebSocket Connection", success, details)
            return success
            
        except ImportError:
            self.log_test("WebSocket Test", False, "websocket-client not available")
            return False
        except Exception as e:
            self.log_test("WebSocket Test", False, str(e))
            return False

    def test_custom_billing_minimum_enforcement(self):
        """Test custom billing minimum enforcement"""
        try:
            # Test 1: Should fail with quantity < 100
            data = {"type": "messages", "quantity": 50}
            response = self.session.post(f"{self.base_url}/api/billing/buy-custom", json=data)
            fail_success = response.status_code == 400
            
            if fail_success:
                error_msg = response.json().get("detail", "")
                if "Minimum purchase is 100" in error_msg:
                    details = f"Correctly rejected quantity 50: {error_msg}"
                else:
                    fail_success = False
                    details = f"Wrong error message: {error_msg}"
            else:
                details = f"Should have failed with 400, got {response.status_code}"
            
            self.log_test("Custom Billing - Minimum Enforcement (Fail)", fail_success, details)
            
            # Test 2: Should succeed with quantity >= 100
            data = {"type": "messages", "quantity": 100, "payment_method": "khalti"}
            response = self.session.post(f"{self.base_url}/api/billing/buy-custom", json=data)
            success_success = response.status_code == 200
            
            if success_success:
                result = response.json()
                details = f"Successfully purchased 100 messages: {result.get('message', 'Success')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Custom Billing - Minimum Enforcement (Success)", success_success, details)
            return fail_success and success_success
            
        except Exception as e:
            self.log_test("Custom Billing - Minimum Enforcement", False, str(e))
            return False

    def test_hotel_rooms_crud(self, hotel_agent_id):
        """Test Hotel Rooms CRUD operations"""
        if not hotel_agent_id:
            self.log_test("Hotel Rooms CRUD", False, "No hotel agent ID provided")
            return False, None
            
        try:
            # CREATE room
            room_data = {
                "room_type": "Deluxe",
                "room_number": "101",
                "price_per_night": 5000,
                "capacity": 2,
                "amenities": ["WiFi", "AC"],
                "description": "Test room"
            }
            create_response = self.session.post(f"{self.base_url}/api/agents/{hotel_agent_id}/rooms", json=room_data)
            create_success = create_response.status_code == 200
            
            if not create_success:
                self.log_test("Hotel Rooms - CREATE", False, f"Status: {create_response.status_code}")
                return False, None
                
            room = create_response.json()
            room_id = room.get('room_id')
            self.log_test("Hotel Rooms - CREATE", True, f"Created room {room_id}: {room.get('room_type')} {room.get('room_number')}")
            
            # READ rooms
            read_response = self.session.get(f"{self.base_url}/api/agents/{hotel_agent_id}/rooms")
            read_success = read_response.status_code == 200
            
            if read_success:
                rooms = read_response.json()
                found_room = any(r.get('room_id') == room_id for r in rooms)
                if found_room:
                    details = f"Found {len(rooms)} rooms including created room"
                else:
                    read_success = False
                    details = f"Created room not found in list of {len(rooms)} rooms"
            else:
                details = f"Status: {read_response.status_code}"
            
            self.log_test("Hotel Rooms - READ", read_success, details)
            
            # UPDATE room
            update_data = {
                "room_type": "Deluxe",
                "room_number": "101",
                "price_per_night": 6000,  # Updated price
                "capacity": 2,
                "amenities": ["WiFi", "AC"],
                "description": "Test room"
            }
            update_response = self.session.put(f"{self.base_url}/api/agents/{hotel_agent_id}/rooms/{room_id}", json=update_data)
            update_success = update_response.status_code == 200
            
            if update_success:
                updated_room = update_response.json()
                if updated_room.get('price_per_night') == 6000:
                    details = f"Successfully updated price to {updated_room.get('price_per_night')}"
                else:
                    update_success = False
                    details = f"Price not updated correctly: {updated_room.get('price_per_night')}"
            else:
                details = f"Status: {update_response.status_code}"
            
            self.log_test("Hotel Rooms - UPDATE", update_success, details)
            
            # DELETE room
            delete_response = self.session.delete(f"{self.base_url}/api/agents/{hotel_agent_id}/rooms/{room_id}")
            delete_success = delete_response.status_code == 200
            
            if delete_success:
                details = f"Successfully deleted room {room_id}"
            else:
                details = f"Status: {delete_response.status_code}"
            
            self.log_test("Hotel Rooms - DELETE", delete_success, details)
            
            return create_success and read_success and update_success and delete_success, room_id
            
        except Exception as e:
            self.log_test("Hotel Rooms CRUD", False, str(e))
            return False, None

    def test_hotel_bookings_crud(self, hotel_agent_id):
        """Test Hotel Bookings CRUD operations"""
        if not hotel_agent_id:
            self.log_test("Hotel Bookings CRUD", False, "No hotel agent ID provided")
            return False
            
        try:
            # First create a room for booking
            room_data = {
                "room_type": "Standard",
                "room_number": "102",
                "price_per_night": 4000,
                "capacity": 2,
                "amenities": ["WiFi"],
                "description": "Room for booking test"
            }
            room_response = self.session.post(f"{self.base_url}/api/agents/{hotel_agent_id}/rooms", json=room_data)
            if room_response.status_code != 200:
                self.log_test("Hotel Bookings - Room Creation", False, f"Failed to create room: {room_response.status_code}")
                return False
                
            room = room_response.json()
            room_id = room.get('room_id')
            self.log_test("Hotel Bookings - Room Creation", True, f"Created room {room_id} for booking")
            
            # CREATE booking
            booking_data = {
                "agent_id": hotel_agent_id,
                "room_id": room_id,
                "guest_name": "Test Guest",
                "check_in": "2025-07-01",
                "check_out": "2025-07-03",
                "total_amount": 10000
            }
            create_response = self.session.post(f"{self.base_url}/api/bookings", json=booking_data)
            create_success = create_response.status_code == 200
            
            if not create_success:
                self.log_test("Hotel Bookings - CREATE", False, f"Status: {create_response.status_code}")
                return False
                
            booking = create_response.json()
            booking_id = booking.get('booking_id')
            self.log_test("Hotel Bookings - CREATE", True, f"Created booking {booking_id} for {booking.get('guest_name')}")
            
            # READ bookings
            read_response = self.session.get(f"{self.base_url}/api/bookings?agent_id={hotel_agent_id}")
            read_success = read_response.status_code == 200
            
            if read_success:
                bookings = read_response.json()
                found_booking = any(b.get('booking_id') == booking_id for b in bookings)
                if found_booking:
                    details = f"Found {len(bookings)} bookings including created booking"
                else:
                    read_success = False
                    details = f"Created booking not found in list of {len(bookings)} bookings"
            else:
                details = f"Status: {read_response.status_code}"
            
            self.log_test("Hotel Bookings - READ", read_success, details)
            
            # UPDATE booking status
            status_data = {"status": "confirmed"}
            update_response = self.session.patch(f"{self.base_url}/api/bookings/{booking_id}/status", json=status_data)
            update_success = update_response.status_code == 200
            
            if update_success:
                updated_booking = update_response.json()
                if updated_booking.get('booking_status') == 'confirmed':
                    details = f"Successfully updated status to {updated_booking.get('booking_status')}"
                else:
                    update_success = False
                    details = f"Status not updated correctly: {updated_booking.get('booking_status')}"
            else:
                details = f"Status: {update_response.status_code}"
            
            self.log_test("Hotel Bookings - UPDATE Status", update_success, details)
            
            return create_success and read_success and update_success
            
        except Exception as e:
            self.log_test("Hotel Bookings CRUD", False, str(e))
            return False

    def test_support_file_upload(self):
        """Test support file upload"""
        try:
            # Test file upload with base64 data
            file_data = {
                "file_name": "test.txt",
                "file_type": "text/plain",
                "file_size": 100,
                "file_data": "dGVzdA=="  # base64 for "test"
            }
            response = self.session.post(f"{self.base_url}/api/support/upload", json=file_data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                file_id = result.get('file_id')
                details = f"Uploaded file {file_id}: {result.get('file_name')} ({result.get('file_size')} bytes)"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Support File Upload", success, details)
            return success
            
        except Exception as e:
            self.log_test("Support File Upload", False, str(e))
            return False

    def test_support_ticket_unread_count(self):
        """Test support ticket unread count"""
        try:
            response = self.session.get(f"{self.base_url}/api/support/tickets/unread-count")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                count = result.get('count', 0)
                details = f"Unread ticket count: {count}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Support Ticket Unread Count", success, details)
            return success
            
        except Exception as e:
            self.log_test("Support Ticket Unread Count", False, str(e))
            return False

    def test_refund_flow(self):
        """Test complete refund flow as specified in review request"""
        try:
            print("\n🔄 Starting Refund Flow Test...")
            
            # Step 1: Get agents and find E-commerce agent
            print("Step 1: Getting agents...")
            agents_response = self.session.get(f"{self.base_url}/api/agents")
            if agents_response.status_code != 200:
                self.log_test("Refund Flow - Get Agents", False, f"Failed to get agents: {agents_response.status_code}")
                return False
            
            agents = agents_response.json()
            ecommerce_agent_id = None
            
            for agent in agents:
                if agent.get('business_type') == 'E-commerce':
                    ecommerce_agent_id = agent.get('agent_id')
                    break
            
            if not ecommerce_agent_id:
                self.log_test("Refund Flow - Find E-commerce Agent", False, "No E-commerce agent found")
                return False
            
            self.log_test("Refund Flow - Find E-commerce Agent", True, f"Found E-commerce agent: {ecommerce_agent_id[:12]}...")
            
            # Step 2: Create an order for this agent
            print("Step 2: Creating order...")
            order_data = {
                "agent_id": ecommerce_agent_id,
                "end_user_name": "Refund Test Customer",
                "items": [{"name": "Test Product", "quantity": 1, "price": 5000}],
                "total_amount": 5000,
                "payment_method": "khalti"
            }
            
            create_response = self.session.post(f"{self.base_url}/api/orders", json=order_data)
            if create_response.status_code != 200:
                self.log_test("Refund Flow - Create Order", False, f"Failed to create order: {create_response.status_code}")
                return False
            
            order = create_response.json()
            order_id = order.get('order_id')
            initial_payment_status = order.get('payment_status', 'unknown')
            self.log_test("Refund Flow - Create Order", True, f"Created order: {order_id}, Initial payment_status: {initial_payment_status}")
            
            # Step 3: Update order to confirmed status
            print("Step 3: Updating order to confirmed...")
            status_data = {"status": "confirmed"}
            status_response = self.session.patch(f"{self.base_url}/api/orders/{order_id}/status", json=status_data)
            if status_response.status_code != 200:
                self.log_test("Refund Flow - Update Order Status", False, f"Failed to update order status: {status_response.status_code}")
                return False
            
            updated_order = status_response.json()
            payment_status_after_confirm = updated_order.get('payment_status', 'unknown')
            self.log_test("Refund Flow - Update Order Status", True, f"Order status: {updated_order.get('order_status')}, Payment status: {payment_status_after_confirm}")
            
            # Verify payment status is now 'paid'
            if payment_status_after_confirm != 'paid':
                self.log_test("Refund Flow - Payment Status Verification", False, f"Expected payment_status 'paid', got '{payment_status_after_confirm}'")
                return False
            else:
                self.log_test("Refund Flow - Payment Status Verification", True, "Payment status correctly set to 'paid' after confirming order")
            
            # Step 4: Process refund
            print("Step 4: Processing refund...")
            refund_data = {
                "reason": "Customer request",
                "amount": 5000
            }
            
            refund_response = self.session.post(f"{self.base_url}/api/orders/{order_id}/refund", json=refund_data)
            if refund_response.status_code != 200:
                self.log_test("Refund Flow - Process Refund", False, f"Failed to process refund: {refund_response.status_code}, Response: {refund_response.text[:200]}")
                return False
            
            refunded_order = refund_response.json()
            refund_id = refunded_order.get('refund_id')
            refund_amount = refunded_order.get('refund_amount')
            final_payment_status = refunded_order.get('payment_status')
            final_order_status = refunded_order.get('order_status')
            
            self.log_test("Refund Flow - Process Refund", True, f"Refund processed: {refund_id}, Amount: {refund_amount}, Payment status: {final_payment_status}, Order status: {final_order_status}")
            
            # Step 5: List refunds
            print("Step 5: Listing refunds...")
            refunds_response = self.session.get(f"{self.base_url}/api/refunds?agent_id={ecommerce_agent_id}")
            if refunds_response.status_code != 200:
                self.log_test("Refund Flow - List Refunds", False, f"Failed to list refunds: {refunds_response.status_code}")
                return False
            
            refunds = refunds_response.json()
            found_refund = any(r.get('order_id') == order_id for r in refunds)
            
            if found_refund:
                self.log_test("Refund Flow - List Refunds", True, f"Found {len(refunds)} refunds including our test refund")
            else:
                self.log_test("Refund Flow - List Refunds", False, f"Test refund not found in {len(refunds)} refunds")
                return False
            
            # Step 6: Check notifications
            print("Step 6: Checking notifications...")
            notifications_response = self.session.get(f"{self.base_url}/api/notifications")
            if notifications_response.status_code != 200:
                self.log_test("Refund Flow - Check Notifications", False, f"Failed to get notifications: {notifications_response.status_code}")
                return False
            
            notifications = notifications_response.json()
            refund_notification = None
            
            for notification in notifications:
                if notification.get('type') == 'order_refunded' and order_id in notification.get('message', ''):
                    refund_notification = notification
                    break
            
            if refund_notification:
                notification_title = refund_notification.get('title')
                notification_message = refund_notification.get('message')
                self.log_test("Refund Flow - Check Notifications", True, f"Found refund notification: '{notification_title}' - {notification_message}")
            else:
                self.log_test("Refund Flow - Check Notifications", False, "Refund notification not found")
                return False
            
            print("✅ Refund flow test completed successfully!")
            return True
            
        except Exception as e:
            self.log_test("Refund Flow", False, str(e))
            return False

    def test_refund_edge_cases(self):
        """Test refund edge cases and error conditions"""
        try:
            print("\n🔍 Testing Refund Edge Cases...")
            
            # Get E-commerce agent
            agents_response = self.session.get(f"{self.base_url}/api/agents")
            if agents_response.status_code != 200:
                self.log_test("Refund Edge Cases - Get Agents", False, "Failed to get agents")
                return False
            
            agents = agents_response.json()
            ecommerce_agent_id = None
            for agent in agents:
                if agent.get('business_type') == 'E-commerce':
                    ecommerce_agent_id = agent.get('agent_id')
                    break
            
            if not ecommerce_agent_id:
                self.log_test("Refund Edge Cases - Find E-commerce Agent", False, "No E-commerce agent found")
                return False
            
            # Test 1: Try to refund non-existent order
            fake_order_id = "ORD-NONEXISTENT"
            refund_data = {"reason": "Test", "amount": 1000}
            response = self.session.post(f"{self.base_url}/api/orders/{fake_order_id}/refund", json=refund_data)
            
            if response.status_code == 404:
                self.log_test("Refund Edge Cases - Non-existent Order", True, "Correctly rejected refund for non-existent order")
            else:
                self.log_test("Refund Edge Cases - Non-existent Order", False, f"Expected 404, got {response.status_code}")
            
            # Test 2: Try to refund unpaid order
            # Create an order but don't confirm it (so it stays unpaid)
            order_data = {
                "agent_id": ecommerce_agent_id,
                "end_user_name": "Unpaid Test Customer",
                "items": [{"name": "Test Product", "quantity": 1, "price": 1000}],
                "total_amount": 1000,
                "payment_method": "cod"
            }
            
            create_response = self.session.post(f"{self.base_url}/api/orders", json=order_data)
            if create_response.status_code == 200:
                unpaid_order = create_response.json()
                unpaid_order_id = unpaid_order.get('order_id')
                
                # Try to refund the unpaid order
                refund_response = self.session.post(f"{self.base_url}/api/orders/{unpaid_order_id}/refund", json=refund_data)
                
                if refund_response.status_code == 400:
                    error_detail = refund_response.json().get('detail', '')
                    if "Only paid orders can be refunded" in error_detail:
                        self.log_test("Refund Edge Cases - Unpaid Order", True, "Correctly rejected refund for unpaid order")
                    else:
                        self.log_test("Refund Edge Cases - Unpaid Order", False, f"Wrong error message: {error_detail}")
                else:
                    self.log_test("Refund Edge Cases - Unpaid Order", False, f"Expected 400, got {refund_response.status_code}")
            else:
                self.log_test("Refund Edge Cases - Create Unpaid Order", False, "Failed to create test order")
            
            # Test 3: Test partial refund
            # Create and confirm an order for partial refund test
            order_data = {
                "agent_id": ecommerce_agent_id,
                "end_user_name": "Partial Refund Customer",
                "items": [{"name": "Expensive Product", "quantity": 1, "price": 10000}],
                "total_amount": 10000,
                "payment_method": "khalti"
            }
            
            create_response = self.session.post(f"{self.base_url}/api/orders", json=order_data)
            if create_response.status_code == 200:
                order = create_response.json()
                order_id = order.get('order_id')
                
                # Confirm the order
                status_response = self.session.patch(f"{self.base_url}/api/orders/{order_id}/status", json={"status": "confirmed"})
                
                if status_response.status_code == 200:
                    # Process partial refund (half the amount)
                    partial_refund_data = {"reason": "Partial refund test", "amount": 5000}
                    refund_response = self.session.post(f"{self.base_url}/api/orders/{order_id}/refund", json=partial_refund_data)
                    
                    if refund_response.status_code == 200:
                        refunded_order = refund_response.json()
                        refund_amount = refunded_order.get('refund_amount')
                        if refund_amount == 5000:
                            self.log_test("Refund Edge Cases - Partial Refund", True, f"Partial refund processed correctly: NPR {refund_amount}")
                        else:
                            self.log_test("Refund Edge Cases - Partial Refund", False, f"Expected refund amount 5000, got {refund_amount}")
                    else:
                        self.log_test("Refund Edge Cases - Partial Refund", False, f"Partial refund failed: {refund_response.status_code}")
                else:
                    self.log_test("Refund Edge Cases - Confirm Order for Partial", False, "Failed to confirm order for partial refund test")
            else:
                self.log_test("Refund Edge Cases - Create Order for Partial", False, "Failed to create order for partial refund test")
            
            return True
            
        except Exception as e:
            self.log_test("Refund Edge Cases", False, str(e))
            return False

    def run_phase1_tests(self):
        """Run Phase 1 specific backend tests"""
        print("🚀 Starting Nurekha Phase 1 Backend API Tests")
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
        
        print("\n🔐 Testing Phase 1 Auth Features...")
        # Test 1: Auth register without business_types
        self.test_auth_register_without_business_types()
        
        print("\n🤖 Testing Phase 1 Agent Features...")
        # Test 2: Agent creation with business_type
        agent_success, agent_id = self.test_agent_creation_with_business_type()
        
        if agent_id:
            # Test 3: Agent rename
            self.test_agent_rename(agent_id)
            
            # Test 4: Agent deactivate
            self.test_agent_deactivate(agent_id)
            
            # Test 7: Agent stats with charts
            self.test_agent_stats_with_charts(agent_id)
        else:
            print("⚠️  Skipping agent-specific tests - no agent created")
        
        print("\n🔔 Testing Phase 1 Notification Features...")
        # Test 5: Notifications endpoints
        self.test_notifications_endpoints()
        
        print("\n📊 Testing Phase 1 Dashboard Features...")
        # Test 6: Dashboard stats with charts
        self.test_dashboard_stats_with_charts()
        
        print("\n🏢 Testing Phase 1 Business Types...")
        # Test 8: Business types endpoint
        self.test_business_types_endpoint()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Phase 1 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Phase 1 tests passed!")
            return True
        else:
            print("⚠️  Some Phase 1 tests failed. Check the details above.")
            return False

    def run_phase2_tests(self):
        """Run Phase 2 specific backend tests"""
        print("🚀 Starting Nurekha Phase 2 Backend API Tests")
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
        
        # Get list of agents to find Hotel agent
        print("\n🔍 Finding Hotel Agent...")
        agents_success, agents = self.test_list_agents()
        hotel_agent_id = None
        
        if agents_success and agents:
            for agent in agents:
                if agent.get('business_type') == 'Hotel':
                    hotel_agent_id = agent.get('agent_id')
                    print(f"✅ Found Hotel agent: {agent.get('name')} (ID: {hotel_agent_id[:12]}...)")
                    break
        
        if not hotel_agent_id:
            print("⚠️  No Hotel agent found. Creating one for testing...")
            # Create a Hotel agent for testing
            hotel_data = {"name": "Test Hotel Bot", "business_type": "Hotel"}
            create_response = self.session.post(f"{self.base_url}/api/agents", json=hotel_data)
            if create_response.status_code in [200, 201]:
                hotel_agent = create_response.json()
                hotel_agent_id = hotel_agent.get('agent_id')
                print(f"✅ Created Hotel agent: {hotel_agent.get('name')} (ID: {hotel_agent_id[:12]}...)")
            else:
                print("❌ Failed to create Hotel agent. Some tests will be skipped.")
        
        print("\n💳 Testing Phase 2 Billing Features...")
        # Test 1: Custom billing minimum enforcement
        self.test_custom_billing_minimum_enforcement()
        
        if hotel_agent_id:
            print("\n🏨 Testing Phase 2 Hotel Features...")
            # Test 2: Hotel rooms CRUD
            rooms_success, room_id = self.test_hotel_rooms_crud(hotel_agent_id)
            
            # Test 3: Hotel bookings CRUD
            self.test_hotel_bookings_crud(hotel_agent_id)
        else:
            print("⚠️  Skipping Hotel tests - no Hotel agent available")
        
        print("\n🎫 Testing Phase 2 Support Features...")
        # Test 4: Support file upload
        self.test_support_file_upload()
        
        # Test 5: Support ticket unread count
        self.test_support_ticket_unread_count()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Phase 2 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Phase 2 tests passed!")
            return True
        else:
            print("⚠️  Some Phase 2 tests failed. Check the details above.")
            return False

    def test_dynamic_business_data_system(self):
        """Test the new dynamic business data system"""
        print("\n🔄 Starting Dynamic Business Data System Tests...")
        
        # Step 1: Test business types endpoint
        print("Step 1: Testing business types endpoint...")
        response = self.session.get(f"{self.base_url}/api/business-types")
        if response.status_code != 200:
            self.log_test("Business Types - GET /api/business-types", False, f"Status: {response.status_code}")
            return False
        
        business_types = response.json()
        if len(business_types) != 13:
            self.log_test("Business Types - Count Check", False, f"Expected 13 types, got {len(business_types)}")
            return False
        
        self.log_test("Business Types - GET /api/business-types", True, f"Found {len(business_types)} business types")
        
        # Step 2: Test ISP schema endpoint
        print("Step 2: Testing ISP schema endpoint...")
        response = self.session.get(f"{self.base_url}/api/business-types/isp/schema")
        if response.status_code != 200:
            self.log_test("Business Types - ISP Schema", False, f"Status: {response.status_code}")
            return False
        
        isp_schema = response.json()
        expected_fields = ["plan_name", "speed", "price", "currency", "data_limit", "installation_fee", "coverage_area", "availability"]
        schema_fields = [field["key"] for field in isp_schema.get("fields", [])]
        
        if not all(field in schema_fields for field in expected_fields):
            self.log_test("Business Types - ISP Schema Fields", False, f"Missing fields. Expected: {expected_fields}, Got: {schema_fields}")
            return False
        
        self.log_test("Business Types - ISP Schema", True, f"Schema has {len(schema_fields)} fields")
        
        # Step 3: Find ISP agent
        print("Step 3: Finding ISP agent...")
        agents_response = self.session.get(f"{self.base_url}/api/agents")
        if agents_response.status_code != 200:
            self.log_test("Dynamic Business Data - Get Agents", False, f"Status: {agents_response.status_code}")
            return False
        
        agents = agents_response.json()
        isp_agent_id = None
        
        for agent in agents:
            if agent.get('business_type') == 'isp':
                isp_agent_id = agent.get('agent_id')
                break
        
        if not isp_agent_id:
            # Create ISP agent if not found
            print("Creating ISP agent...")
            agent_data = {"name": "Test ISP Agent", "business_type": "isp"}
            create_response = self.session.post(f"{self.base_url}/api/agents", json=agent_data)
            if create_response.status_code in [200, 201]:
                isp_agent_id = create_response.json().get('agent_id')
                self.log_test("Dynamic Business Data - Create ISP Agent", True, f"Created ISP agent: {isp_agent_id}")
            else:
                self.log_test("Dynamic Business Data - Create ISP Agent", False, f"Status: {create_response.status_code}")
                return False
        else:
            self.log_test("Dynamic Business Data - Find ISP Agent", True, f"Found ISP agent: {isp_agent_id}")
        
        # Step 4: Test Generic CRUD operations
        print("Step 4: Testing Generic CRUD operations...")
        
        # CREATE business data
        business_data = {
            "plan_name": "Basic 10Mbps",
            "speed": "10 Mbps",
            "price": 999,
            "currency": "NPR",
            "data_limit": "Unlimited",
            "installation_fee": 500,
            "coverage_area": "Kathmandu",
            "availability": "available"
        }
        
        create_response = self.session.post(f"{self.base_url}/api/agents/{isp_agent_id}/business-data", json=business_data)
        if create_response.status_code != 200:
            self.log_test("Business Data CRUD - CREATE", False, f"Status: {create_response.status_code}, Response: {create_response.text[:200]}")
            return False
        
        created_item = create_response.json()
        item_id = created_item.get('item_id')
        self.log_test("Business Data CRUD - CREATE", True, f"Created item: {item_id}")
        
        # READ business data
        read_response = self.session.get(f"{self.base_url}/api/agents/{isp_agent_id}/business-data")
        if read_response.status_code != 200:
            self.log_test("Business Data CRUD - READ", False, f"Status: {read_response.status_code}")
            return False
        
        items = read_response.json()
        found_item = any(item.get('item_id') == item_id for item in items)
        if not found_item:
            self.log_test("Business Data CRUD - READ", False, f"Created item not found in {len(items)} items")
            return False
        
        self.log_test("Business Data CRUD - READ", True, f"Found {len(items)} items including created item")
        
        # UPDATE business data
        update_data = {**business_data, "price": 1299}
        update_response = self.session.put(f"{self.base_url}/api/agents/{isp_agent_id}/business-data/{item_id}", json=update_data)
        if update_response.status_code != 200:
            self.log_test("Business Data CRUD - UPDATE", False, f"Status: {update_response.status_code}")
            return False
        
        updated_item = update_response.json()
        if updated_item.get('price') != 1299:
            self.log_test("Business Data CRUD - UPDATE", False, f"Price not updated correctly: {updated_item.get('price')}")
            return False
        
        self.log_test("Business Data CRUD - UPDATE", True, f"Updated price to {updated_item.get('price')}")
        
        # Step 5: Test Bulk Upload
        print("Step 5: Testing Bulk Upload...")
        bulk_data = {
            "items": [
                {"plan_name": "Pro 50Mbps", "speed": "50 Mbps", "price": 2499},
                {"plan_name": "Ultra 100Mbps", "speed": "100 Mbps", "price": 4999}
            ]
        }
        
        bulk_response = self.session.post(f"{self.base_url}/api/agents/{isp_agent_id}/business-data/bulk", json=bulk_data)
        if bulk_response.status_code != 200:
            self.log_test("Business Data - Bulk Upload", False, f"Status: {bulk_response.status_code}, Response: {bulk_response.text[:200]}")
            return False
        
        bulk_result = bulk_response.json()
        imported_count = bulk_result.get('count', 0)  # Changed from 'imported' to 'count'
        if imported_count != 2:
            self.log_test("Business Data - Bulk Upload", False, f"Expected 2 items imported, got {imported_count}")
            return False
        
        self.log_test("Business Data - Bulk Upload", True, f"Imported {imported_count} items")
        
        # Step 6: Test CSV Template
        print("Step 6: Testing CSV Template...")
        csv_response = self.session.get(f"{self.base_url}/api/agents/{isp_agent_id}/business-data/csv-template")
        if csv_response.status_code != 200:
            self.log_test("Business Data - CSV Template", False, f"Status: {csv_response.status_code}")
            return False
        
        csv_content = csv_response.text
        expected_headers = ["plan_name", "speed", "price", "currency", "data_limit", "installation_fee", "coverage_area", "availability"]
        if not all(header in csv_content for header in expected_headers):
            self.log_test("Business Data - CSV Template", False, f"Missing headers in CSV template")
            return False
        
        self.log_test("Business Data - CSV Template", True, f"CSV template contains expected headers")
        
        # Step 7: Test Leads (find agent with lead action type)
        print("Step 7: Testing Leads...")
        
        # Find or create real estate agent for leads
        real_estate_agent_id = None
        for agent in agents:
            if agent.get('business_type') == 'real_estate':
                real_estate_agent_id = agent.get('agent_id')
                break
        
        if not real_estate_agent_id:
            # Create real estate agent
            agent_data = {"name": "Test Real Estate Agent", "business_type": "real_estate"}
            create_response = self.session.post(f"{self.base_url}/api/agents", json=agent_data)
            if create_response.status_code in [200, 201]:
                real_estate_agent_id = create_response.json().get('agent_id')
                self.log_test("Leads - Create Real Estate Agent", True, f"Created agent: {real_estate_agent_id}")
            else:
                self.log_test("Leads - Create Real Estate Agent", False, f"Status: {create_response.status_code}")
                return False
        
        # CREATE lead
        lead_data = {
            "customer_name": "Test Lead",
            "phone": "9812345678",
            "email": "test@test.com",
            "details": "Looking for property"
        }
        
        lead_response = self.session.post(f"{self.base_url}/api/agents/{real_estate_agent_id}/leads", json=lead_data)
        if lead_response.status_code != 200:
            self.log_test("Leads - CREATE", False, f"Status: {lead_response.status_code}, Response: {lead_response.text[:200]}")
            return False
        
        created_lead = lead_response.json()
        lead_id = created_lead.get('lead_id')
        self.log_test("Leads - CREATE", True, f"Created lead: {lead_id}")
        
        # READ leads
        leads_response = self.session.get(f"{self.base_url}/api/agents/{real_estate_agent_id}/leads")
        if leads_response.status_code != 200:
            self.log_test("Leads - READ", False, f"Status: {leads_response.status_code}")
            return False
        
        leads = leads_response.json()
        found_lead = any(lead.get('lead_id') == lead_id for lead in leads)
        if not found_lead:
            self.log_test("Leads - READ", False, f"Created lead not found in {len(leads)} leads")
            return False
        
        self.log_test("Leads - READ", True, f"Found {len(leads)} leads including created lead")
        
        # UPDATE lead status
        status_data = {"status": "contacted"}
        status_response = self.session.patch(f"{self.base_url}/api/agents/{real_estate_agent_id}/leads/{lead_id}/status", json=status_data)
        if status_response.status_code != 200:
            self.log_test("Leads - UPDATE Status", False, f"Status: {status_response.status_code}")
            return False
        
        updated_lead = status_response.json()
        if updated_lead.get('status') != 'contacted':
            self.log_test("Leads - UPDATE Status", False, f"Status not updated correctly: {updated_lead.get('status')}")
            return False
        
        self.log_test("Leads - UPDATE Status", True, f"Updated status to {updated_lead.get('status')}")
        
        # Step 8: Test Customer Tickets
        print("Step 8: Testing Customer Tickets...")
        
        # CREATE customer ticket
        ticket_data = {
            "customer_name": "John",
            "phone": "9876543210",
            "issue": "Internet not working",
            "category": "technical",
            "priority": "high"
        }
        
        ticket_response = self.session.post(f"{self.base_url}/api/agents/{isp_agent_id}/customer-tickets", json=ticket_data)
        if ticket_response.status_code != 200:
            self.log_test("Customer Tickets - CREATE", False, f"Status: {ticket_response.status_code}, Response: {ticket_response.text[:200]}")
            return False
        
        created_ticket = ticket_response.json()
        ticket_id = created_ticket.get('ticket_id')
        self.log_test("Customer Tickets - CREATE", True, f"Created ticket: {ticket_id}")
        
        # READ customer tickets
        tickets_response = self.session.get(f"{self.base_url}/api/agents/{isp_agent_id}/customer-tickets")
        if tickets_response.status_code != 200:
            self.log_test("Customer Tickets - READ", False, f"Status: {tickets_response.status_code}")
            return False
        
        tickets = tickets_response.json()
        found_ticket = any(ticket.get('ticket_id') == ticket_id for ticket in tickets)
        if not found_ticket:
            self.log_test("Customer Tickets - READ", False, f"Created ticket not found in {len(tickets)} tickets")
            return False
        
        self.log_test("Customer Tickets - READ", True, f"Found {len(tickets)} tickets including created ticket")
        
        # UPDATE ticket status
        ticket_status_data = {"status": "in_progress"}
        ticket_status_response = self.session.patch(f"{self.base_url}/api/agents/{isp_agent_id}/customer-tickets/{ticket_id}/status", json=ticket_status_data)
        if ticket_status_response.status_code != 200:
            self.log_test("Customer Tickets - UPDATE Status", False, f"Status: {ticket_status_response.status_code}")
            return False
        
        updated_ticket = ticket_status_response.json()
        if updated_ticket.get('status') != 'in_progress':
            self.log_test("Customer Tickets - UPDATE Status", False, f"Status not updated correctly: {updated_ticket.get('status')}")
            return False
        
        self.log_test("Customer Tickets - UPDATE Status", True, f"Updated status to {updated_ticket.get('status')}")
        
        # DELETE business data item (cleanup)
        delete_response = self.session.delete(f"{self.base_url}/api/agents/{isp_agent_id}/business-data/{item_id}")
        if delete_response.status_code != 200:
            self.log_test("Business Data CRUD - DELETE", False, f"Status: {delete_response.status_code}")
            return False
        
        self.log_test("Business Data CRUD - DELETE", True, f"Deleted item: {item_id}")
        
        print("✅ Dynamic Business Data System tests completed successfully!")
        return True

    def run_refund_tests(self):
        """Run Refund specific backend tests"""
        print("🚀 Starting Nurekha Refund Backend API Tests")
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
        
        print("\n💰 Testing Refund Flow...")
        # Test complete refund flow
        self.test_refund_flow()
        
        print("\n🔍 Testing Refund Edge Cases...")
        # Test refund edge cases
        self.test_refund_edge_cases()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Refund Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Refund tests passed!")
            return True
        else:
            print("⚠️  Some Refund tests failed. Check the details above.")
            return False

    def run_dynamic_business_data_tests(self):
        """Run dynamic business data system tests"""
        print("🚀 Starting Nurekha Dynamic Business Data API Testing...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Health check first
        if not self.test_health_check():
            print("❌ Health check failed. Stopping tests.")
            return False
        
        # Test admin login
        login_success, user_data = self.test_admin_login()
        if not login_success:
            print("❌ Admin login failed. Cannot proceed with authenticated tests.")
            return False
        
        # Test dynamic business data system
        self.test_dynamic_business_data_system()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Dynamic Business Data Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Dynamic Business Data tests passed!")
            return True
        else:
            print("⚠️  Some Dynamic Business Data tests failed. Check the details above.")
            return False

def main():
    tester = NurekhaAPITester()
    success = tester.run_dynamic_business_data_tests()
    
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