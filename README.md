# STADVDB-MCO2

# E-commerce Frontend Prototype

This is a **frontend-only** React prototype for an e-commerce application, based on the provided OLTP and OLAP database schemas.

It is built as a single `App.jsx` file and uses **Tailwind CSS** for styling. All data is hardcoded inside the `App.jsx` file, clearly marked with `TODO: UPDATE THE DATA IN BACKEND.` comments.

---

## Table of Contents

1.  [Features](#1-features)
2.  [How to Run This Application](#2-how-to-run-this-application)
    - [Step 1: Create Project](#step-1-create-a-new-react--tailwind-project)
    - [Step 2: Configure Tailwind](#step-2-configure-tailwind-css)
    - [Step 3: Add Code](#step-3-add-the-application-code)
    - [Step 4: Run](#step-4-run-the-application)

---

## 1. Features

- **Product Browsing**: A home page with a product list, including a mock "Flash Sale" section.
- **Product Details**: A detail page for viewing a single product.
- **Mock Cart**: A functional cart page that calculates totals based on dummy data.
- **Order History**: A page showing a user's past orders.
- **Analytics Dashboard**: A dedicated dashboard that visualizes the 3 reports specified in your OLAP schema:
  1.  Top Selling Items
  2.  Sales by Category
  3.  Flash Sale Performance (hourly breakdown)

---

## 2. How to Run This Application

This is not a standalone runnable file; it's designed to be dropped into a standard React project. The quickest way to get this running is by using `vite`.

### Step 1: Create a new React + Tailwind Project

If you don't have a project, create one:

```bash
# 0. Make sure you're in the frontend folder on your terminal
cd frontend

# 1. Create a new React project using vite
npm create vite@latest my-ecommerce-app --template react

# 2. Enter the new directory
cd my-ecommerce-app

# 3. Install npm packages
npm install

# 4. Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
