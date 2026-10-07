CREATE DATABASE IF NOT EXISTS item_purchase_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE item_purchase_db;

CREATE TABLE IF NOT EXISTS item_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  purchase_date DATE NOT NULL,
  stock_available INT UNSIGNED NOT NULL DEFAULT 0,
  item_type_id INT UNSIGNED NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_type
    FOREIGN KEY (item_type_id) REFERENCES item_types(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_items_type (item_type_id),
  INDEX idx_items_active (active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL UNIQUE,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT UNSIGNED NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_items_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_items_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT uq_purchase_item UNIQUE (purchase_id, item_id),
  INDEX idx_purchase_items_item (item_id)
) ENGINE=InnoDB;

INSERT IGNORE INTO item_types (type_name)
VALUES
  ('Electronics'),
  ('Furniture'),
  ('Clothing'),
  ('Grocery'),
  ('Stationery');

INSERT INTO items (name, purchase_date, stock_available, item_type_id, active)
SELECT 'Laptop', '2026-08-20', 10, id, 1 FROM item_types WHERE type_name = 'Electronics'
AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Laptop');

INSERT INTO items (name, purchase_date, stock_available, item_type_id, active)
SELECT 'Mouse', '2026-08-21', 20, id, 1 FROM item_types WHERE type_name = 'Electronics'
AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Mouse');

INSERT INTO items (name, purchase_date, stock_available, item_type_id, active)
SELECT 'Chair', '2026-08-22', 15, id, 1 FROM item_types WHERE type_name = 'Furniture'
AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Chair');
