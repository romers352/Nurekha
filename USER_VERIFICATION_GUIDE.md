# 13 Business Types System - User Verification Guide

## 🎯 What to Test

This guide helps you verify that all 13 business types are working correctly with dynamic forms, CSV upload/download, and data management.

---

## ✅ Test Checklist

### Phase 1: Agent Creation & Dynamic Sidebar

#### Test 1.1: Create Agents for Different Business Types
1. **Login** with admin@nurekha.com / Admin@123
2. **Navigate** to Agents page
3. **Create agents** for at least 3-4 different business types:
   - E-commerce (Products → Orders)
   - Hotel (Rooms → Bookings)
   - ISP (Plans → Tickets)
   - Real Estate (Properties → Leads)
   - Restaurant (Menu Items → Orders)
   - Healthcare (Doctors → Bookings)

**Expected Result:**
- Each agent appears immediately in the agents list
- Agent card shows correct business type label

---

#### Test 1.2: Verify Dynamic Sidebars
1. **Click on each agent** to open Agent Dashboard
2. **Check sidebar items** match business type:
   - ✓ E-commerce shows: Overview, Products, Orders, Refunds
   - ✓ Hotel shows: Overview, Rooms, Bookings
   - ✓ ISP shows: Overview, Plans, Tickets
   - ✓ Real Estate shows: Overview, Properties, Leads
   - ✓ Restaurant shows: Overview, Menu Items, Orders
   - ✓ Healthcare shows: Overview, Doctors, Bookings

**Expected Result:**
- Sidebar adapts based on agent's business type
- Icons and labels are correct

---

### Phase 2: Data Management (CRUD Operations)

#### Test 2.1: Single Item Creation
For **each business type agent** you created:

1. **Click on the data page** (e.g., "Products", "Rooms", "Plans")
2. **Click "Add" button**
3. **Fill the form** with sample data
   - Note: Required fields are marked with *
4. **Click "Add" / "Save"**

**Expected Result:**
- Form fields match business type schema
- Item appears in the table immediately
- No page refresh needed

---

#### Test 2.2: Edit & Delete
1. **Click Edit icon** (pencil) on any item
2. **Modify a field**
3. **Click "Update"**
4. **Click Delete icon** (trash) on another item

**Expected Result:**
- Edit form pre-fills with current data
- Updates reflect immediately
- Delete removes item from list

---

### Phase 3: CSV Upload & Template Download

#### Test 3.1: Download CSV Templates
For **3-4 different business types**:

1. **Open agent's data page**
2. **Click "Download Template"** button
3. **Open downloaded CSV file**

**Expected Result:**
- CSV downloads with filename like `ecommerce_template.csv`, `hotel_template.csv`
- First row contains column headers
- Second row contains sample data
- Headers match the business type (refer to `/app/CSV_DOCUMENTATION.md`)

**Examples to verify:**
- E-commerce: `product_name,sku,description,category,brand,price...`
- Hotel: `room_type,price_per_night,currency,max_occupancy...`
- ISP: `plan_name,speed,price,currency,data_limit...`

---

#### Test 3.2: CSV Bulk Upload
For **2-3 business types**:

1. **Use downloaded template** or create a new CSV with correct headers
2. **Add 3-5 data rows** (you can use samples from `/app/CSV_DOCUMENTATION.md`)
3. **Click "CSV Upload"** button
4. **Select your CSV file**
5. **Review parsed data** in the preview table
6. **Click "Upload X items"**

**Expected Result:**
- CSV parsing shows data preview
- Shows "Uploaded X items!" success message
- All items appear in the data table
- Green success indicator appears

**Sample Test Data:**

**E-commerce CSV:**
```csv
product_name,sku,description,category,brand,price,discount_price,currency,stock_quantity,availability,weight,tags
Wireless Mouse,SKU-001,Ergonomic mouse,Electronics,TechBrand,1200,999,NPR,50,in_stock,150g,wireless
Coffee Mug,SKU-002,Ceramic mug,Kitchen,HomeWare,300,,NPR,100,in_stock,200g,mug
```

**Hotel CSV:**
```csv
room_type,price_per_night,currency,max_occupancy,available_rooms,amenities,availability_status
Deluxe Suite,8000,NPR,3,5,WiFi TV Mini Bar,available
Standard Room,3500,NPR,2,10,WiFi TV,available
```

**ISP CSV:**
```csv
plan_name,speed,price,currency,data_limit,installation_fee,coverage_area,availability
Basic Plan,25 Mbps,800,NPR,Unlimited,1000,Kathmandu,available
Premium Plan,100 Mbps,1500,NPR,Unlimited,1500,Kathmandu,available
```

---

### Phase 4: Output Pages (Orders, Bookings, Leads, Tickets)

#### Test 4.1: E-commerce - Orders & Refunds
1. **Open E-commerce agent**
2. **Click "Orders"** in sidebar
3. **Check if existing orders appear** (may be empty)
4. **Click "Refunds"** in sidebar
5. **Verify refunds page loads**

**Expected Result:**
- Orders page shows table with columns: Order ID, Customer, Items, Amount, Status
- Refunds page shows refund history

---

#### Test 4.2: Real Estate / Vehicle / Finance / Education - Leads
1. **Open any agent** with business type: real_estate, vehicle, finance, or education
2. **Click "Leads"** in sidebar
3. **Click "Add Lead"** button
4. **Fill form** (customer_name, phone, email, property/product interest, notes)
5. **Submit**

**Expected Result:**
- Lead creation form appears
- Lead appears in table
- Status can be updated (new → contacted → qualified → converted)

