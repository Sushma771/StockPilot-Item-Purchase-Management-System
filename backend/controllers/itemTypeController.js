const db = require("../config/db");
const { isValidId } = require("../utils/validation");

async function listItemTypes(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT id, type_name, created_at, updated_at
      FROM item_types
      ORDER BY type_name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function createItemType(req, res, next) {
  try {
    const typeName = String(req.body.type_name || "").trim();
    if (!typeName) return res.status(400).json({ success: false, message: "Item type name is required." });
    if (typeName.length > 80) return res.status(400).json({ success: false, message: "Item type name must be 80 characters or less." });

    const [result] = await db.execute(
      "INSERT INTO item_types (type_name) VALUES (?)",
      [typeName]
    );

    const [rows] = await db.execute("SELECT * FROM item_types WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, message: "Item type created successfully.", data: rows[0] });
  } catch (err) { next(err); }
}

async function updateItemType(req, res, next) {
  try {
    const id = Number(req.params.id);
    const typeName = String(req.body.type_name || "").trim();

    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid item type ID." });
    if (!typeName) return res.status(400).json({ success: false, message: "Item type name is required." });

    const [result] = await db.execute(
      "UPDATE item_types SET type_name = ? WHERE id = ?",
      [typeName, id]
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Item type not found." });

    const [rows] = await db.execute("SELECT * FROM item_types WHERE id = ?", [id]);
    res.json({ success: true, message: "Item type updated successfully.", data: rows[0] });
  } catch (err) { next(err); }
}

async function deleteItemType(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid item type ID." });

    const [items] = await db.execute("SELECT COUNT(*) AS count FROM items WHERE item_type_id = ?", [id]);
    if (items[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: "This item type is in use by existing items and cannot be deleted."
      });
    }

    const [result] = await db.execute("DELETE FROM item_types WHERE id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Item type not found." });

    res.json({ success: true, message: "Item type deleted successfully." });
  } catch (err) { next(err); }
}

module.exports = { listItemTypes, createItemType, updateItemType, deleteItemType };
