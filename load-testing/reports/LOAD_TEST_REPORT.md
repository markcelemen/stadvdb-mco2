# Load Test Report - FlashSale E-Commerce Platform

## Project Information
- **Course:** STADVDB MCO2
- **Date:** November 27, 2025
- **Tester:** JV Torres
- **Repository:** https://github.com/markcelemen/stadvdb-mco2

---

## 1. Test Environment

### Hardware
- **Machine:** ROG ZEPHYRUS M16 GU604VI_GU604VI
- **RAM:** 16GB
- **CPU:** 13th Gen Intel(R) Core(TM) i9-13900H   2.60 GHz

### Software
- **OS:** Windows 11
- **JMeter Version:** 5.6.3
- **Node.js Version:** [version]
- **Database:** MySQL

### Server Configuration
- **Server:** localhost
- **Port:** 3000

---

## 2. Test Scenarios

### Scenario 1: General Load Test
- **Description:** Simulate normal user behavior (browse, add to cart, order)
- **Users:** 50 concurrent users
- **Ramp-up:** 10 seconds
- **Loops:** 5 per user
- **Total Requests:** 250 per endpoint

### Scenario 2: Race Condition Test - Low Stock Product
- **Description:** 30 users simultaneously try to buy a product with only 4 in stock
- **Product ID:** 45 (Lenovo ThinkPad)
- **Initial Stock:** 4 units
- **Users:** 30 concurrent users
- **Ramp-up:** 1 second (almost simultaneous)
- **Expected:** Only 4 orders succeed, 26 fail with "insufficient stock"

### Scenario 3: Flash Sale Race Condition Test
- **Description:** 50 users simultaneously try to buy a flash sale product with 11 in stock
- **Product ID:** 160 (Instant Pot)
- **Initial Stock:** 11 units
- **Users:** 50 concurrent users
- **Ramp-up:** 2 seconds
- **Expected:** Only 11 orders succeed, 39 fail with "insufficient stock"

---

## 3. Test Results

### 3.1 General Load Test Results

| Endpoint | Samples | Average (ms) | Min (ms) | Max (ms) | Error % | Throughput |
|----------|---------|--------------|----------|----------|---------|------------|
| GET - All Products | | | | | | |
| POST - Add to Cart | | | | | | |
| POST - Place Order | | | | | | |
| GET - User Orders | | | | | | |

### 3.2 Race Condition Test Results (30 Users vs 4 Stock)

| Metric | Value |
|--------|-------|
| Total Order Attempts | 30 |
| Successful Orders (HTTP 201) | |
| Failed Orders (HTTP 400) | |
| Initial Stock | 4 |
| Final Stock (verify in DB) | |
| Stock went negative? | YES / NO |

### 3.3 Flash Sale Race Condition Results (50 Users vs 11 Stock)

| Metric | Value |
|--------|-------|
| Total Order Attempts | 50 |
| Successful Orders (HTTP 201) | |
| Failed Orders (HTTP 400) | |
| Initial Stock | 11 |
| Final Stock (verify in DB) | |
| Stock went negative?  | YES / NO |

---

## 4. Race Condition Analysis

### Did the system correctly handle race conditions?
- [ ] YES - Stock never went negative
- [ ] NO - Overselling occurred

### Deadlock Prevention Measures in Code:
1. FOR UPDATE clause used in SELECT queries (locks rows)
2. Transaction with BEGIN and COMMIT/ROLLBACK
3. Stock validation before order creation

---

## 5. Performance Analysis

### Response Time Assessment
- [ ] Excellent (< 200ms average)
- [ ] Good (200-500ms average)
- [ ] Acceptable (500ms - 1s average)
- [ ] Poor (> 1s average)

### Throughput Assessment
- Requests per second: ____

### Bottlenecks Identified:
1. [List any slow endpoints]
2. [List any timeout issues]

---

## 6. Screenshots

### 6. 1 JMeter - General Load Test Summary Report
[INSERT SCREENSHOT]

### 6.2 JMeter - Race Condition Test Results
[INSERT SCREENSHOT]

### 6.3 JMeter - Flash Sale Test Results
[INSERT SCREENSHOT]

### 6.4 Database Verification - Stock Levels After Test
[INSERT SCREENSHOT showing stock did not go negative]

---

## 7. Conclusions

### Summary
[Write 2-3 sentences summarizing the overall performance]

### Race Condition Handling
[Did the FOR UPDATE and transaction handling work correctly? ]

### Recommendations
1.  [Any improvements needed?]
2. [Any optimizations suggested?]

---

## 8.  Appendix

### A. Test Files
- flash-sale-load-test.jmx - JMeter test plan
- users.csv - 80 test users
- race_condition_users.csv - 30 users for race condition test
- flash_sale_race_condition.csv - 50 users for flash sale test

### B. How to Run Tests
1.  Ensure database is populated with sample data
2. Start backend server: cd backend && npm start
3. Open JMeter and load flash-sale-load-test.jmx
4. Disable Thread Groups you do not want to run (right-click then Disable)
5. Click green play button to run
6. View results in Listeners

### C.  Test Data Information
- Users: 80 buyers (IDs 21-100)
- Products: 200 products
- Low stock product: ID 45 (4 units)
- Flash sale product: ID 160 (11 units)