---

#### Test 4.3: ISP / Telecom - Customer Tickets
1. **Open ISP or Telecom agent**
2. **Click "Tickets"** in sidebar
3. **Click "Add Ticket"** button
4. **Fill form** (customer_name, issue, priority)
5. **Submit**

**Expected Result:**
- Ticket creation form appears
- Ticket appears in table
- Status can be updated (open → in_progress → resolved)

---

#### Test 4.4: Hotel / Travel / Service / Events / Healthcare - Bookings
1. **Open any agent** with business type: hotel, travel, service, events, or healthcare
2. **Click "Bookings"** in sidebar
3. **Verify bookings page loads**

**Expected Result:**
- Bookings table displays
- Shows booking details (customer, dates, status, amount)

---

### Phase 5: Edge Cases & Validation

#### Test 5.1: Required Fields Validation
1. **Open any data form**
2. **Try to submit without filling required fields** (marked with *)
3. **Browser should show validation error**

---

#### Test 5.2: CSV Upload - Invalid Data
1. **Create a CSV with:**
   - Wrong headers
   - Missing required columns
   - Invalid data types (text in number field)
2. **Try uploading**

**Expected Result:**
- System should handle gracefully
- Show error message if validation fails

---

#### Test 5.3: Bulk Selection & Delete
1. **Go to any data page with multiple items**
2. **Click checkboxes** to select 2-3 items
3. **Click "Delete X selected"** button
4. **Confirm deletion**

**Expected Result:**
- Selected items are deleted
- Table updates immediately

---

#### Test 5.4: Search Functionality
1. **Go to any data page with items**
2. **Type in search box** (e.g., search for product name, room type)

**Expected Result:**
- Table filters to show matching items only
- Updates as you type

---

## 📋 All 13 Business Types Quick Reference

| # | Business Type | Data Label | Output Label | Action Type |
|---|---------------|------------|--------------|-------------|
| 1 | ecommerce | Products | Orders | order |
| 2 | hotel | Rooms | Bookings | booking |
| 3 | travel | Packages | Bookings | booking |
| 4 | real_estate | Properties | Leads | lead |
| 5 | isp | Plans | Tickets | ticket |
| 6 | telecom | Plans | Tickets | ticket |
| 7 | restaurant | Menu Items | Orders | order |
| 8 | service | Services | Bookings | booking |
| 9 | vehicle | Vehicles | Leads | lead |
| 10 | finance | Financial Products | Leads | lead |
| 11 | events | Event Packages | Bookings | booking |
| 12 | education | Courses | Leads | lead |
| 13 | healthcare | Doctors / Services | Bookings | booking |

---

## 🐛 Known Issues to Check

### Issue 1: CSV Upload Not Working
**Symptoms:**
- Upload button disabled
- No data parsing preview

**Things to verify:**
- CSV file format is correct
- Headers match exactly (case-sensitive)
- File encoding is UTF-8

---

### Issue 2: Items Not Appearing After Creation
**Symptoms:**
- Form submits but table doesn't update
- Need to refresh page to see new items

**Things to verify:**
- Check browser console for errors
- Verify API response is 200 OK
- Check backend logs: `tail -f /var/log/supervisor/backend.out.log`

---

### Issue 3: Wrong Sidebar Items for Business Type
**Symptoms:**
- E-commerce agent showing Hotel sidebar
- Mismatch between business type and displayed options

**Things to verify:**
- Agent's business_type field in database
- Frontend businessTypes.js configuration

---

## 📊 Testing Summary Template

After completing all tests, fill this summary:

```
✅ Agent Creation & Dynamic Sidebar
   - Created agents: [list business types]
   - Sidebar correctly adapts: YES / NO
   - Issues found: [describe if any]

✅ Single CRUD Operations
   - Tested business types: [list]
   - Add/Edit/Delete working: YES / NO
   - Issues found: [describe if any]

✅ CSV Upload/Download
   - Template download tested for: [list business types]
   - CSV upload tested for: [list business types]
   - Sample data uploaded successfully: YES / NO
   - Issues found: [describe if any]

✅ Output Pages
   - Orders tested: YES / NO
   - Bookings tested: YES / NO
   - Leads tested: YES / NO
   - Tickets tested: YES / NO
   - Issues found: [describe if any]

✅ Edge Cases
   - Validation working: YES / NO
   - Bulk delete working: YES / NO
   - Search filtering working: YES / NO
   - Issues found: [describe if any]
```

---

## 🔧 If You Find Issues

1. **Note the exact steps** to reproduce
2. **Take a screenshot** of the error
3. **Check browser console** (F12 → Console tab)
4. **Check backend logs:**
   ```bash
   tail -100 /var/log/supervisor/backend.err.log
   ```
5. **Report with:**
   - Business type affected
   - Exact error message
   - What you expected vs what happened

---

## ✨ Success Criteria

The system is working correctly if:
- ✅ All 13 business types can be created as agents
- ✅ Each business type shows correct sidebar navigation
- ✅ Data forms render correct fields for each type
- ✅ CSV templates download with correct headers
- ✅ CSV bulk upload processes and inserts data
- ✅ Single CRUD operations (Create/Read/Update/Delete) work
- ✅ Output pages (Orders/Bookings/Leads/Tickets) are accessible
- ✅ Search and bulk selection features function properly

---

**Need Help?** Refer to `/app/CSV_DOCUMENTATION.md` for detailed CSV format examples for all 13 business types.

*Last Updated: April 2026*
