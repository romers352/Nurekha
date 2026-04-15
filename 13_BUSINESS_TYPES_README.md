# 13 Business Types - Dynamic AI Customer Service Platform

## 🎯 Overview

This platform supports **13 different business types** with fully dynamic data management, CSV bulk operations, and AI-ready input/output schemas. Each business type has:

- ✅ **Custom data structures** (input fields tailored to business needs)
- ✅ **Dynamic UI forms** (auto-generated based on schemas)
- ✅ **CSV bulk upload/download** (with pre-configured templates)
- ✅ **Output tracking** (orders, bookings, leads, tickets based on business type)
- ✅ **n8n integration ready** (shared database for AI processing)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `/app/CSV_DOCUMENTATION.md` | Complete CSV format guide for all 13 business types with sample data |
| `/app/USER_VERIFICATION_GUIDE.md` | Step-by-step testing checklist to verify all features |
| `/app/13_BUSINESS_TYPES_README.md` | This file - quick reference and system overview |
| `/app/sample_csv/` | Sample CSV files for 6 business types (ecommerce, hotel, ISP, restaurant, real estate, healthcare) |

---

## 🏗️ System Architecture

### Backend
- **File:** `/app/backend/schemas.py` - Central schema definitions for 13 business types
- **File:** `/app/backend/server.py` - Generic CRUD APIs and CSV endpoints
- **Collections:** `biz_products`, `biz_rooms`, `biz_plans`, etc. (one per business type)

**Key Endpoints:**
```
GET  /api/business-types                      → List all 13 business types
GET  /api/business-types/{type}/schema        → Get schema for specific type
GET  /api/agents/{id}/business-data           → Fetch all data items
POST /api/agents/{id}/business-data           → Create single item
PUT  /api/agents/{id}/business-data/{item_id} → Update item
DELETE /api/agents/{id}/business-data/{item_id} → Delete item
POST /api/agents/{id}/business-data/bulk      → Bulk upload from CSV
GET  /api/agents/{id}/business-data/csv-template → Download CSV template
```

### Frontend
- **Config:** `/app/frontend/src/config/businessTypes.js` - Maps business types to UI elements
- **Page:** `/app/frontend/src/pages/agent/AgentDataPage.jsx` - Generic dynamic data management page
- **Component:** `/app/frontend/src/components/agent/AgentSidebar.jsx` - Dynamic sidebar navigation

---

## 📊 The 13 Business Types

| # | Type | Input Data | Output Action | Sidebar Shows |
|---|------|------------|---------------|---------------|
| 1 | **ecommerce** | Products | Orders, Refunds | Products, Orders, Refunds |
| 2 | **hotel** | Rooms | Bookings | Rooms, Bookings |
| 3 | **travel** | Packages | Bookings | Packages, Bookings |
| 4 | **real_estate** | Properties | Leads | Properties, Leads |
| 5 | **isp** | Plans | Tickets | Plans, Tickets |
| 6 | **telecom** | Plans | Tickets | Plans, Tickets |
| 7 | **restaurant** | Menu Items | Orders | Menu Items, Orders |
| 8 | **service** | Services | Bookings | Services, Bookings |
| 9 | **vehicle** | Vehicles | Leads | Vehicles, Leads |
| 10 | **finance** | Financial Products | Leads | Products, Leads |
| 11 | **events** | Event Packages | Bookings | Packages, Bookings |
| 12 | **education** | Courses | Leads | Courses, Leads |
| 13 | **healthcare** | Doctors/Services | Bookings | Doctors, Bookings |

---

## 🚀 Quick Start Guide

### For End Users

1. **Login** → admin@nurekha.com / Admin@123
2. **Create Agent** → Select business type from dropdown
3. **Navigate** → Click agent card to open dashboard
4. **Add Data:**
   - **Manual:** Click "Add" button, fill form, save
   - **Bulk CSV:** Click "Download Template" → Fill CSV → "CSV Upload" → Select file → Upload

### For Developers

1. **Add new business type:**
   - Update `/app/backend/schemas.py` (add schema definition)
   - Update `/app/frontend/src/config/businessTypes.js` (add UI config)
   - Restart backend: `sudo supervisorctl restart backend`

2. **Test CSV functionality:**
   ```bash
   # Use sample files
   cat /app/sample_csv/ecommerce_sample.csv
   cat /app/sample_csv/hotel_sample.csv
   ```

3. **Check API:**
   ```bash
   API_URL=https://api-fixes-ui.preview.emergentagent.com
   curl -X GET "$API_URL/api/business-types"
   ```

---

## 🔄 n8n Integration Flow

As per user requirements, the system works as follows:

```
┌──────────────┐
│ User adds    │
│ data here    │ ──→ MongoDB (shared database)
└──────────────┘
                     ↕
                 ┌───────┐
                 │  n8n  │ (fetches data, processes with AI)
                 └───────┘
                     ↕
              MongoDB (updates orders/bookings/leads)
                     ↕
┌──────────────┐
│ User views   │
│ outputs here │ ←── MongoDB (instant updates)
└──────────────┘
```

**No webhook integration needed** - both systems read/write to the same MongoDB collections.

---

## ✅ Testing Status

**Backend:** 18/18 tests passed ✓
- Generic CRUD operations tested
- CSV bulk upload tested
- CSV template generation tested
- All 13 business types validated

**Frontend:** Implemented and ready for user verification
- Dynamic forms working
- CSV upload UI complete
- Template download functional

**User Verification:** PENDING
- Use `/app/USER_VERIFICATION_GUIDE.md` for step-by-step testing

---

## 📁 Sample CSV Files Location

Ready-to-use sample CSV files with correct format:

```
/app/sample_csv/
├── ecommerce_sample.csv
├── hotel_sample.csv
├── isp_sample.csv
├── restaurant_sample.csv
├── real_estate_sample.csv
└── healthcare_sample.csv
```

**How to use:**
1. Download one of these files
2. Open in Excel/Google Sheets
3. Modify data as needed
4. Upload via "CSV Upload" button in the UI

---

## 🐛 Known Issues & Fixes

### No issues reported
System is functioning as expected based on testing agent results.

---

## 📞 Support

For questions or issues:
1. Check documentation files in `/app/`
2. Review backend logs: `tail -f /var/log/supervisor/backend.out.log`
3. Check frontend console (F12 in browser)
4. Refer to `/app/test_result.md` for latest test status

---

## 🔮 Future Enhancements

Potential improvements for future iterations:
- [ ] Mobile responsiveness optimization for complex forms
- [ ] Advanced CSV validation with detailed error reporting
- [ ] Bulk edit functionality
- [ ] Data export in multiple formats (Excel, JSON)
- [ ] Import/export entire agent data with one click
- [ ] Advanced filtering and sorting on data tables
- [ ] Code refactoring: Split server.py into modular routers

---

## 📜 Version History

**v2.0 - April 2026**
- Implemented all 13 business types
- Added generic CRUD system
- CSV bulk upload/download
- Dynamic UI rendering
- n8n-ready architecture

---

*Built with React, FastAPI, and MongoDB*  
*Powered by Emergent AI Platform*
