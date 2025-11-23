CREATE TABLE Users(
    user_id int,
    user_name varchar(100),
    email varchar(100),
    user_pw varchar(100), # password
    user_role ENUM('SELLER', 'BUYER'),
    PRIMARY KEY (user_id)
);

CREATE TABLE FlashSales(
    flash_sale_id int,
    name varchar(100),
    start_time datetime,
    end_time datetime,
    PRIMARY KEY (flash_sale_id)
);

CREATE TABLE Products(
    product_id int,
    seller_id int,
    product_name varchar(100),
    category varchar(100),
    product_desc varchar(256),
    price decimal(8,2),
    original_price decimal(8,2),
    discount_rate decimal(4,2), #percentage
    quantity_stock int,
    flash_sale_id int,
    PRIMARY KEY (product_id),
    FOREIGN KEY (flash_sale_id) REFERENCES FlashSales(flash_sale_id)
);

CREATE TABLE Orders(
    order_id int,
    buyer_id int,
    created_at datetime,
    PRIMARY KEY (order_id),
    FOREIGN KEY (buyer_id) REFERENCES Users(user_id)
);

CREATE TABLE OrderItems(
    order_items_id int,
    order_id int,
    product_id int,
    quantity_sold int,
    PRIMARY KEY (order_items_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE CartItems(
    cart_item_id int,
    user_id int,
    product_id int,
    quantity_added int,
    PRIMARY KEY (cart_item_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
