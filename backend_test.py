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
        test_agent_id = None
        if agents_success:
            if existing_agents:
                test_agent_id = existing_agents[0].get('agent_id')
            else:
                create_success, agent_id = self.test_create_agent()
                if create_success and agent_id:
                    test_agent_id = agent_id
        
        # Test new training features
        print("\n🎓 Testing Training Features...")
        if test_agent_id:
            self.test_bulk_faq_upload(test_agent_id)
            self.test_bulk_product_upload(test_agent_id)
            self.test_agent_test_chat(test_agent_id)
            self.test_agent_settings(test_agent_id)
        else:
            print("⚠️  Skipping training tests - no agent available")
        
        # Test support features
        print("\n🎫 Testing Support Features...")
        self.test_support_tickets()
        
        # Test profile management
        print("\n👤 Testing Profile Features...")
        self.test_profile_update()
        self.test_change_password()
        
        # Test billing endpoints
        print("\n📊 Testing Billing Features...")
        billing_plans_success, plans = self.test_billing_plans()
        billing_credits_success, credits = self.test_billing_credits()
        
        if billing_credits_success:
            self.test_buy_credits()
        
        if billing_plans_success:
            # Test payment initiation
            khalti_success, khalti_data = self.test_billing_initiate_khalti()
            esewa_success, esewa_data = self.test_billing_initiate_esewa()
            
            # Test payment verification (with khalti data if available)
            if khalti_success and khalti_data:
                self.test_billing_verify(khalti_data)
        
        # Test payment history
        self.test_billing_history()
        
        # Test orders endpoints
        print("\n📦 Testing Orders Features...")
        if test_agent_id:
            # Test order creation
            order_success, order_id = self.test_create_order(test_agent_id)
            
            # Test order listing
            self.test_list_orders(test_agent_id)
            
            # Test order status update and refund
            if order_success and order_id:
                self.test_update_order_status(order_id)
                # First update to confirmed (paid) status, then test refund
                confirm_data = {"status": "confirmed"}
                self.session.patch(f"{self.base_url}/api/orders/{order_id}/status", json=confirm_data)
                self.test_order_refund(order_id)
        else:
            print("⚠️  Skipping order tests - no agent available")
        
        # Test WebSocket functionality
        print("\n🔌 Testing WebSocket Features...")
        self.test_websocket_connection()
        
        # Test other auth endpoints
        self.test_forgot_password()
        
        # Test user registration (this will create a new session)
        self.test_register_user()
        
        # Clean up test agent if created
        if test_agent_id and not existing_agents:
            self.test_delete_agent(test_agent_id)
        
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