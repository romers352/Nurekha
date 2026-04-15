"""
Central schema definitions for all 13 business types.
Each type defines: collection_name, fields, csv_headers, action_type, data_label, output_label.
"""

BUSINESS_TYPE_SCHEMAS = {
    "ecommerce": {
        "collection": "biz_products",
        "data_label": "Products",
        "data_icon": "ShoppingBag",
        "action_type": "order",
        "output_label": "Orders",
        "fields": [
            {"key": "product_name", "label": "Product Name", "type": "text", "required": True},
            {"key": "sku", "label": "SKU", "type": "text", "required": True},
            {"key": "description", "label": "Description", "type": "textarea", "required": False},
            {"key": "category", "label": "Category", "type": "text", "required": False},
            {"key": "brand", "label": "Brand", "type": "text", "required": False},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "discount_price", "label": "Discount Price", "type": "number", "required": False},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
            {"key": "stock_quantity", "label": "Stock Quantity", "type": "number", "required": True},
            {"key": "availability", "label": "Availability", "type": "select", "options": ["in_stock", "out_of_stock"], "required": False, "default": "in_stock"},
            {"key": "weight", "label": "Weight", "type": "text", "required": False},
            {"key": "tags", "label": "Tags", "type": "text", "required": False},
        ],
        "csv_headers": ["product_name", "sku", "description", "category", "brand", "price", "discount_price", "currency", "stock_quantity", "availability", "weight", "tags"],
    },
    "hotel": {
        "collection": "biz_rooms",
        "data_label": "Rooms",
        "data_icon": "Hotel",
        "action_type": "booking",
        "output_label": "Bookings",
        "fields": [
            {"key": "room_type", "label": "Room Type", "type": "text", "required": True},
            {"key": "price_per_night", "label": "Price/Night", "type": "number", "required": True},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
            {"key": "max_occupancy", "label": "Max Occupancy", "type": "number", "required": True},
            {"key": "available_rooms", "label": "Available Rooms", "type": "number", "required": True},
            {"key": "amenities", "label": "Amenities", "type": "text", "required": False},
            {"key": "availability_status", "label": "Status", "type": "select", "options": ["available", "booked", "maintenance"], "required": False, "default": "available"},
        ],
        "csv_headers": ["room_type", "price_per_night", "currency", "max_occupancy", "available_rooms", "amenities", "availability_status"],
    },
    "travel": {
        "collection": "biz_packages",
        "data_label": "Packages",
        "data_icon": "Plane",
        "action_type": "booking",
        "output_label": "Bookings",
        "fields": [
            {"key": "package_name", "label": "Package Name", "type": "text", "required": True},
            {"key": "destination", "label": "Destination", "type": "text", "required": True},
            {"key": "duration_days", "label": "Duration (days)", "type": "number", "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
            {"key": "available_seats", "label": "Available Seats", "type": "number", "required": False},
            {"key": "start_dates", "label": "Start Dates", "type": "text", "required": False},
            {"key": "inclusions", "label": "Inclusions", "type": "textarea", "required": False},
            {"key": "exclusions", "label": "Exclusions", "type": "textarea", "required": False},
        ],
        "csv_headers": ["package_name", "destination", "duration_days", "price", "currency", "available_seats", "start_dates", "inclusions", "exclusions"],
    },
    "real_estate": {
        "collection": "biz_properties",
        "data_label": "Properties",
        "data_icon": "Building",
        "action_type": "lead",
        "output_label": "Leads",
        "fields": [
            {"key": "title", "label": "Title", "type": "text", "required": True},
            {"key": "type", "label": "Type", "type": "select", "options": ["rent", "sale"], "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
            {"key": "location", "label": "Location", "type": "text", "required": True},
            {"key": "bedrooms", "label": "Bedrooms", "type": "number", "required": False},
            {"key": "bathrooms", "label": "Bathrooms", "type": "number", "required": False},
            {"key": "area_sqft", "label": "Area (sqft)", "type": "number", "required": False},
            {"key": "status", "label": "Status", "type": "select", "options": ["available", "sold", "rented"], "required": False, "default": "available"},
        ],
        "csv_headers": ["title", "type", "price", "currency", "location", "bedrooms", "bathrooms", "area_sqft", "status"],
    },
    "isp": {
        "collection": "biz_plans",
        "data_label": "Plans",
        "data_icon": "Wifi",
        "action_type": "ticket",
        "output_label": "Tickets",
        "fields": [
            {"key": "plan_name", "label": "Plan Name", "type": "text", "required": True},
            {"key": "speed", "label": "Speed", "type": "text", "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
            {"key": "data_limit", "label": "Data Limit", "type": "text", "required": False},
            {"key": "installation_fee", "label": "Installation Fee", "type": "number", "required": False},
            {"key": "coverage_area", "label": "Coverage Area", "type": "text", "required": False},
            {"key": "availability", "label": "Availability", "type": "select", "options": ["available", "unavailable"], "required": False, "default": "available"},
        ],
        "csv_headers": ["plan_name", "speed", "price", "currency", "data_limit", "installation_fee", "coverage_area", "availability"],
    },
    "telecom": {
        "collection": "biz_telecom_plans",
        "data_label": "Plans",
        "data_icon": "Smartphone",
        "action_type": "ticket",
        "output_label": "Tickets",
        "fields": [
            {"key": "plan_name", "label": "Plan Name", "type": "text", "required": True},
            {"key": "data", "label": "Data", "type": "text", "required": True},
            {"key": "calls", "label": "Calls", "type": "text", "required": False},
            {"key": "validity", "label": "Validity", "type": "text", "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
            {"key": "features", "label": "Features", "type": "textarea", "required": False},
        ],
        "csv_headers": ["plan_name", "data", "calls", "validity", "price", "currency", "features"],
    },
    "restaurant": {
        "collection": "biz_menu_items",
        "data_label": "Menu Items",
        "data_icon": "UtensilsCrossed",
        "action_type": "order",
        "output_label": "Orders",
        "fields": [
            {"key": "item_name", "label": "Item Name", "type": "text", "required": True},
            {"key": "category", "label": "Category", "type": "text", "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "description", "label": "Description", "type": "textarea", "required": False},
            {"key": "availability", "label": "Availability", "type": "select", "options": ["available", "unavailable"], "required": False, "default": "available"},
            {"key": "modifiers", "label": "Modifiers", "type": "text", "required": False},
        ],
        "csv_headers": ["item_name", "category", "price", "description", "availability", "modifiers"],
    },
    "service": {
        "collection": "biz_services",
        "data_label": "Services",
        "data_icon": "Scissors",
        "action_type": "booking",
        "output_label": "Bookings",
        "fields": [
            {"key": "service_name", "label": "Service Name", "type": "text", "required": True},
            {"key": "category", "label": "Category", "type": "text", "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "duration", "label": "Duration", "type": "text", "required": False},
            {"key": "staff", "label": "Staff", "type": "text", "required": False},
            {"key": "availability", "label": "Availability", "type": "select", "options": ["available", "unavailable"], "required": False, "default": "available"},
        ],
        "csv_headers": ["service_name", "category", "price", "duration", "staff", "availability"],
    },
    "vehicle": {
        "collection": "biz_vehicles",
        "data_label": "Vehicles",
        "data_icon": "Car",
        "action_type": "lead",
        "output_label": "Leads",
        "fields": [
            {"key": "name", "label": "Vehicle Name", "type": "text", "required": True},
            {"key": "brand", "label": "Brand", "type": "text", "required": True},
            {"key": "model", "label": "Model", "type": "text", "required": True},
            {"key": "year", "label": "Year", "type": "number", "required": False},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "mileage", "label": "Mileage", "type": "text", "required": False},
            {"key": "fuel_type", "label": "Fuel Type", "type": "select", "options": ["petrol", "diesel", "electric", "hybrid"], "required": False},
            {"key": "transmission", "label": "Transmission", "type": "select", "options": ["manual", "automatic"], "required": False},
            {"key": "availability", "label": "Availability", "type": "select", "options": ["available", "sold"], "required": False, "default": "available"},
        ],
        "csv_headers": ["name", "brand", "model", "year", "price", "mileage", "fuel_type", "transmission", "availability"],
    },
    "finance": {
        "collection": "biz_financial_products",
        "data_label": "Financial Products",
        "data_icon": "Landmark",
        "action_type": "lead",
        "output_label": "Leads",
        "fields": [
            {"key": "name", "label": "Product Name", "type": "text", "required": True},
            {"key": "type", "label": "Type", "type": "select", "options": ["loan", "insurance", "investment", "savings"], "required": True},
            {"key": "interest_rate", "label": "Interest Rate (%)", "type": "number", "required": False},
            {"key": "duration", "label": "Duration", "type": "text", "required": False},
            {"key": "min_amount", "label": "Min Amount", "type": "number", "required": False},
            {"key": "max_amount", "label": "Max Amount", "type": "number", "required": False},
            {"key": "eligibility", "label": "Eligibility", "type": "textarea", "required": False},
            {"key": "currency", "label": "Currency", "type": "text", "required": False, "default": "NPR"},
        ],
        "csv_headers": ["name", "type", "interest_rate", "duration", "min_amount", "max_amount", "eligibility", "currency"],
    },
    "events": {
        "collection": "biz_event_packages",
        "data_label": "Event Packages",
        "data_icon": "PartyPopper",
        "action_type": "booking",
        "output_label": "Bookings",
        "fields": [
            {"key": "name", "label": "Package Name", "type": "text", "required": True},
            {"key": "services_included", "label": "Services Included", "type": "textarea", "required": True},
            {"key": "price", "label": "Price", "type": "number", "required": True},
            {"key": "duration", "label": "Duration", "type": "text", "required": False},
            {"key": "availability_dates", "label": "Available Dates", "type": "text", "required": False},
        ],
        "csv_headers": ["name", "services_included", "price", "duration", "availability_dates"],
    },
    "education": {
        "collection": "biz_courses",
        "data_label": "Courses",
        "data_icon": "GraduationCap",
        "action_type": "lead",
        "output_label": "Leads",
        "fields": [
            {"key": "course_name", "label": "Course Name", "type": "text", "required": True},
            {"key": "duration", "label": "Duration", "type": "text", "required": True},
            {"key": "fees", "label": "Fees", "type": "number", "required": True},
            {"key": "eligibility", "label": "Eligibility", "type": "text", "required": False},
            {"key": "mode", "label": "Mode", "type": "select", "options": ["online", "offline", "hybrid"], "required": False},
            {"key": "start_dates", "label": "Start Dates", "type": "text", "required": False},
        ],
        "csv_headers": ["course_name", "duration", "fees", "eligibility", "mode", "start_dates"],
    },
    "healthcare": {
        "collection": "biz_healthcare",
        "data_label": "Doctors / Services",
        "data_icon": "Stethoscope",
        "action_type": "booking",
        "output_label": "Bookings",
        "fields": [
            {"key": "name", "label": "Name", "type": "text", "required": True},
            {"key": "specialization", "label": "Specialization", "type": "text", "required": True},
            {"key": "consultation_fee", "label": "Consultation Fee", "type": "number", "required": True},
            {"key": "availability", "label": "Availability", "type": "text", "required": False},
            {"key": "location", "label": "Location", "type": "text", "required": False},
        ],
        "csv_headers": ["name", "specialization", "consultation_fee", "availability", "location"],
    },
}


# Quick lookup helpers
def get_schema(business_type: str):
    return BUSINESS_TYPE_SCHEMAS.get(business_type)

def get_collection_name(business_type: str):
    schema = get_schema(business_type)
    return schema["collection"] if schema else None

def get_action_type(business_type: str):
    schema = get_schema(business_type)
    return schema["action_type"] if schema else None

def get_csv_headers(business_type: str):
    schema = get_schema(business_type)
    return schema["csv_headers"] if schema else []

ALL_BUSINESS_TYPES = list(BUSINESS_TYPE_SCHEMAS.keys())
