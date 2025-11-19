# STADVDB-MCO2

# FlashSale Pro - E-Commerce Platform

![FlashSale Pro](https://img.shields.io/badge/Project-MCO2_System-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-green)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS-orange)

A comprehensive flash sale e-commerce platform with transactional and analytical database operations, built for the MCO2 Database Systems project.

## 🚀 Project Overview

This system implements a flash sale e-commerce platform with:

- **OLTP Database** for transactional operations (inventory management, order processing)
- **OLAP Database** for analytical reporting and visualizations
- **Hot Backup Server** with physical replication
- **Data Warehouse** for reporting with logical replication

## 📋 Project Requirements

### Transactional Operations

- Batch updates and race condition handling
- Deadlock avoidance strategies
- Optimized database schema for high-concurrency operations
- Flash sale inventory management

### Analytical Operations

- Real-time and historical reporting
- Three main visualizations:
  1. Top 10 Selling Products
  2. Sales by Product Category
  3. Flash Sale Performance Analytics

### Database Architecture

- Primary OLTP Database (PostgreSQL)
- Hot Backup Server (Physical Replication)
- Reports & Visualizations Server (OLAP - Data Warehouse)

## 🏗️ System Architecture

┌─────────────────┐ ┌──────────────────┐ ┌────────────────────┐
│ Frontend │ │ Primary DB │ │ Hot Backup │
│ (HTML/CSS) │◄──►│ (OLTP) │◄──►│ (Physical │
│ │ │ │ │ Replication) │
└─────────────────┘ └──────────────────┘ └────────────────────┘
│
▼
┌──────────────────┐
│ Data Warehouse │
│ (OLAP) │
│ Logical │
│ Replication │
└──────────────────┘

## 📁 Project Structure

flashsale-pro/
├── frontend/
│ ├── index.html # Main frontend page
│ ├── styles/ # CSS stylesheets
│ └── images/ # Static images
├── backend/ # (To be implemented)
│ ├── api/ # REST API endpoints
│ ├── models/ # Database models
│ └── services/ # Business logic
├── database/
│ ├── oltp/ # OLTP schema and migrations
│ ├── olap/ # OLAP schema and ETL
│ └── replication/ # Replication configuration
├── docker-compose.yml # Docker orchestration
├── load-testing/ # JMeter test scripts
└── README.md # This file

## 🛠️ Technologies Used

### Frontend

- **HTML5** - Structure and semantics
- **CSS3** - Styling and responsive design
- **JavaScript** - Client-side interactions (placeholder)

### Backend (To be implemented)

- **Node.js/Express** or **Python/FastAPI** - API server
- **PostgreSQL** - Primary database (OLTP)
- **PostgreSQL** - Data warehouse (OLAP)

### Infrastructure

- **Docker** - Containerization
- **Docker Compose** - Service orchestration
- **JMeter** - Load testing

## 🗄️ Database Schema

### OLTP Database (Transactional)

```sql
-- Core Tables
users (user_id, name, email, password, role)
products (product_id, seller_id, name, category, price, original_price, discount_rate, quantity_stock, flash_sale_id)
flash_sales (flash_sale_id, start_time, end_time)
cart_items (cart_item_id, user_id, product_id, quantity_added)
orders (order_id, user_id, total_amount, status, created_at)
order_items (order_item_id, order_id, product_id, quantity_sold, price_at_sale)
```
