const db = require("../config/db");
const { isValidId, isValidDate, positiveInt } = require("../utils/validation");

function normalizeLines(items) {
  if (!Array.isArray(items)) return null;
  const map = new Map();

  for (const line of items) {
    const itemId = Number(line.item_id);
    const quantity = Number(line.quantity);

    if (!Number.isInteger(itemId) || itemId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Each purchase line must contain a valid item ID and a quantity greater than zero." };
    }

    if (map.has(itemId)) {
      return { error: "Duplicate items are not allowed within one order." };
    }

    map.set(itemId, quantity);
  }

  return [...map.entries()].map(([item_id, quantity]) => ({ item_id, quantity }));
}

async function generateOrderId(connection) {
  const [rows] = await connection.query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_id, 4) AS UNSIGNED)), 0) AS last_number
    FROM purchases
    WHERE order_id LIKE 'PO-%'
  `);
  const next = Number(rows[0].last_number) + 1;
  return `PO-${String(next).padStart(5, "0")}`;
}

async function listPurchases(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.order_id,
        p.purchase_date,
        p.created_at,
        p.updated_at,
        COUNT(pi.id) AS item_count,
        COALESCE(SUM(pi.quantity), 0) AS total_quantity
      FROM purchases p
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function getPurchase(req, res, next) {
  try {
    const identifier = req.params.id;
    let rows;

    if (/^\d+$/.test(identifier)) {
      [rows] = await db.execute(`
        SELECT
          p.id, p.order_id, p.purchase_date, p.created_at, p.updated_at,
          i.id AS item_id, i.name AS item_name, it.type_name,
          pi.quantity, i.stock_available, i.active,
          CASE
            WHEN i.stock_available = 0 THEN 'Out of Stock'
            WHEN i.stock_available <= 5 THEN 'Low Stock'
            ELSE 'In Stock'
          END AS availability
        FROM purchases p
        JOIN purchase_items pi ON p.id = pi.purchase_id
        JOIN items i ON pi.item_id = i.id
        JOIN item_types it ON i.item_type_id = it.id
        WHERE p.id = ?
        ORDER BY pi.id ASC
      `, [Number(identifier)]);
    } else {
      [rows] = await db.execute(`
        SELECT
          p.id, p.order_id, p.purchase_date, p.created_at, p.updated_at,
          i.id AS item_id, i.name AS item_name, it.type_name,
          pi.quantity, i.stock_available, i.active,
          CASE
            WHEN i.stock_available = 0 THEN 'Out of Stock'
            WHEN i.stock_available <= 5 THEN 'Low Stock'
            ELSE 'In Stock'
          END AS availability
        FROM purchases p
        JOIN purchase_items pi ON p.id = pi.purchase_id
        JOIN items i ON pi.item_id = i.id
        JOIN item_types it ON i.item_type_id = it.id
        WHERE p.order_id = ?
        ORDER BY pi.id ASC
      `, [identifier]);
    }

    if (!rows.length) return res.status(404).json({ success: false, message: "Purchase not found." });

    const header = {
      id: rows[0].id,
      order_id: rows[0].order_id,
      purchase_date: rows[0].purchase_date,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at
    };

    const items = rows.map(r => ({
      item_id: r.item_id,
      item_name: r.item_name,
      type_name: r.type_name,
      quantity: r.quantity,
      stock_available: r.stock_available,
      active: r.active,
      availability: r.availability
    }));

    res.json({ success: true, data: { ...header, items } });
  } catch (err) { next(err); }
}

async function createPurchase(req, res, next) {
  const connection = await db.getConnection();
  try {
    const purchaseDate = req.body.purchase_date;
    const normalized = normalizeLines(req.body.items);

    if (!isValidDate(purchaseDate)) {
      return res.status(400).json({ success: false, message: "Valid purchase date is required." });
    }
    if (!normalized || normalized.error) {
      return res.status(400).json({
        success: false,
        message: normalized?.error || "Purchase must contain at least one item."
      });
    }
    if (normalized.length === 0) {
      return res.status(400).json({ success: false, message: "Purchase must contain at least one item." });
    }

    await connection.beginTransaction();

    // Lock all selected item rows so concurrent purchases cannot oversell stock.
    const itemIds = normalized.map(x => x.item_id);
    const placeholders = itemIds.map(() => "?").join(",");
    const [items] = await connection.query(`
      SELECT i.id, i.name, i.stock_available, i.active
      FROM items i
      WHERE i.id IN (${placeholders})
      FOR UPDATE
    `, itemIds);

    if (items.length !== itemIds.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "One or more selected items do not exist." });
    }

    const byId = new Map(items.map(item => [item.id, item]));

    for (const line of normalized) {
      const item = byId.get(line.item_id);

      if (!item.active) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `${item.name} is inactive and cannot be purchased.`
        });
      }

      if (line.quantity > item.stock_available) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available quantity: ${item.stock_available}.`
        });
      }
    }

    const orderId = await generateOrderId(connection);

    const [purchaseResult] = await connection.execute(`
      INSERT INTO purchases (order_id, purchase_date)
      VALUES (?, ?)
    `, [orderId, purchaseDate]);

    for (const line of normalized) {
      await connection.execute(`
        INSERT INTO purchase_items (purchase_id, item_id, quantity)
        VALUES (?, ?, ?)
      `, [purchaseResult.insertId, line.item_id, line.quantity]);

      const [stockResult] = await connection.execute(`
        UPDATE items
        SET stock_available = stock_available - ?
        WHERE id = ? AND stock_available >= ? AND active = 1
      `, [line.quantity, line.item_id, line.quantity]);

      if (stockResult.affectedRows !== 1) {
        throw Object.assign(new Error("Stock changed while processing the purchase. Please retry."), { statusCode: 409 });
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Purchase ${orderId} created successfully.`,
      data: { id: purchaseResult.insertId, order_id: orderId }
    });
  } catch (err) {
    try { await connection.rollback(); } catch (_) {}
    next(err);
  } finally {
    connection.release();
  }
}

async function updatePurchase(req, res, next) {
  const connection = await db.getConnection();
  try {
    const purchaseId = Number(req.params.id);
    const purchaseDate = req.body.purchase_date;
    const normalized = normalizeLines(req.body.items);

    if (!isValidId(purchaseId)) return res.status(400).json({ success: false, message: "Invalid purchase ID." });
    if (!isValidDate(purchaseDate)) return res.status(400).json({ success: false, message: "Valid purchase date is required." });
    if (!normalized || normalized.error || normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: normalized?.error || "Purchase must contain at least one item."
      });
    }

    await connection.beginTransaction();

    const [purchaseRows] = await connection.execute(
      "SELECT id, order_id FROM purchases WHERE id = ? FOR UPDATE",
      [purchaseId]
    );
    if (!purchaseRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Purchase not found." });
    }

    const [oldLines] = await connection.execute(`
      SELECT item_id, quantity
      FROM purchase_items
      WHERE purchase_id = ?
    `, [purchaseId]);

    // Lock every affected item row before calculating stock differences.
    const affectedIds = [...new Set([
      ...oldLines.map(x => Number(x.item_id)),
      ...normalized.map(x => Number(x.item_id))
    ])];

    const placeholders = affectedIds.map(() => "?").join(",");
    const [lockedItems] = await connection.query(`
      SELECT id, name, stock_available, active
      FROM items
      WHERE id IN (${placeholders})
      FOR UPDATE
    `, affectedIds);

    if (lockedItems.length !== affectedIds.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "One or more items in the purchase no longer exist." });
    }

    const oldMap = new Map(oldLines.map(x => [Number(x.item_id), Number(x.quantity)]));
    const newMap = new Map(normalized.map(x => [Number(x.item_id), Number(x.quantity)]));
    const itemMap = new Map(lockedItems.map(x => [Number(x.id), x]));

    // Delta = new quantity - old quantity.
    // Positive delta consumes additional stock; negative delta returns stock.
    for (const id of affectedIds) {
      const oldQty = oldMap.get(id) || 0;
      const newQty = newMap.get(id) || 0;
      const delta = newQty - oldQty;
      const item = itemMap.get(id);

      if (newQty > 0 && !item.active) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: `${item.name} is inactive and cannot be in an updated purchase.` });
      }

      if (delta > 0 && delta > Number(item.stock_available)) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Insufficient additional stock for ${item.name}. Available quantity: ${item.stock_available}.`
        });
      }
    }

    await connection.execute(
      "UPDATE purchases SET purchase_date = ? WHERE id = ?",
      [purchaseDate, purchaseId]
    );

    await connection.execute("DELETE FROM purchase_items WHERE purchase_id = ?", [purchaseId]);

    for (const id of affectedIds) {
      const oldQty = oldMap.get(id) || 0;
      const newQty = newMap.get(id) || 0;
      const delta = newQty - oldQty;

      if (delta !== 0) {
        await connection.execute(
          "UPDATE items SET stock_available = stock_available - ? WHERE id = ?",
          [delta, id]
        );
      }
    }

    for (const line of normalized) {
      await connection.execute(`
        INSERT INTO purchase_items (purchase_id, item_id, quantity)
        VALUES (?, ?, ?)
      `, [purchaseId, line.item_id, line.quantity]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Purchase ${purchaseRows[0].order_id} updated successfully.`,
      data: { id: purchaseId, order_id: purchaseRows[0].order_id }
    });
  } catch (err) {
    try { await connection.rollback(); } catch (_) {}
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = { listPurchases, getPurchase, createPurchase, updatePurchase };
