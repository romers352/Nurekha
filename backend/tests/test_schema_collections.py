"""
Backend API Tests for Agent Data Management System
Tests: Schema Builder, Dynamic Collections, CSV Upload, Image Upload, Field Validation
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agent-vault-7.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "admin@nurekha.com"
TEST_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def session():
    """Create authenticated session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    
    # Login
    resp = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return s


@pytest.fixture(scope="module")
def test_agent(session):
    """Create or get a test agent for schema testing"""
    # List existing agents
    resp = session.get(f"{BASE_URL}/api/agents")
    assert resp.status_code == 200
    agents = resp.json()
    
    # Use existing agent or create new one
    if agents:
        return agents[0]
    
    # Create new agent
    resp = session.post(f"{BASE_URL}/api/agents", json={
        "name": f"TEST_SchemaAgent_{uuid.uuid4().hex[:6]}",
        "business_type": "ecommerce"
    })
    assert resp.status_code == 200
    return resp.json()


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self, session):
        """Test login with valid credentials"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
    
    def test_auth_me(self, session):
        """Test /auth/me endpoint"""
        resp = session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data
        assert data["email"] == TEST_EMAIL


class TestSchemaBuilder:
    """Schema Builder CRUD tests"""
    
    def test_get_agent_schemas(self, session, test_agent):
        """Test fetching schemas for an agent"""
        agent_id = test_agent["agent_id"]
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        assert resp.status_code == 200
        schemas = resp.json()
        assert isinstance(schemas, list)
        # Each schema should have required fields
        for schema in schemas:
            assert "collection_name" in schema
            assert "display_name" in schema
            assert "fields" in schema
    
    def test_create_schema(self, session, test_agent):
        """Test creating a new schema"""
        agent_id = test_agent["agent_id"]
        unique_name = f"test_collection_{uuid.uuid4().hex[:6]}"
        
        # First check current schema count
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        current_schemas = resp.json()
        
        # If at limit (2), delete one first
        if len(current_schemas) >= 2:
            # Delete the first non-default schema
            for schema in current_schemas:
                if not schema.get("is_default"):
                    session.delete(f"{BASE_URL}/api/agents/{agent_id}/schemas/{schema['collection_name']}")
                    break
        
        # Create new schema
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/schemas", json={
            "collection_name": unique_name,
            "display_name": "Test Collection",
            "fields": [
                {"field_name": "name", "field_type": "text", "required": True, "unique": False, "validation": {}},
                {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
                {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
                {"field_name": "email", "field_type": "email", "required": False, "unique": True, "validation": {}},
                {"field_name": "is_active", "field_type": "checkbox", "required": False, "unique": False, "validation": {}},
            ]
        })
        
        assert resp.status_code == 200, f"Create schema failed: {resp.text}"
        data = resp.json()
        assert data["collection_name"] == unique_name
        assert len(data["fields"]) == 5
        
        # Cleanup - delete the test schema
        session.delete(f"{BASE_URL}/api/agents/{agent_id}/schemas/{unique_name}")
    
    def test_schema_field_limit(self, session, test_agent):
        """Test 20-field limit per schema"""
        agent_id = test_agent["agent_id"]
        unique_name = f"test_limit_{uuid.uuid4().hex[:6]}"
        
        # First check current schema count and clean up if needed
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        current_schemas = resp.json()
        if len(current_schemas) >= 2:
            for schema in current_schemas:
                if not schema.get("is_default"):
                    session.delete(f"{BASE_URL}/api/agents/{agent_id}/schemas/{schema['collection_name']}")
                    break
        
        # Create schema with 21 fields (should fail)
        fields = [{"field_name": f"field_{i}", "field_type": "text", "required": False, "unique": False, "validation": {}} for i in range(21)]
        
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/schemas", json={
            "collection_name": unique_name,
            "display_name": "Too Many Fields",
            "fields": fields
        })
        
        assert resp.status_code == 400, "Should reject schema with >20 fields"
        assert "20" in resp.text.lower() or "maximum" in resp.text.lower()
    
    def test_schema_collection_limit(self, session, test_agent):
        """Test max 2 collections per agent"""
        agent_id = test_agent["agent_id"]
        
        # Get current schemas
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        current_schemas = resp.json()
        
        # If less than 2, create to reach limit
        while len(current_schemas) < 2:
            unique_name = f"test_limit_{uuid.uuid4().hex[:6]}"
            resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/schemas", json={
                "collection_name": unique_name,
                "display_name": "Limit Test",
                "fields": [{"field_name": "test", "field_type": "text", "required": False, "unique": False, "validation": {}}]
            })
            if resp.status_code == 200:
                current_schemas.append(resp.json())
        
        # Try to create a 3rd schema (should fail)
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/schemas", json={
            "collection_name": f"test_third_{uuid.uuid4().hex[:6]}",
            "display_name": "Third Collection",
            "fields": [{"field_name": "test", "field_type": "text", "required": False, "unique": False, "validation": {}}]
        })
        
        assert resp.status_code == 400, "Should reject 3rd collection"
        assert "2" in resp.text or "maximum" in resp.text.lower()
    
    def test_rename_schema(self, session, test_agent):
        """Test renaming a schema"""
        agent_id = test_agent["agent_id"]
        
        # Get existing schemas
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        schemas = resp.json()
        
        if not schemas:
            pytest.skip("No schemas to rename")
        
        schema = schemas[0]
        original_display = schema["display_name"]
        new_display = f"Renamed_{uuid.uuid4().hex[:4]}"
        
        # Rename display name only
        resp = session.put(f"{BASE_URL}/api/agents/{agent_id}/schemas/{schema['collection_name']}/rename", json={
            "new_display_name": new_display
        })
        
        assert resp.status_code == 200
        data = resp.json()
        assert data["display_name"] == new_display
        
        # Revert
        session.put(f"{BASE_URL}/api/agents/{agent_id}/schemas/{schema['collection_name']}/rename", json={
            "new_display_name": original_display
        })


class TestDynamicCollections:
    """Dynamic Collection CRUD tests"""
    
    @pytest.fixture
    def test_schema(self, session, test_agent):
        """Ensure a test schema exists"""
        agent_id = test_agent["agent_id"]
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        schemas = resp.json()
        
        if schemas:
            return schemas[0]
        
        # Create one if none exist
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/schemas", json={
            "collection_name": "test_items",
            "display_name": "Test Items",
            "fields": [
                {"field_name": "name", "field_type": "text", "required": True, "unique": False, "validation": {}},
                {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            ]
        })
        return resp.json()
    
    def test_create_item(self, session, test_agent, test_schema):
        """Test creating an item in a collection"""
        agent_id = test_agent["agent_id"]
        collection_name = test_schema["collection_name"]
        
        # Build data with all required fields from schema
        data = {}
        for field in test_schema.get("fields", []):
            fname = field["field_name"]
            ftype = field["field_type"]
            required = field.get("required", False)
            validation = field.get("validation", {})
            
            if required or fname in ["name", "product_name", "room_type"]:
                if ftype == "number":
                    # Respect min/max validation
                    min_val = validation.get("min", 0)
                    max_val = validation.get("max", 1000)
                    if min_val is not None and max_val is not None:
                        data[fname] = (min_val + max_val) // 2 if max_val > min_val else min_val
                    elif min_val is not None:
                        data[fname] = min_val + 1
                    else:
                        data[fname] = 5
                elif ftype == "checkbox":
                    data[fname] = True
                elif ftype == "dropdown":
                    opts = field.get("dropdown_options", [])
                    data[fname] = opts[0] if opts else "test"
                else:
                    data[fname] = f"TEST_Item_{uuid.uuid4().hex[:6]}"
        
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items", json={
            "data": data
        })
        
        assert resp.status_code == 200, f"Create item failed: {resp.text}"
        result = resp.json()
        assert "item_id" in result
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items/{result['item_id']}")
    
    def test_get_items(self, session, test_agent, test_schema):
        """Test fetching items from a collection"""
        agent_id = test_agent["agent_id"]
        collection_name = test_schema["collection_name"]
        
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items")
        assert resp.status_code == 200
        items = resp.json()
        assert isinstance(items, list)
    
    def test_update_item(self, session, test_agent, test_schema):
        """Test updating an item"""
        agent_id = test_agent["agent_id"]
        collection_name = test_schema["collection_name"]
        
        # Build data with all required fields from schema
        create_data = {}
        update_data = {}
        text_field = None
        
        for field in test_schema.get("fields", []):
            fname = field["field_name"]
            ftype = field["field_type"]
            required = field.get("required", False)
            validation = field.get("validation", {})
            
            if required:
                if ftype == "number":
                    # Respect min/max validation
                    min_val = validation.get("min", 0)
                    max_val = validation.get("max", 1000)
                    if min_val is not None and max_val is not None:
                        mid = (min_val + max_val) // 2 if max_val > min_val else min_val
                        create_data[fname] = mid
                        update_data[fname] = mid + 1 if mid + 1 <= max_val else mid
                    elif min_val is not None:
                        create_data[fname] = min_val + 1
                        update_data[fname] = min_val + 2
                    else:
                        create_data[fname] = 5
                        update_data[fname] = 10
                elif ftype == "checkbox":
                    create_data[fname] = True
                    update_data[fname] = False
                elif ftype == "dropdown":
                    opts = field.get("dropdown_options", [])
                    create_data[fname] = opts[0] if opts else "test"
                    update_data[fname] = opts[1] if len(opts) > 1 else opts[0] if opts else "test"
                else:
                    create_data[fname] = "TEST_UpdateMe"
                    update_data[fname] = "TEST_Updated"
                    if not text_field:
                        text_field = fname
        
        # Create item
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items", json={
            "data": create_data
        })
        assert resp.status_code == 200, f"Create failed: {resp.text}"
        item = resp.json()
        item_id = item["item_id"]
        
        # Update item
        resp = session.put(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items/{item_id}", json={
            "data": update_data
        })
        
        assert resp.status_code == 200, f"Update failed: {resp.text}"
        updated = resp.json()
        
        # Verify at least one field was updated
        if text_field:
            assert updated["data"][text_field] == "TEST_Updated"
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items/{item_id}")
    
    def test_delete_item(self, session, test_agent, test_schema):
        """Test deleting an item"""
        agent_id = test_agent["agent_id"]
        collection_name = test_schema["collection_name"]
        
        # Build data with all required fields from schema
        create_data = {}
        for field in test_schema.get("fields", []):
            fname = field["field_name"]
            ftype = field["field_type"]
            required = field.get("required", False)
            validation = field.get("validation", {})
            
            if required:
                if ftype == "number":
                    # Respect min/max validation
                    min_val = validation.get("min", 0)
                    max_val = validation.get("max", 1000)
                    if min_val is not None and max_val is not None:
                        create_data[fname] = (min_val + max_val) // 2 if max_val > min_val else min_val
                    elif min_val is not None:
                        create_data[fname] = min_val + 1
                    else:
                        create_data[fname] = 5
                elif ftype == "checkbox":
                    create_data[fname] = True
                elif ftype == "dropdown":
                    opts = field.get("dropdown_options", [])
                    create_data[fname] = opts[0] if opts else "test"
                else:
                    create_data[fname] = "TEST_DeleteMe"
        
        # Create item
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items", json={
            "data": create_data
        })
        assert resp.status_code == 200, f"Create failed: {resp.text}"
        item = resp.json()
        item_id = item["item_id"]
        
        # Delete item
        resp = session.delete(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items/{item_id}")
        assert resp.status_code == 200
        
        # Verify deletion
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items")
        items = resp.json()
        found = next((i for i in items if i["item_id"] == item_id), None)
        assert found is None, "Item should be deleted"


class TestFieldValidation:
    """Field validation tests"""
    
    @pytest.fixture
    def validation_schema(self, session, test_agent):
        """Create schema with various validation rules"""
        agent_id = test_agent["agent_id"]
        
        # Check if we can create a new schema
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        schemas = resp.json()
        
        # Look for existing validation schema or use first available
        for schema in schemas:
            if "validation" in schema["collection_name"]:
                return schema
        
        if schemas:
            return schemas[0]
        
        pytest.skip("No schemas available for validation testing")
    
    def test_required_field_validation(self, session, test_agent, validation_schema):
        """Test required field validation"""
        agent_id = test_agent["agent_id"]
        collection_name = validation_schema["collection_name"]
        
        # Find a required field
        required_fields = [f for f in validation_schema["fields"] if f.get("required")]
        if not required_fields:
            pytest.skip("No required fields in schema")
        
        # Try to create item without required field
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items", json={
            "data": {}  # Empty data
        })
        
        assert resp.status_code == 400, "Should reject item missing required fields"
    
    def test_number_min_validation(self, session, test_agent, validation_schema):
        """Test number min validation"""
        agent_id = test_agent["agent_id"]
        collection_name = validation_schema["collection_name"]
        
        # Find a number field with min validation
        number_fields = [f for f in validation_schema["fields"] if f.get("field_type") == "number"]
        if not number_fields:
            pytest.skip("No number fields in schema")
        
        field = number_fields[0]
        min_val = field.get("validation", {}).get("min")
        
        if min_val is None:
            pytest.skip("No min validation on number field")
        
        # Build valid data for required fields
        data = {}
        for f in validation_schema["fields"]:
            if f.get("required"):
                if f["field_type"] == "number":
                    data[f["field_name"]] = -999  # Invalid negative
                elif f["field_type"] == "text":
                    data[f["field_name"]] = "test"
        
        # Try to create with value below min
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items", json={
            "data": data
        })
        
        # Should fail if min is 0 and we passed -999
        if min_val == 0:
            assert resp.status_code == 400, "Should reject number below min"


class TestCSVUpload:
    """CSV upload and auto-detection tests"""
    
    @pytest.fixture
    def csv_schema(self, session, test_agent):
        """Get or create schema for CSV testing"""
        agent_id = test_agent["agent_id"]
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        schemas = resp.json()
        
        if schemas:
            return schemas[0]
        
        pytest.skip("No schemas available for CSV testing")
    
    def test_detect_csv_schema(self, session, test_agent, csv_schema):
        """Test CSV auto-detection"""
        agent_id = test_agent["agent_id"]
        collection_name = csv_schema["collection_name"]
        
        # Get field names from schema
        field_names = [f["field_name"] for f in csv_schema["fields"][:3]]
        
        # Create CSV content matching schema
        csv_content = ",".join(field_names) + "\n"
        csv_content += ",".join(["test_value"] * len(field_names)) + "\n"
        
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/detect-csv", json={
            "csv_content": csv_content
        })
        
        assert resp.status_code == 200, f"CSV detection failed: {resp.text}"
        data = resp.json()
        assert "headers" in data
        assert "detected_fields" in data
        assert "sample_data" in data
    
    def test_bulk_upload_csv(self, session, test_agent, csv_schema):
        """Test CSV bulk upload"""
        agent_id = test_agent["agent_id"]
        collection_name = csv_schema["collection_name"]
        
        # Build CSV with required fields
        required_fields = [f for f in csv_schema["fields"] if f.get("required")]
        if not required_fields:
            required_fields = csv_schema["fields"][:2]
        
        headers = [f["field_name"] for f in required_fields]
        
        # Create CSV content
        csv_content = ",".join(headers) + "\n"
        for i in range(3):
            row_values = []
            for f in required_fields:
                if f["field_type"] == "number":
                    row_values.append(str(100 + i))
                else:
                    row_values.append(f"TEST_CSV_{i}")
            csv_content += ",".join(row_values) + "\n"
        
        resp = session.post(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/bulk-upload", json={
            "csv_content": csv_content,
            "replace_existing": False  # Don't replace, just add
        })
        
        assert resp.status_code == 200, f"CSV upload failed: {resp.text}"
        data = resp.json()
        assert data["items_count"] == 3
        
        # Cleanup - delete TEST_CSV items
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items")
        items = resp.json()
        for item in items:
            if any("TEST_CSV" in str(v) for v in item.get("data", {}).values()):
                session.delete(f"{BASE_URL}/api/agents/{agent_id}/collections/{collection_name}/items/{item['item_id']}")


class TestImageUpload:
    """Image upload tests"""
    
    def test_upload_image(self, session):
        """Test image upload endpoint"""
        import base64
        # Minimal valid PNG (1x1 pixel)
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        # Use a fresh session without Content-Type header for multipart
        upload_session = requests.Session()
        # Copy cookies from authenticated session
        upload_session.cookies.update(session.cookies)
        
        files = {"file": ("test.png", png_data, "image/png")}
        
        resp = upload_session.post(f"{BASE_URL}/api/upload/image", files=files)
        
        assert resp.status_code == 200, f"Image upload failed: {resp.text}"
        data = resp.json()
        assert "url" in data
        assert "/uploads/images/" in data["url"]
        
        # Cleanup - delete the uploaded image
        filename = data["url"].split("/")[-1]
        session.delete(f"{BASE_URL}/api/uploads/images/{filename}")


class TestSchemaReorder:
    """Schema reorder tests"""
    
    def test_reorder_schemas(self, session, test_agent):
        """Test reordering schemas"""
        agent_id = test_agent["agent_id"]
        
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        schemas = resp.json()
        
        if len(schemas) < 2:
            pytest.skip("Need at least 2 schemas to test reorder")
        
        # Reverse the order
        original_order = [s["collection_name"] for s in schemas]
        reversed_order = list(reversed(original_order))
        
        resp = session.patch(f"{BASE_URL}/api/agents/{agent_id}/schemas/reorder", json={
            "order": reversed_order
        })
        
        assert resp.status_code == 200
        
        # Verify order changed
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/schemas")
        new_schemas = resp.json()
        new_order = [s["collection_name"] for s in new_schemas]
        
        assert new_order == reversed_order, "Order should be reversed"
        
        # Revert to original order
        session.patch(f"{BASE_URL}/api/agents/{agent_id}/schemas/reorder", json={
            "order": original_order
        })


class TestAgentEndpoints:
    """Agent CRUD tests"""
    
    def test_list_agents(self, session):
        """Test listing agents"""
        resp = session.get(f"{BASE_URL}/api/agents")
        assert resp.status_code == 200
        agents = resp.json()
        assert isinstance(agents, list)
    
    def test_get_agent(self, session, test_agent):
        """Test getting single agent"""
        agent_id = test_agent["agent_id"]
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["agent_id"] == agent_id
    
    def test_agent_stats(self, session, test_agent):
        """Test agent stats endpoint"""
        agent_id = test_agent["agent_id"]
        resp = session.get(f"{BASE_URL}/api/agents/{agent_id}/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "agent_id" in data
        assert "message_count" in data or "conversation_count" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
