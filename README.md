# STADVDB-MCO2 - FlashSale E-Commerce Platform

![FlashSale Pro](https://img.shields.io/badge/Project-MCO2_System-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-green)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS-orange)

A modern flash sale e-commerce platform built for STADVDB MCO2 with transactional and analytical database operations.

## 🚀 Quick Start

### Prerequisites

- Web browser (Chrome, Firefox, Safari)
- (Optional) Visual Studio Code

### Running the Frontend

```bash
# Navigate to your project directory
cd stadvdb-mco2

# Open the frontend in browser
open frontend/index.html
```

### Alternative methods:

- Double-click `frontend/index.html` in Finder
- Use VSCode with Live Server extension
- Run `python3 -m http.server 8000` and `visit http://localhost:8000/frontend/`

### To populate data in DB:

* Alternatively, just use the data already in sample_data and olap_data.

- RUN "CREATE DATABASE <db_name>; USE <db_name>;" in mySQL workbench
- Run schema_oltp.sql in MySQL workbench. This is the main DB and replication and hot backup db.
- Right click each table in Navigator view and click Table Data Import Wizard
- Map the path to the right csv file in sample_data. Use existing data, and keep clicking Next. Data in the tables should be populated.
- Run schema_olap.sql in MySQL workbench
- Run etl.ipynb to transform oltp data to olap data in olap_data folder.
- Right click each new table in Navigator view and click Table Data Import Wizard
- Map the path to the right csv file in olap_data. Use existing data, and keep clicking Next. Data in the tables should be populated.

## 📁 Project Structure

```bash
stadvdb-mco2/
├── frontend/
│   ├── index.html          # Main application page
│   └── styles/
│       └── style.css       # All styling and responsive design
├── backend/                # (Future) API server implementation
├── database/               # (Future) Database schemas and replication
├── load-testing/           # (Future) JMeter test scripts
└── README.md               # Project documentation
```

## 🎯 Features Implemented

### Frontend (Completed)

- Modern E-commerce Design - Lazada/Shopee-inspired interface
- Responsive Layout - Works on desktop and mobile devices
- Flash Sale Section - Countdown timer and product grid
- Product Catalog - 6 sample products with pricing and inventory
- Analytics Dashboard - Placeholder for 3 OLAP reports
- User Interface - Search bar, categories, shopping cart

### Backend (Completed)

- OLTP Database - PostgreSQL for transactional operations
- OLAP Database - Data warehouse for analytical reporting
- API Endpoints - RESTful services for frontend integration
- Replication - Hot backup and data warehouse replication

## 🛠️ Technology Stack

### Current Implementation

- Frontend: HTML5, CSS3 (No JavaScript dependencies)
- Styling: Custom CSS with Flexbox and Grid
- Icons: Unicode emojis for cross-platform compatibility
- Backend: Node.js/Express
- Database: PostgreSQL (OLTP + OLAP)
- Replication: Physical & Logical replication
- Containerization: Docker & Docker Compose
- Load Testing: JMeter

## 📊 Database Schema Preview

### OLTP (Transactional Operations)

- `users` - User accounts and authentication
- `products` - Product catalog with inventory
- `flash_sales` - Flash sale events and timing
- `cart_items` - Shopping cart management
- `orders` & `order_items` - Order processing

### OLAP (Analytical Operations)

- Star schema for reporting
- Three main reports:

1. Top Selling Products - Sales performance ranking
2. Category Performance - Sales by product category
3. Flash Sale Analytics - Flash sale effectiveness metrics

## 🎨 Frontend Design

The interface features:

- Color Scheme: Red/pink gradient (Shopee-inspired)
- Layout: Responsive grid system
- Components: Product cards, countdown timer, analytics dashboard
- Navigation: Category bar, search functionality, user actions
- Mobile-Friendly: Responsive design for all screen sizes

## 🔧 Development Status

- ✅ Frontend Design - Completed
- ✅ Responsive Layout - Completed
- ✅ Backend API - Completed
- ✅ Database Setup - Completed
- ✅ Replication - Completed
- ✅ Load Testing - Completed

## 👥 Team Members

Course: STADVDB MCO2 - Database Systems
Repository: `https://github.com/markcelemen/stadvdb-mco2.git`  

## 📞 Support

For technical issues or questions:

1. Check browser console for errors (F12)
2. Verify file paths are correct
3. Ensure all files are in the proper directory structure
