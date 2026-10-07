# StockPilot — Item & Purchase Management System

A production-style implementation of the provided assignment using:

- React + Vite
- Node.js + Express.js
- MySQL + mysql2
- REST APIs
- SQL JOINs
- MySQL transactions and row-level locking
- Backend validation
- Responsive, modern UI

## 1. Requirements

Install:

- Node.js 18+ (Node 20+ recommended)
- MySQL 8+
- VS Code recommended

## 2. Project structure

```text
item-purchase-management-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── database/
│   └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 3. Create the database

Open MySQL Workbench or the MySQL command line.

Run:

```sql
SOURCE /absolute/path/to/database/schema.sql;
```

Or open `database/schema.sql` in MySQL Workbench and execute it.

This creates:

- `item_purchase_db`
- `item_types`
- `items`
- `purchases`
- `purchase_items`

It also inserts five item types and sample Laptop, Mouse and Chair records.

## 4. Configure backend

Open a terminal:

```bash
cd backend
npm install
```

Create `.env` from `.env.example`.

Windows CMD:

```cmd
copy .env.example .env
```

Then update `.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=item_purchase_db
DB_CONNECTION_LIMIT=10
```

## 5. Start backend

```bash
npm run dev
```

Expected:

```text
API running on http://localhost:5000
```

Test:

```text
http://localhost:5000/api/health
```

## 6. Start frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173
```

## 7. Core API endpoints

### Items

```http
GET    /api/items
POST   /api/items
GET    /api/items/:id
PUT    /api/items/:id
PATCH  /api/items/:id/toggle
DELETE /api/items/:id
GET    /api/items/stats
```

### Item Types

```http
GET    /api/item-types
POST   /api/item-types
PUT    /api/item-types/:id
DELETE /api/item-types/:id
```

### Purchases

```http
GET    /api/purchases
POST   /api/purchases
GET    /api/purchases/:id
PUT    /api/purchases/:id
```

There is intentionally **no DELETE purchase endpoint**.

## 8. Purchase request example

```json
{
  "purchase_date": "2026-08-25",
  "items": [
    { "item_id": 1, "quantity": 2 },
    { "item_id": 2, "quantity": 5 },
    { "item_id": 3, "quantity": 3 }
  ]
}
```

The backend:

1. Validates the date.
2. Validates that at least one line exists.
3. Rejects duplicate item IDs.
4. Locks selected item rows.
5. Confirms every item exists.
6. Confirms every item is active.
7. Confirms sufficient stock.
8. Generates a unique `PO-00001` style order ID.
9. Inserts purchase header.
10. Inserts purchase lines.
11. Deducts stock.
12. Commits everything together.
13. Rolls back the entire operation if anything fails.

## 9. Purchase update logic

For an existing purchase:

```text
old quantity = 3
new quantity = 5
delta = +2
```

The system deducts 2 additional units.

If:

```text
old quantity = 5
new quantity = 2
delta = -3
```

The system returns 3 units to stock.

All affected item rows are locked before the calculation.

## 10. Item deletion rule

An item with no purchase history may be physically deleted.

An item that already appears in `purchase_items` cannot be deleted. The API returns HTTP 409 and instructs the user to deactivate it.

This protects historical purchase details.

## 11. SQL JOIN demonstrations

Item list uses:

```sql
SELECT
  i.id,
  i.name,
  it.type_name,
  i.purchase_date,
  i.stock_available,
  i.active
FROM items i
JOIN item_types it ON i.item_type_id = it.id;
```

Purchase details uses:

```sql
SELECT
  p.order_id,
  p.purchase_date,
  i.id AS item_id,
  i.name AS item_name,
  it.type_name,
  pi.quantity
FROM purchases p
JOIN purchase_items pi ON p.id = pi.purchase_id
JOIN items i ON pi.item_id = i.id
JOIN item_types it ON i.item_type_id = it.id
WHERE p.order_id = ?;
```

## 12. Testing the critical stock rule

With Laptop stock = 10:

Create a purchase for 5.

Expected:

```text
Stock = 5
```

Try another purchase for 6.

Expected:

```text
HTTP 409
Insufficient stock for Laptop. Available quantity: 5.
```

The failed transaction does not create a partial purchase and does not change stock.

## 13. Suggested demonstration flow

For an interview or assignment demo:

1. Open Dashboard.
2. Show Item Types.
3. Create a new item.
4. Edit the item.
5. Deactivate the item.
6. Try selecting it in New Purchase — it is unavailable.
7. Reactivate it.
8. Create a purchase with 2–3 different items.
9. Show stock deduction.
10. Open Purchase Details.
11. Edit the purchase quantity upward and show additional stock deduction.
12. Edit it downward and show stock returned.
13. Try purchasing more than available stock.
14. Show the backend error.
15. Open the database and demonstrate the four related tables.
16. Explain the JOIN queries and transaction flow.
17. Show that Purchase has no delete action.

## 14. Important implementation decisions

- Purchases are never deleted.
- Inactive items remain visible in historical purchase details.
- Stock is changed only by backend purchase processing or item master updates.
- Purchase processing uses a transaction.
- Selected item rows are locked with `FOR UPDATE`.
- Duplicate items in one order are rejected.
- Backend validation is independent from frontend validation.
- Foreign keys use InnoDB.
- `purchase_items` has a unique `(purchase_id, item_id)` constraint.
- Error responses use 400, 404, 409 and 500 appropriately.
