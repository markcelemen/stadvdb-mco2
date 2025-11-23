CREATE TABLE DimBuyer(
    buyer_id int,
    user_name varchar(100),
    PRIMARY KEY (buyer_id)
);

CREATE TABLE DimSeller(
    seller_id int,
    user_name varchar(100),
    PRIMARY KEY (seller_id)
);

CREATE TABLE DimProduct(
    product_id int,
    product_name varchar(100),
    category varchar(100),
    original_price decimal(8,2),
    PRIMARY KEY (product_id)
);

CREATE TABLE DimTime(
    time_id int,
    t_hour int, #Range [0,23]
    t_day int,
    t_month int,
    t_year int,
    PRIMARY KEY (time_id)
);

CREATE TABLE DimFlashSale(
    flash_sale_id int,
    name varchar(100),
    start_time_id int,
    end_time_id int,
    PRIMARY KEY (flash_sale_id),
    FOREIGN KEY (start_time_id) REFERENCES DimTime(time_id),
    FOREIGN KEY (end_time_id) REFERENCES DimTime(time_id)
);

CREATE TABLE FactOrders(
    order_id int,
    product_id int,
    time_id int,
    buyer_id int,
    seller_id int,
    flash_sale_id int,
    quantity_sold int,
    price_per_item decimal(8,2),
    total_sale decimal(11,2),
    PRIMARY KEY (order_id),
    FOREIGN KEY (product_id) REFERENCES DimProduct(product_id),
    FOREIGN KEY (time_id) REFERENCES DimTime(time_id),
    FOREIGN KEY (buyer_id) REFERENCES DimBuyer(buyer_id),
    FOREIGN KEY (seller_id) REFERENCES DimSeller(seller_id),
    FOREIGN KEY (flash_sale_id) REFERENCES DimFlashSale(flash_sale_id)
);