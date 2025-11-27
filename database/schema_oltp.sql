CREATE TABLE IF NOT EXISTS Users(
    user_id INT AUTO_INCREMENT,
    user_name VARCHAR(100),
    email VARCHAR(100),
    user_pw VARCHAR(100),
    user_role ENUM('SELLER', 'BUYER'),
    PRIMARY KEY (user_id),
    UNIQUE KEY (email)
);

CREATE TABLE IF NOT EXISTS FlashSales(
    flash_sale_id INT AUTO_INCREMENT,
    name VARCHAR(100),
    start_time DATETIME,
    end_time DATETIME,
    PRIMARY KEY (flash_sale_id)
);

CREATE TABLE IF NOT EXISTS Products(
    product_id INT AUTO_INCREMENT,
    seller_id INT,
    product_name VARCHAR(100),
    category VARCHAR(100),
    product_desc VARCHAR(256),
    price DECIMAL(8,2),
    original_price DECIMAL(8,2),
    discount_rate DECIMAL(4,2),
    quantity_stock INT,
    flash_sale_id INT,
    PRIMARY KEY (product_id),
    FOREIGN KEY (flash_sale_id) REFERENCES FlashSales(flash_sale_id)
);

CREATE TABLE IF NOT EXISTS Orders(
    order_id INT AUTO_INCREMENT,
    buyer_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id),
    FOREIGN KEY (buyer_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS OrderItems(
    order_items_id INT AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity_sold INT,
    PRIMARY KEY (order_items_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE IF NOT EXISTS CartItems(
    cart_item_id INT AUTO_INCREMENT,
    user_id INT,
    product_id INT,
    quantity_added INT,
    PRIMARY KEY (cart_item_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
