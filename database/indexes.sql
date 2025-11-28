-- Indexes for performance and deadlock avoidance

-- Products
CREATE INDEX  idx_products_id_stock ON Products(product_id, quantity_stock);
CREATE INDEX  idx_products_flash_sale ON Products(flash_sale_id, product_id);

-- CartItems
CREATE INDEX  idx_cart_user_product ON CartItems(user_id, product_id);
-- Orders
CREATE INDEX  idx_orders_buyer ON Orders(buyer_id, created_at);

-- OrderItems
CREATE INDEX  idx_order_items_order_product ON OrderItems(order_id, product_id);