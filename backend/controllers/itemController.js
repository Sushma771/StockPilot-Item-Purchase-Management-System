const db = require("../config/db");
const {
  isValidId, isValidDate, nonNegativeInt, normalizeActive
} = require("../utils/validation");

const itemSelect = `
  SELECT
    i.id,
    i.name,
    i.purchase_date,
    i.stock_available,
    i.item_type_id,
    it.type_name,
    i.active,
    CASE
      WHEN i.stock_available = 0 THEN 'Out of Stock'
      WHEN i.stock_available <= 5 THEN 'Low Stock'
      ELSE 'In Stock'
    END AS availability,
    i.created_at,
    i.updated_at
  FROM items i
  JOIN item_types it ON i.item_type_id = it.id
`;

async function listItems(req, res, next) {
  try {
    const { search = "", active = "all", type = "all" } = req.query;
    const params = [];
    let sql = `${itemSelect} WHERE 1=1`;

    if (search.trim()) {
      sql += " AND (i.name LIKE ? OR it.type_name LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (active === "true" || active === "false") {
      sql += " AND i.active = ?";
      params.push(active === "true" ? 1 : 0);
    }

    if (type !== "all") {
      const typeId = Number(type);
      if (!isValidId(typeId)) return res.status(400).json({ success: false, message: "Invalid item type filter." });
      sql += " AND i.item_type_id = ?";
      params.push(typeId);
    }

    sql += " ORDER BY i.id DESC";
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function getItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });

    const [rows] = await db.execute(`${itemSelect} WHERE i.id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Item not found." });

    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
}

async function createItem(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const purchaseDate = req.body.purchase_date;
    const itemTypeId = Number(req.body.item_type_id);
    const stock = Number(req.body.stock_available);
    const active = normalizeActive(req.body.active);

    if (!name) return res.status(400).json({ success: false, message: "Item name is required." });
    if (name.length > 150) return res.status(400).json({ success: false, message: "Item name must be 150 characters or less." });
    if (!isValidId(itemTypeId)) return res.status(400).json({ success: false, message: "Valid item type is required." });
    if (!isValidDate(purchaseDate)) return res.status(400).json({ success: false, message: "Valid purchase date is required." });
    if (!nonNegativeInt(stock)) return res.status(400).json({ success: false, message: "Stock cannot be negative and must be a whole number." });
    if (active === null) return res.status(400).json({ success: false, message: "Active/Inactive status is required." });

    const [typeRows] = await db.execute("SELECT id FROM item_types WHERE id = ?", [itemTypeId]);
    if (!typeRows.length) return res.status(400).json({ success: false, message: "Invalid item type." });

    const [result] = await db.execute(`
      INSERT INTO items (name, purchase_date, stock_available, item_type_id, active)
      VALUES (?, ?, ?, ?, ?)
    `, [name, purchaseDate, stock, itemTypeId, active]);

    const [rows] = await db.execute(`${itemSelect} WHERE i.id = ?`, [result.insertId]);
    res.status(201).json({ success: true, message: "Item created successfully.", data: rows[0] });
  } catch (err) { next(err); }
}

async function updateItem(req, res, next) {
  const connection = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      connection.release();
      return res.status(400).json({ success: false, message: "Invalid item ID." });
    }

    const name = String(req.body.name || "").trim();
    const purchaseDate = req.body.purchase_date;
    const itemTypeId = Number(req.body.item_type_id);
    const stock = Number(req.body.stock_available);
    const active = normalizeActive(req.body.active);

    if (!name) return res.status(400).json({ success: false, message: "Item name is required." });
    if (!isValidId(itemTypeId)) return res.status(400).json({ success: false, message: "Valid item type is required." });
    if (!isValidDate(purchaseDate)) return res.status(400).json({ success: false, message: "Valid purchase date is required." });
    if (!nonNegativeInt(stock)) return res.status(400).json({ success: false, message: "Stock cannot be negative." });
    if (active === null) return res.status(400).json({ success: false, message: "Active/Inactive status is required." });

    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT id, stock_available FROM items WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    const [typeRows] = await connection.execute("SELECT id FROM item_types WHERE id = ?", [itemTypeId]);
    if (!typeRows.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Invalid item type." });
    }

    // If the item has historical purchases, do not allow its current stock
    // to be manually reduced below quantities already committed by history.
    const [purchased] = await connection.execute(`
      SELECT COALESCE(SUM(quantity), 0) AS total_purchased
      FROM purchase_items
      WHERE item_id = ?
    `, [id]);

    const totalPurchased = Number(purchased[0].total_purchased);
    const [allCreated] = await connection.execute(`
      SELECT COALESCE(SUM(quantity), 0) AS total_quantity
      FROM purchase_items
      WHERE item_id = ?
    `, [id]);

    // stock_available is the live stock. The UI may increase it (restocking),
    // but it must not be set to a value that conflicts with active purchase flow.
    if (stock < 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Stock cannot be negative." });
    }

    await connection.execute(`
      UPDATE items
      SET name = ?, purchase_date = ?, stock_available = ?, item_type_id = ?, active = ?
      WHERE id = ?
    `, [name, purchaseDate, stock, itemTypeId, active, id]);

    await connection.commit();

    const [rows] = await db.execute(`${itemSelect} WHERE i.id = ?`, [id]);
    res.json({ success: true, message: "Item updated successfully.", data: rows[0] });
  } catch (err) {
    try { await connection.rollback(); } catch (_) {}
    next(err);
  } finally {
    connection.release();
  }
}

async function deleteItem(req, res, next) {
  const connection = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      connection.release();
      return res.status(400).json({ success: false, message: "Invalid item ID." });
    }

    const [used] = await connection.execute(
      "SELECT COUNT(*) AS count FROM purchase_items WHERE item_id = ?",
      [id]
    );

    if (used[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: "This item has purchase history. Deactivate it instead of deleting it."
      });
    }

    const [result] = await connection.execute("DELETE FROM items WHERE id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Item not found." });

    res.json({ success: true, message: "Item deleted successfully." });
  } catch (err) { next(err); } finally { connection.release(); }
}

async function toggleItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });

    const [result] = await db.execute(
      "UPDATE items SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Item not found." });

    const [rows] = await db.execute(`${itemSelect} WHERE i.id = ?`, [id]);
    res.json({ success: true, message: `Item ${rows[0].active ? "activated" : "deactivated"}.`, data: rows[0] });
  } catch (err) { next(err); }
}

async function dashboardStats(req, res, next) {
  try {
    const [[items]] = await db.query(`
      SELECT
        COUNT(*) AS total_items,
        SUM(active = 1) AS active_items,
        SUM(active = 0) AS inactive_items,
        SUM(stock_available = 0) AS out_of_stock,
        SUM(stock_available > 0 AND stock_available <= 5) AS low_stock,
        COALESCE(SUM(stock_available), 0) AS total_stock
      FROM items
    `);
    const [[purchases]] = await db.query(`
      SELECT COUNT(*) AS total_purchases
      FROM purchases
    `);
    const [[types]] = await db.query(`
      SELECT COUNT(*) AS total_types
      FROM item_types
    `);

    res.json({
      success: true,
      data: {
        totalItems: Number(items.total_items),
        activeItems: Number(items.active_items || 0),
        inactiveItems: Number(items.inactive_items || 0),
        outOfStock: Number(items.out_of_stock || 0),
        lowStock: Number(items.low_stock || 0),
        totalStock: Number(items.total_stock || 0),
        totalPurchases: Number(purchases.total_purchases),
        totalTypes: Number(types.total_types)
      }
    });
  } catch (err) { next(err); }
}

module.exports = {
  listItems, getItem, createItem, updateItem, deleteItem, toggleItem, dashboardStats
};
