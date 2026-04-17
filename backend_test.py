#!/usr/bin/env python3
"""
Phase 7 Backend Validation Testing
Tests the item validation system for collection items
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://agent-vault-7.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@nurekha.com"
ADMIN_PASSWORD = "Admin@123"

class Phase7ValidationTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.agent_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def authenticate(self) -> bool:
        """Authenticate as admin user"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Admin Authentication", True, f"Logged in as {ADMIN_EMAIL}")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False
    
    def get_hotel_agent(self) -> bool:
        """Get the existing hotel agent"""
        try:
            response = self.session.get(f"{BASE_URL}/agents")
            
            if response.status_code == 200:
                agents = response.json()
                hotel_agent = None
                
                for agent in agents:
                    if agent.get("business_type") == "hotel":
                        hotel_agent = agent
                        break
                
                if hotel_agent:
                    self.agent_id = hotel_agent["agent_id"]
                    self.log_test("Get Hotel Agent", True, f"Found hotel agent: {self.agent_id}")
                    return True
                else:
                    self.log_test("Get Hotel Agent", False, "No hotel agent found")
                    return False
            else:
                self.log_test("Get Hotel Agent", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Hotel Agent", False, f"Exception: {str(e)}")
            return False
    
    def cleanup_existing_test_schema(self) -> bool:
        """Clean up any existing test schema"""
        try:
            response = self.session.delete(f"{BASE_URL}/agents/{self.agent_id}/schemas/phase7_test")
            # Don't care about the result - it might not exist
            return True
        except:
            return True
    
    def create_test_schema(self) -> bool:
        """Create temporary test schema"""
        try:
            # First cleanup any existing test schema
            self.cleanup_existing_test_schema()
            
            # Check current schemas to see if we need to delete one first
            response = self.session.get(f"{BASE_URL}/agents/{self.agent_id}/schemas")
            if response.status_code == 200:
                schemas = response.json()
                custom_schemas = [s for s in schemas if not s.get("is_default", False)]
                
                # If we have 2 custom schemas, delete one to make room
                if len(custom_schemas) >= 2:
                    schema_to_delete = custom_schemas[0]["collection_name"]
                    delete_response = self.session.delete(f"{BASE_URL}/agents/{self.agent_id}/schemas/{schema_to_delete}")
                    if delete_response.status_code == 200:
                        self.log_test("Cleanup Existing Schema", True, f"Deleted {schema_to_delete} to make room")
                    else:
                        self.log_test("Cleanup Existing Schema", False, f"Failed to delete {schema_to_delete}")
            
            # Create the test schema
            test_schema = {
                "collection_name": "phase7_test",
                "display_name": "Phase 7 Test",
                "fields": [
                    {
                        "field_name": "sku",
                        "field_type": "text",
                        "required": True,
                        "unique": True,
                        "validation": {"min_length": 3, "max_length": 10}
                    },
                    {
                        "field_name": "price",
                        "field_type": "number",
                        "required": True,
                        "validation": {"min": 0, "max": 10000}
                    },
                    {
                        "field_name": "name",
                        "field_type": "text",
                        "required": False,
                        "unique": False,
                        "validation": {}
                    },
                    {
                        "field_name": "photos",
                        "field_type": "image",
                        "required": False,
                        "unique": False,
                        "validation": {"max_count": 3}
                    }
                ]
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/schemas", json=test_schema)
            
            if response.status_code == 200:
                self.log_test("Create Test Schema", True, "Created phase7_test schema")
                return True
            else:
                self.log_test("Create Test Schema", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Test Schema", False, f"Exception: {str(e)}")
            return False
    
    def test_valid_create(self) -> bool:
        """Test 1: Valid create"""
        try:
            data = {
                "data": {
                    "sku": "ABC123",
                    "price": 100,
                    "name": "Widget"
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 200:
                self.log_test("Valid Create", True, "Successfully created item with valid data")
                return True
            else:
                self.log_test("Valid Create", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Valid Create", False, f"Exception: {str(e)}")
            return False
    
    def test_required_missing(self) -> bool:
        """Test 2: Required field missing"""
        try:
            data = {
                "data": {
                    "price": 100
                    # Missing required 'sku' field
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "required" in response.text.lower():
                self.log_test("Required Missing", True, f"Correctly rejected missing required field: {response.text}")
                return True
            else:
                self.log_test("Required Missing", False, f"Expected 400 with 'required' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Required Missing", False, f"Exception: {str(e)}")
            return False
    
    def test_unique_violation(self) -> bool:
        """Test 3: Unique violation"""
        try:
            data = {
                "data": {
                    "sku": "ABC123",  # Same as test 1
                    "price": 200
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "unique" in response.text.lower():
                self.log_test("Unique Violation", True, f"Correctly rejected duplicate unique field: {response.text}")
                return True
            else:
                self.log_test("Unique Violation", False, f"Expected 400 with 'unique' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Unique Violation", False, f"Exception: {str(e)}")
            return False
    
    def test_string_too_short(self) -> bool:
        """Test 4: String too short"""
        try:
            data = {
                "data": {
                    "sku": "AB",  # 2 chars, below min_length 3
                    "price": 50
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "at least 3" in response.text:
                self.log_test("String Too Short", True, f"Correctly rejected short string: {response.text}")
                return True
            else:
                self.log_test("String Too Short", False, f"Expected 400 with 'at least 3' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("String Too Short", False, f"Exception: {str(e)}")
            return False
    
    def test_string_too_long(self) -> bool:
        """Test 5: String too long"""
        try:
            data = {
                "data": {
                    "sku": "ABCDEFGHIJK",  # 11 chars, above max_length 10
                    "price": 50
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "at most 10" in response.text:
                self.log_test("String Too Long", True, f"Correctly rejected long string: {response.text}")
                return True
            else:
                self.log_test("String Too Long", False, f"Expected 400 with 'at most 10' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("String Too Long", False, f"Exception: {str(e)}")
            return False
    
    def test_number_below_min(self) -> bool:
        """Test 6: Number below min"""
        try:
            data = {
                "data": {
                    "sku": "NEG001",
                    "price": -5  # Below min 0
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and ">= 0" in response.text:
                self.log_test("Number Below Min", True, f"Correctly rejected number below min: {response.text}")
                return True
            else:
                self.log_test("Number Below Min", False, f"Expected 400 with '>= 0' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Number Below Min", False, f"Exception: {str(e)}")
            return False
    
    def test_number_above_max(self) -> bool:
        """Test 7: Number above max"""
        try:
            data = {
                "data": {
                    "sku": "BIG001",
                    "price": 99999  # Above max 10000
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "<= 10000" in response.text:
                self.log_test("Number Above Max", True, f"Correctly rejected number above max: {response.text}")
                return True
            else:
                self.log_test("Number Above Max", False, f"Expected 400 with '<= 10000' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Number Above Max", False, f"Exception: {str(e)}")
            return False
    
    def test_non_numeric_value(self) -> bool:
        """Test 8: Non-numeric value for number field"""
        try:
            data = {
                "data": {
                    "sku": "NON001",
                    "price": "abc"  # String instead of number
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "number" in response.text.lower():
                self.log_test("Non-Numeric Value", True, f"Correctly rejected non-numeric value: {response.text}")
                return True
            else:
                self.log_test("Non-Numeric Value", False, f"Expected 400 with 'number' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Non-Numeric Value", False, f"Exception: {str(e)}")
            return False
    
    def test_image_count_exceeded(self) -> bool:
        """Test 9: Image count exceeded"""
        try:
            data = {
                "data": {
                    "sku": "IMG001",
                    "price": 50,
                    "photos": ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]  # 4 images, max_count=3
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 400 and "at most 3" in response.text:
                self.log_test("Image Count Exceeded", True, f"Correctly rejected too many images: {response.text}")
                return True
            else:
                self.log_test("Image Count Exceeded", False, f"Expected 400 with 'at most 3' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Image Count Exceeded", False, f"Exception: {str(e)}")
            return False
    
    def test_image_count_within_limit(self) -> bool:
        """Test 10: Image count within limit"""
        try:
            data = {
                "data": {
                    "sku": "IMG002",
                    "price": 50,
                    "photos": ["a.jpg", "b.jpg"]  # 2 images, within max_count=3
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code == 200:
                self.log_test("Image Count Within Limit", True, "Successfully created item with images within limit")
                return True
            else:
                self.log_test("Image Count Within Limit", False, f"Expected 200, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Image Count Within Limit", False, f"Exception: {str(e)}")
            return False
    
    def test_unique_excludes_self_on_update(self) -> bool:
        """Test 11: Unique check excludes self on update"""
        try:
            # First, get the item from test 1 (sku="ABC123")
            response = self.session.get(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items")
            
            if response.status_code != 200:
                self.log_test("Unique Excludes Self - Get Items", False, f"Failed to get items: {response.status_code}")
                return False
            
            items = response.json()
            abc123_item = None
            for item in items:
                if item.get("data", {}).get("sku") == "ABC123":
                    abc123_item = item
                    break
            
            if not abc123_item:
                self.log_test("Unique Excludes Self - Find Item", False, "Could not find ABC123 item")
                return False
            
            item_id = abc123_item["item_id"]
            
            # Now update it with the same sku (should be allowed)
            data = {
                "data": {
                    "sku": "ABC123",  # Same sku
                    "price": 150      # Different price
                }
            }
            
            response = self.session.put(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items/{item_id}", json=data)
            
            if response.status_code == 200:
                self.log_test("Unique Excludes Self on Update", True, "Successfully updated item with same unique field")
                return True
            else:
                self.log_test("Unique Excludes Self on Update", False, f"Expected 200, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Unique Excludes Self on Update", False, f"Exception: {str(e)}")
            return False
    
    def test_unique_violation_on_update(self) -> bool:
        """Test 12: Unique violation on update"""
        try:
            # First create another item
            data = {
                "data": {
                    "sku": "XYZ999",
                    "price": 300
                }
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items", json=data)
            
            if response.status_code != 200:
                self.log_test("Unique Violation Update - Create Item", False, f"Failed to create item: {response.status_code}")
                return False
            
            new_item = response.json()
            item_id = new_item["item_id"]
            
            # Now try to update it with existing sku
            data = {
                "data": {
                    "sku": "ABC123",  # Existing sku from test 1
                    "price": 300
                }
            }
            
            response = self.session.put(f"{BASE_URL}/agents/{self.agent_id}/collections/phase7_test/items/{item_id}", json=data)
            
            if response.status_code == 400 and "unique" in response.text.lower():
                self.log_test("Unique Violation on Update", True, f"Correctly rejected unique violation on update: {response.text}")
                return True
            else:
                self.log_test("Unique Violation on Update", False, f"Expected 400 with 'unique' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Unique Violation on Update", False, f"Exception: {str(e)}")
            return False
    
    def test_max_fields_limit(self) -> bool:
        """Test 13: MAX 20 fields limit"""
        try:
            # Create a schema with 21 fields
            fields = []
            for i in range(21):
                fields.append({
                    "field_name": f"field_{i}",
                    "field_type": "text",
                    "required": False,
                    "unique": False,
                    "validation": {}
                })
            
            test_schema = {
                "collection_name": "max_fields_test",
                "display_name": "Max Fields Test",
                "fields": fields
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.agent_id}/schemas", json=test_schema)
            
            if response.status_code == 400 and ("Maximum 20" in response.text or "20 fields" in response.text):
                self.log_test("MAX 20 Fields Limit", True, f"Correctly rejected schema with 21 fields: {response.text}")
                return True
            else:
                self.log_test("MAX 20 Fields Limit", False, f"Expected 400 with 'Maximum 20' in message, got: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("MAX 20 Fields Limit", False, f"Exception: {str(e)}")
            return False
    
    def cleanup_test_schema(self) -> bool:
        """Clean up test schema"""
        try:
            response = self.session.delete(f"{BASE_URL}/agents/{self.agent_id}/schemas/phase7_test")
            
            if response.status_code == 200:
                self.log_test("Cleanup Test Schema", True, "Successfully deleted test schema")
                return True
            else:
                self.log_test("Cleanup Test Schema", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Cleanup Test Schema", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Phase 7 validation tests"""
        print("=" * 60)
        print("PHASE 7 BACKEND VALIDATION TESTING")
        print("=" * 60)
        
        # Setup
        if not self.authenticate():
            return False
        
        if not self.get_hotel_agent():
            return False
        
        if not self.create_test_schema():
            return False
        
        # Run validation tests
        tests = [
            self.test_valid_create,
            self.test_required_missing,
            self.test_unique_violation,
            self.test_string_too_short,
            self.test_string_too_long,
            self.test_number_below_min,
            self.test_number_above_max,
            self.test_non_numeric_value,
            self.test_image_count_exceeded,
            self.test_image_count_within_limit,
            self.test_unique_excludes_self_on_update,
            self.test_unique_violation_on_update,
            self.test_max_fields_limit
        ]
        
        for test in tests:
            test()
        
        # Cleanup
        self.cleanup_test_schema()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Tests Passed: {passed}/{total} ({passed/total*100:.1f}%)")
        
        if passed < total:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
        
        return passed == total

def main():
    tester = Phase7ValidationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()