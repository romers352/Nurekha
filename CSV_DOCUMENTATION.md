# CSV Upload & Template Documentation

## Overview
This system supports **CSV bulk upload** and **template download** for all **13 business types**. Each business type has a unique data structure optimized for its specific use case.

---

## How to Use CSV Upload

### Step 1: Download Template
1. Navigate to your Agent Dashboard
2. Click on the data page (e.g., "Products" for E-commerce, "Rooms" for Hotel)
3. Click **"Download Template"** button
4. This downloads a CSV file with correct headers and sample data

### Step 2: Fill Your Data
- Open the CSV file in Excel, Google Sheets, or any spreadsheet editor
- Fill in your data rows (delete the sample row)
- **Keep the header row exactly as is**
- Save as CSV format

### Step 3: Upload
1. Click **"CSV Upload"** button
2. Select your filled CSV file
3. Review parsed data preview
4. Click **"Upload X items"** to import

---

## All 13 Business Types - CSV Templates

### 1. **E-commerce** (Products)
**Collection:** `biz_products`  
**CSV Headers:**
```csv
product_name,sku,description,category,brand,price,discount_price,currency,stock_quantity,availability,weight,tags
```

**Sample Data:**
```csv
product_name,sku,description,category,brand,price,discount_price,currency,stock_quantity,availability,weight,tags
"Wireless Mouse","SKU-MOUSE-001","Ergonomic wireless mouse with long battery life","Electronics","TechBrand",1200,999,"NPR",50,"in_stock","150g","wireless,mouse,tech"
"Coffee Mug","SKU-MUG-002","Ceramic coffee mug 350ml","Home & Kitchen","HomeWare",300,,"NPR",100,"in_stock","200g","mug,kitchen"
```

---

### 2. **Hotel** (Rooms)
**Collection:** `biz_rooms`  
**CSV Headers:**
```csv
room_type,price_per_night,currency,max_occupancy,available_rooms,amenities,availability_status
```

**Sample Data:**
```csv
room_type,price_per_night,currency,max_occupancy,available_rooms,amenities,availability_status
"Deluxe Suite",8000,"NPR",3,5,"WiFi, TV, Mini Bar, Balcony","available"
"Standard Room",3500,"NPR",2,10,"WiFi, TV","available"
"Presidential Suite",25000,"NPR",4,1,"WiFi, TV, Mini Bar, Balcony, Jacuzzi, Kitchen","available"
```

---

### 3. **Travel** (Packages)
**Collection:** `biz_packages`  
**CSV Headers:**
```csv
package_name,destination,duration_days,price,currency,available_seats,start_dates,inclusions,exclusions
```

**Sample Data:**
```csv
package_name,destination,duration_days,price,currency,available_seats,start_dates,inclusions,exclusions
"Everest Base Camp Trek",Everest,14,75000,"NPR",20,"2025-03-15, 2025-04-10","Accommodation, Meals, Guide, Permits","Flights, Personal Expenses"
"Pokhara Weekend Getaway",Pokhara,3,15000,"NPR",50,"Every Friday","Hotel, Breakfast, Sightseeing","Lunch, Dinner"
```

---

### 4. **Real Estate** (Properties)
**Collection:** `biz_properties`  
**CSV Headers:**
```csv
title,type,price,currency,location,bedrooms,bathrooms,area_sqft,status
```

**Sample Data:**
```csv
title,type,price,currency,location,bedrooms,bathrooms,area_sqft,status
"Luxury Apartment in Kathmandu","sale",12000000,"NPR","Baneshwor",3,2,1500,"available"
"Commercial Space","rent",80000,"NPR","Thamel",0,2,2000,"available"
"Villa with Garden","sale",35000000,"NPR","Budhanilkantha",5,4,3500,"available"
```

---

### 5. **ISP** (Plans)
**Collection:** `biz_plans`  
**CSV Headers:**
```csv
plan_name,speed,price,currency,data_limit,installation_fee,coverage_area,availability
```

**Sample Data:**
```csv
plan_name,speed,price,currency,data_limit,installation_fee,coverage_area,availability
"Basic Plan","25 Mbps",800,"NPR","Unlimited",1000,"Kathmandu Valley","available"
"Premium Plan","100 Mbps",1500,"NPR","Unlimited",1500,"Kathmandu Valley","available"
"Business Plan","200 Mbps",3500,"NPR","Unlimited",2000,"Nationwide","available"
```

---

### 6. **Telecom** (Plans)
**Collection:** `biz_telecom_plans`  
**CSV Headers:**
```csv
plan_name,data,calls,validity,price,currency,features
```

**Sample Data:**
```csv
plan_name,data,calls,validity,price,currency,features
"Starter Pack","2 GB","100 mins","30 days",200,"NPR","Free SMS"
"Unlimited Premium","Unlimited","Unlimited","30 days",999,"NPR","5G Access, Free Roaming"
"Data Booster","50 GB","No calls","7 days",500,"NPR","High Speed Data"
```

---

### 7. **Restaurant** (Menu Items)
**Collection:** `biz_menu_items`  
**CSV Headers:**
```csv
item_name,category,price,description,availability,modifiers
```

**Sample Data:**
```csv
item_name,category,price,description,availability,modifiers
"Chicken Momo","Appetizer",150,"Steamed chicken dumplings (10 pcs)","available","Spicy, Non-Spicy"
"Dal Bhat Tarkari","Main Course",250,"Traditional Nepali meal with rice, lentils and vegetables","available","Veg, Non-Veg"
"Chocolate Cake","Dessert",180,"Rich chocolate cake slice","available","With Ice Cream"
```

---

### 8. **Service** (Salon/Spa Services)
**Collection:** `biz_services`  
**CSV Headers:**
```csv
service_name,category,price,duration,staff,availability
```

