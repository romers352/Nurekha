#!/usr/bin/env python3
"""
Phase 5 Multi-Collection Management Backend Testing
Tests all multi-collection management endpoints with comprehensive scenarios
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://agent-vault-7.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@nurekha.com"
ADMIN_PASSWORD = "Admin@123"

class TestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.hotel_agent_id = None
        self.test_results = []
        
    def log_test(self, test_name, status, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_symbol = "✅" if status == "PASS" else "❌"
        print(f"{status_symbol} {test_name}: {details}")
        if response_data and status == "FAIL":
            print(f"   Response: {response_data}")
    
    def authenticate(self):
        """Authenticate as admin user"""
        print("🔐 Authenticating as admin user...")
        
        auth_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=auth_data)
            if response.status_code == 200:
                self.log_test("Authentication", "PASS", "Admin login successful")
                return True
            else:
                self.log_test("Authentication", "FAIL", f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Authentication", "FAIL", f"Login error: {str(e)}")
            return False
    
    def get_hotel_agent(self):
        """Get existing hotel agent or create one"""
        print("🏨 Finding hotel agent...")
        
        try:
            # Get all agents
            response = self.session.get(f"{BASE_URL}/agents")
            if response.status_code != 200:
                self.log_test("Get Hotel Agent", "FAIL", f"Failed to get agents: {response.status_code}", response.text)
                return False
            
            agents = response.json()
            
            # Find hotel agent
            hotel_agent = None
            for agent in agents:
                if agent.get("business_type") == "hotel":
                    hotel_agent = agent
                    break
            
            if hotel_agent:
                self.hotel_agent_id = hotel_agent["agent_id"]
                self.log_test("Get Hotel Agent", "PASS", f"Found hotel agent: {hotel_agent['name']} (ID: {self.hotel_agent_id})")
                return True
            else:
                # Create hotel agent
                print("   Creating new hotel agent...")
                create_data = {
                    "name": "Test Hotel",
                    "business_type": "hotel"
                }
                
                response = self.session.post(f"{BASE_URL}/agents", json=create_data)
                if response.status_code == 200:
                    new_agent = response.json()
                    self.hotel_agent_id = new_agent["agent_id"]
                    self.log_test("Create Hotel Agent", "PASS", f"Created hotel agent: {new_agent['name']} (ID: {self.hotel_agent_id})")
                    return True
                else:
                    self.log_test("Create Hotel Agent", "FAIL", f"Failed to create hotel agent: {response.status_code}", response.text)
                    return False
                    
        except Exception as e:
            self.log_test("Get Hotel Agent", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_1_schemas_list_with_item_count_and_sort(self):
        """Test 1: Schemas list with item_count + sort order"""
        print("\n📋 Test 1: Schemas list with item_count + sort order")
        
        try:
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            
            if response.status_code != 200:
                self.log_test("Test 1 - GET schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            schemas = response.json()
            
            # Verify each schema has item_count and order fields
            for schema in schemas:
                if "item_count" not in schema:
                    self.log_test("Test 1 - item_count field", "FAIL", f"Schema '{schema.get('collection_name')}' missing item_count field")
                    return False
                if "order" not in schema:
                    self.log_test("Test 1 - order field", "FAIL", f"Schema '{schema.get('collection_name')}' missing order field")
                    return False
                if not isinstance(schema["item_count"], int) or schema["item_count"] < 0:
                    self.log_test("Test 1 - item_count type", "FAIL", f"Schema '{schema.get('collection_name')}' has invalid item_count: {schema['item_count']}")
                    return False
                if not isinstance(schema["order"], int):
                    self.log_test("Test 1 - order type", "FAIL", f"Schema '{schema.get('collection_name')}' has invalid order: {schema['order']}")
                    return False
            
            # Verify list is sorted by order ascending
            orders = [schema["order"] for schema in schemas]
            if orders != sorted(orders):
                self.log_test("Test 1 - sort order", "FAIL", f"Schemas not sorted by order. Got: {orders}")
                return False
            
            self.log_test("Test 1 - Schemas list", "PASS", f"Found {len(schemas)} schemas, all have item_count and order fields, sorted correctly")
            return True
            
        except Exception as e:
            self.log_test("Test 1 - Schemas list", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_2_max_2_collection_limit(self):
        """Test 2: MAX 2 collection limit enforcement"""
        print("\n🚫 Test 2: MAX 2 collection limit enforcement")
        
        try:
            # First, check current collection count
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 2 - Get current schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            current_schemas = response.json()
            current_count = len(current_schemas)
            
            if current_count == 1:
                # Create second collection (should succeed)
                create_data = {
                    "collection_name": "amenities",
                    "display_name": "Amenities",
                    "fields": [
                        {"field_name": "name", "field_type": "text", "required": True}
                    ]
                }
                
                response = self.session.post(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas", json=create_data)
                if response.status_code != 200:
                    self.log_test("Test 2 - Create 2nd collection", "FAIL", f"Expected 200, got {response.status_code}", response.text)
                    return False
                
                self.log_test("Test 2 - Create 2nd collection", "PASS", "Successfully created second collection")
            
            # Now try to create third collection (should fail)
            create_data = {
                "collection_name": "staff",
                "display_name": "Staff",
                "fields": [
                    {"field_name": "name", "field_type": "text"}
                ]
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas", json=create_data)
            
            if response.status_code == 400:
                response_text = response.text
                if "Maximum of 2 collections" in response_text:
                    self.log_test("Test 2 - Limit enforcement", "PASS", "Correctly rejected 3rd collection with proper error message")
                    return True
                else:
                    self.log_test("Test 2 - Error message", "FAIL", f"Wrong error message: {response_text}")
                    return False
            else:
                self.log_test("Test 2 - Limit enforcement", "FAIL", f"Expected 400, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Test 2 - Collection limit", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_3_rename_display_name_only(self):
        """Test 3: Rename — display_name only (no data migration)"""
        print("\n✏️ Test 3: Rename display_name only")
        
        try:
            rename_data = {
                "new_display_name": "Hotel Amenities"
            }
            
            response = self.session.put(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/amenities/rename", json=rename_data)
            
            if response.status_code != 200:
                self.log_test("Test 3 - Rename display_name", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            updated_schema = response.json()
            
            # Verify display_name updated
            if updated_schema.get("display_name") != "Hotel Amenities":
                self.log_test("Test 3 - Display name update", "FAIL", f"Expected 'Hotel Amenities', got '{updated_schema.get('display_name')}'")
                return False
            
            # Verify collection_name unchanged
            if updated_schema.get("collection_name") != "amenities":
                self.log_test("Test 3 - Collection name unchanged", "FAIL", f"Collection name changed to '{updated_schema.get('collection_name')}'")
                return False
            
            self.log_test("Test 3 - Rename display_name", "PASS", "Display name updated, collection name unchanged")
            return True
            
        except Exception as e:
            self.log_test("Test 3 - Rename display_name", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_4_rename_internal_key_with_migration(self):
        """Test 4: Rename — internal key with data migration"""
        print("\n🔄 Test 4: Rename internal key with data migration")
        
        try:
            # First, create an item in amenities collection
            item_data = {
                "data": {"name": "Pool"}
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.hotel_agent_id}/collections/amenities/items", json=item_data)
            if response.status_code != 200:
                self.log_test("Test 4 - Create test item", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            self.log_test("Test 4 - Create test item", "PASS", "Created test item in amenities collection")
            
            # Now rename the collection key
            rename_data = {
                "new_collection_name": "hotel_amenities"
            }
            
            response = self.session.put(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/amenities/rename", json=rename_data)
            
            if response.status_code != 200:
                self.log_test("Test 4 - Rename collection key", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            updated_schema = response.json()
            
            # Verify collection_name updated
            if updated_schema.get("collection_name") != "hotel_amenities":
                self.log_test("Test 4 - Collection name update", "FAIL", f"Expected 'hotel_amenities', got '{updated_schema.get('collection_name')}'")
                return False
            
            # Verify data migrated - check new collection has the item
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/collections/hotel_amenities/items")
            if response.status_code != 200:
                self.log_test("Test 4 - Check migrated data", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            new_items = response.json()
            if len(new_items) != 1 or new_items[0].get("data", {}).get("name") != "Pool":
                self.log_test("Test 4 - Data migration", "FAIL", f"Data not migrated correctly. Items: {new_items}")
                return False
            
            # Verify old collection is empty
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/collections/amenities/items")
            if response.status_code == 200:
                old_items = response.json()
                if len(old_items) > 0:
                    self.log_test("Test 4 - Old collection cleanup", "FAIL", f"Old collection still has {len(old_items)} items")
                    return False
            
            self.log_test("Test 4 - Rename with migration", "PASS", "Collection renamed and data migrated successfully")
            return True
            
        except Exception as e:
            self.log_test("Test 4 - Rename with migration", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_5_rename_conflict_existing(self):
        """Test 5: Rename — conflict with existing collection"""
        print("\n⚠️ Test 5: Rename conflict with existing collection")
        
        try:
            # Get current schemas to find the default collection name
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 5 - Get schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            schemas = response.json()
            default_collection = None
            for schema in schemas:
                if schema.get("collection_name") != "hotel_amenities":
                    default_collection = schema.get("collection_name")
                    break
            
            if not default_collection:
                self.log_test("Test 5 - Find default collection", "FAIL", "Could not find default collection")
                return False
            
            # Try to rename hotel_amenities to the default collection name (should conflict)
            rename_data = {
                "new_collection_name": default_collection
            }
            
            response = self.session.put(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/hotel_amenities/rename", json=rename_data)
            
            if response.status_code == 400:
                response_text = response.text
                if "already exists" in response_text:
                    self.log_test("Test 5 - Conflict detection", "PASS", "Correctly detected and rejected conflicting collection name")
                    return True
                else:
                    self.log_test("Test 5 - Error message", "FAIL", f"Wrong error message: {response_text}")
                    return False
            else:
                self.log_test("Test 5 - Conflict detection", "FAIL", f"Expected 400, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Test 5 - Rename conflict", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_6_duplicate_at_limit(self):
        """Test 6: Duplicate — auto-generated name (should FAIL at 2/2 limit)"""
        print("\n📋 Test 6: Duplicate at collection limit")
        
        try:
            # Try to duplicate rooms collection (should fail since we're at 2/2 limit)
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 6 - Get schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            schemas = response.json()
            rooms_collection = None
            for schema in schemas:
                if schema.get("collection_name") != "hotel_amenities":
                    rooms_collection = schema.get("collection_name")
                    break
            
            if not rooms_collection:
                self.log_test("Test 6 - Find rooms collection", "FAIL", "Could not find rooms collection")
                return False
            
            response = self.session.post(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/{rooms_collection}/duplicate")
            
            if response.status_code == 400:
                response_text = response.text
                if "Maximum of 2 collections" in response_text:
                    self.log_test("Test 6 - Duplicate at limit", "PASS", "Correctly rejected duplicate when at collection limit")
                    return True
                else:
                    self.log_test("Test 6 - Error message", "FAIL", f"Wrong error message: {response_text}")
                    return False
            else:
                self.log_test("Test 6 - Duplicate at limit", "FAIL", f"Expected 400, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Test 6 - Duplicate at limit", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_7_duplicate_after_freeing_slot(self):
        """Test 7: Duplicate — after freeing a slot"""
        print("\n🆓 Test 7: Duplicate after freeing a slot")
        
        try:
            # Delete hotel_amenities to free up a slot
            response = self.session.delete(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/hotel_amenities")
            if response.status_code != 200:
                self.log_test("Test 7 - Delete collection", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            self.log_test("Test 7 - Delete collection", "PASS", "Freed up collection slot")
            
            # Get the remaining collection name
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 7 - Get schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            schemas = response.json()
            if len(schemas) != 1:
                self.log_test("Test 7 - Schema count", "FAIL", f"Expected 1 schema, got {len(schemas)}")
                return False
            
            source_collection = schemas[0].get("collection_name")
            
            # Now duplicate with custom names
            duplicate_data = {
                "new_collection_name": "rooms_backup",
                "new_display_name": "Rooms Backup"
            }
            
            response = self.session.post(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/{source_collection}/duplicate", json=duplicate_data)
            
            if response.status_code != 200:
                self.log_test("Test 7 - Duplicate collection", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            new_schema = response.json()
            
            # Verify new schema properties
            if new_schema.get("collection_name") != "rooms_backup":
                self.log_test("Test 7 - New collection name", "FAIL", f"Expected 'rooms_backup', got '{new_schema.get('collection_name')}'")
                return False
            
            if new_schema.get("display_name") != "Rooms Backup":
                self.log_test("Test 7 - New display name", "FAIL", f"Expected 'Rooms Backup', got '{new_schema.get('display_name')}'")
                return False
            
            if new_schema.get("item_count") != 0:
                self.log_test("Test 7 - Item count", "FAIL", f"Expected 0 items, got {new_schema.get('item_count')}")
                return False
            
            # Verify fields are copied
            if not new_schema.get("fields"):
                self.log_test("Test 7 - Fields copied", "FAIL", "No fields in duplicated schema")
                return False
            
            self.log_test("Test 7 - Duplicate after freeing", "PASS", "Successfully duplicated collection with custom names")
            return True
            
        except Exception as e:
            self.log_test("Test 7 - Duplicate after freeing", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_8_reorder(self):
        """Test 8: Reorder"""
        print("\n🔄 Test 8: Reorder schemas")
        
        try:
            # Get current schemas
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 8 - Get schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            schemas = response.json()
            if len(schemas) != 2:
                self.log_test("Test 8 - Schema count", "FAIL", f"Expected 2 schemas, got {len(schemas)}")
                return False
            
            # Get collection names
            collection_names = [schema["collection_name"] for schema in schemas]
            
            # Reorder - put rooms_backup first
            reorder_data = {
                "order": ["rooms_backup", collection_names[0] if collection_names[0] != "rooms_backup" else collection_names[1]]
            }
            
            response = self.session.patch(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/reorder", json=reorder_data)
            
            if response.status_code != 200:
                self.log_test("Test 8 - Reorder request", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            reorder_result = response.json()
            
            # Verify response
            if not reorder_result.get("success"):
                self.log_test("Test 8 - Reorder response", "FAIL", f"Success not true: {reorder_result}")
                return False
            
            # Verify new order by getting schemas again
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 8 - Get reordered schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            reordered_schemas = response.json()
            
            # Verify first schema is rooms_backup
            if reordered_schemas[0].get("collection_name") != "rooms_backup":
                self.log_test("Test 8 - Reorder verification", "FAIL", f"First schema is '{reordered_schemas[0].get('collection_name')}', expected 'rooms_backup'")
                return False
            
            self.log_test("Test 8 - Reorder", "PASS", "Successfully reordered schemas")
            return True
            
        except Exception as e:
            self.log_test("Test 8 - Reorder", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_9_cleanup(self):
        """Test 9: Cleanup"""
        print("\n🧹 Test 9: Cleanup test collections")
        
        try:
            # Delete rooms_backup to restore default state
            response = self.session.delete(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas/rooms_backup")
            if response.status_code != 200:
                self.log_test("Test 9 - Delete rooms_backup", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            # Verify only default collection remains
            response = self.session.get(f"{BASE_URL}/agents/{self.hotel_agent_id}/schemas")
            if response.status_code != 200:
                self.log_test("Test 9 - Get final schemas", "FAIL", f"Status: {response.status_code}", response.text)
                return False
            
            final_schemas = response.json()
            if len(final_schemas) != 1:
                self.log_test("Test 9 - Final schema count", "FAIL", f"Expected 1 schema, got {len(final_schemas)}")
                return False
            
            self.log_test("Test 9 - Cleanup", "PASS", "Successfully cleaned up test collections, restored to default state")
            return True
            
        except Exception as e:
            self.log_test("Test 9 - Cleanup", "FAIL", f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Phase 5 Multi-Collection Management tests"""
        print("🚀 Starting Phase 5 Multi-Collection Management Backend Tests")
        print("=" * 70)
        
        # Authentication
        if not self.authenticate():
            return False
        
        # Get hotel agent
        if not self.get_hotel_agent():
            return False
        
        # Run all tests in sequence
        tests = [
            self.test_1_schemas_list_with_item_count_and_sort,
            self.test_2_max_2_collection_limit,
            self.test_3_rename_display_name_only,
            self.test_4_rename_internal_key_with_migration,
            self.test_5_rename_conflict_existing,
            self.test_6_duplicate_at_limit,
            self.test_7_duplicate_after_freeing_slot,
            self.test_8_reorder,
            self.test_9_cleanup
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            if test():
                passed += 1
            else:
                failed += 1
        
        # Summary
        print("\n" + "=" * 70)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   - {result['test']}: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    runner = TestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)