**Sample Data:**
```csv
service_name,category,price,duration,staff,availability
"Haircut Men","Grooming",500,"30 mins","Raj, Sunil","available"
"Full Body Massage","Spa",2500,"90 mins","Maya, Sita","available"
"Facial Treatment","Skincare",1800,"60 mins","Priya","available"
```

---

### 9. **Vehicle** (Vehicles for Sale)
**Collection:** `biz_vehicles`  
**CSV Headers:**
```csv
name,brand,model,year,price,mileage,fuel_type,transmission,availability
```

**Sample Data:**
```csv
name,brand,model,year,price,mileage,fuel_type,transmission,availability
"Honda City 2020","Honda","City",2020,3200000,"15 kmpl","petrol","automatic","available"
"Bajaj Pulsar","Bajaj","Pulsar 220",2021,250000,"40 kmpl","petrol","manual","available"
"Tesla Model 3","Tesla","Model 3",2023,8500000,"500 km/charge","electric","automatic","available"
```

---

### 10. **Finance** (Financial Products)
**Collection:** `biz_financial_products`  
**CSV Headers:**
```csv
name,type,interest_rate,duration,min_amount,max_amount,eligibility,currency
```

**Sample Data:**
```csv
name,type,interest_rate,duration,min_amount,max_amount,eligibility,currency
"Home Loan","loan",9.5,"20 years",500000,50000000,"Salaried/Self-Employed","NPR"
"Term Insurance","insurance",0,"30 years",10000,10000000,"Age 18-65","NPR"
"Fixed Deposit","savings",7.5,"1-5 years",10000,10000000,"All","NPR"
```

---

### 11. **Events** (Event Packages)
**Collection:** `biz_event_packages`  
**CSV Headers:**
```csv
name,services_included,price,duration,availability_dates
```

**Sample Data:**
```csv
name,services_included,price,duration,availability_dates
"Wedding Package","Venue, Decoration, Catering (100 pax), Photography",500000,"Full Day","Weekends Only"
"Birthday Party","Venue, Decoration, Cake, DJ",75000,"4 hours","All Days"
"Corporate Event","Conference Hall, AV Equipment, Catering (50 pax)",150000,"Half Day","Weekdays"
```

---

### 12. **Education** (Courses)
**Collection:** `biz_courses`  
**CSV Headers:**
```csv
course_name,duration,fees,eligibility,mode,start_dates
```

**Sample Data:**
```csv
course_name,duration,fees,eligibility,mode,start_dates
"Web Development Bootcamp","3 months",50000,"10+2 Pass","online","Every Month 1st"
"Digital Marketing","6 weeks",25000,"Graduate","hybrid","15 Apr, 1 May"
"Data Science Masters","2 years",800000,"Bachelor's Degree","offline","Aug 2025"
```

---

### 13. **Healthcare** (Doctors / Services)
**Collection:** `biz_healthcare`  
**CSV Headers:**
```csv
name,specialization,consultation_fee,availability,location
```

**Sample Data:**
```csv
name,specialization,consultation_fee,availability,location
"Dr. Ram Sharma","Cardiologist",1500,"Mon-Fri 9AM-5PM","Kathmandu"
"Dr. Sita Thapa","Dermatologist",1200,"Mon, Wed, Fri 10AM-4PM","Lalitpur"
"Dr. Krishna Poudel","General Physician",800,"Daily 8AM-8PM","Bhaktapur"
```

---

## Important Notes

### Data Type Handling
- **Text fields**: Can contain any text. Use quotes if text contains commas
- **Number fields**: Must be numeric values (integers or decimals)
- **Select fields**: Must match one of the predefined options exactly
- **Currency**: Default is NPR if left blank

### Required Fields
Each business type has required fields that must be filled:
- **E-commerce**: product_name, sku, price, stock_quantity
- **Hotel**: room_type, price_per_night, max_occupancy, available_rooms
- **Travel**: package_name, destination, duration_days, price
- **Real Estate**: title, type, price, location
- **ISP**: plan_name, speed, price
- **Telecom**: plan_name, data, validity, price
- **Restaurant**: item_name, category, price
- **Service**: service_name, category, price
- **Vehicle**: name, brand, model, price
- **Finance**: name, type
- **Events**: name, services_included, price
- **Education**: course_name, duration, fees
- **Healthcare**: name, specialization, consultation_fee

### Best Practices
1. **No empty headers**: Keep all column headers in the CSV
2. **Consistent formatting**: Use the same format for similar data (e.g., dates, currency)
3. **Test with small batch**: Upload 2-3 rows first to verify format
4. **Backup before bulk delete**: Download current data before deleting
5. **UTF-8 encoding**: Save CSV in UTF-8 format to avoid character issues

---

## API Endpoints (For Developers)

### Download Template
```
GET /api/agents/{agent_id}/business-data/csv-template
```

### Bulk Upload
```
POST /api/agents/{agent_id}/business-data/bulk
Body: { "items": [{...}, {...}] }
```

### Get Business Type Schema
```
GET /api/business-types/{business_type}/schema
```

---

## Troubleshooting

### Upload Failed?
- **Check headers**: Ensure CSV headers match exactly
- **Data types**: Verify numbers are not in quotes, text fields are properly escaped
- **Required fields**: Fill all required fields for each row
- **File encoding**: Save as UTF-8 CSV

### Missing Columns?
- Download template again and compare headers
- Don't remove or rename any column

### Data Not Showing?
- Refresh the page
- Check if upload was successful (green success message)
- Verify agent business type matches the data you're uploading

---

## Support
For issues or questions, contact support or check the application logs in the Admin Panel.

---

*Last Updated: April 2026*
