const db = require("../models");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID } = require("../config/defaults");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

/**
 * FULL Charity Item List API (Matching Main ERP Logic)
 */
exports.getCharityItemList = async (req, res) => {
  try {
    const comp_id = req.query.comp_id || DEFAULT_COMPANY_ID;
    const { search, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (comp_id !== undefined && comp_id !== null && comp_id !== "") {
      whereClause.company_id = Number(comp_id);
    }
    if (search) {
      whereClause.item_name = { $regex: search, $options: "i" };
    }
    
    const count = await db.item_location_master.countDocuments(whereClause);
    const rows = await db.item_location_master.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ updated_at: -1 })
      .lean();

    // Dynamically map associated relational fields just like Sequelize's "include" feature!
    for (let row of rows) {
      row.item_main_prices = await db.item_main_price.find({ item_id: row.id }, "batch_number itemcost item_price itemlanprice item_upc").lean();
      row.item_batch = await db.batch.find({ item_id: String(row.id) }, "batch_number qty current_in_stock expiry_date").lean();
    }

    return res.status(200).json({
      success: true,
      message: "Charity Item list fetched successfully.",
      total: count,
      data: rows
    });
  } catch (error) {
    console.error("FATAL Error in getCharityItemList:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching charity item list.",
      detailedError: error.message
    });
  }
};

/**
 * Standard Item List
 */
exports.getItems = async (req, res) => {
  try {
    const items = await db.item_master.find().limit(50);
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a new Charity Item (Admin only)
 */
exports.createItem = async (req, res) => {
  try {
    const { item_code, item_name, item_description, itemprice, itemcost, opening_stock } = req.body;
    if (!item_name || !itemprice) {
      return res.status(400).json({ success: false, message: 'Item name and price are required.' });
    }
    
    // Auto-generate code if empty
    const generatedCode = item_code && item_code.trim() !== '' 
      ? item_code.trim() 
      : `ITM-${Math.floor(100000 + Math.random() * 900000)}`;

    const nextId = await getNextId(db.item_location_master);
    
    const itemData = {
      id: nextId,
      item_code: generatedCode,
      item_name,
      item_description,
      itemprice: Number(itemprice),
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID,
      status: 1,
    };

    if (req.file) {
      itemData.item_image = req.file.filename;
    }

    const newItem = await db.item_location_master.create(itemData);

    // Create price record if cost is provided
    if (itemcost) {
      const nextPriceId = await getNextId(db.item_main_price);
      await db.item_main_price.create({
        id: nextPriceId,
        item_id: nextId,
        batch_number: req.body.batch_number || generatedCode,
        itemcost: Number(itemcost),
        item_price: Number(itemprice),
        itemlanprice: Number(itemcost),
        item_upc: generatedCode
      });
    }

    // Create batch record if opening stock is provided
    if (opening_stock) {
      const nextBatchId = await getNextId(db.batch);
      await db.batch.create({
        id: nextBatchId,
        item_id: String(nextId),
        batch_number: req.body.batch_number || generatedCode,
        qty: Number(opening_stock),
        current_in_stock: Number(opening_stock),
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2))
      });
    }

    return res.status(201).json({ success: true, message: 'Item created successfully.', data: newItem });
  } catch (error) {
    console.error('Error creating item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a Charity Item (Admin only)
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, item_description, itemprice, status } = req.body;
    
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = [];
    if (!isNaN(id)) query.push({ id: Number(id) });
    if (isObjectId) query.push({ _id: id });
    
    if (query.length === 0) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    
    const item = await db.item_location_master.findOne({ $or: query });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    
    const updateData = { item_name, item_description, itemprice };
    if (status !== undefined && status !== '') {
      updateData.status = Number(status);
    }
    if (req.file) {
      updateData.item_image = req.file.filename;
    }
    
    item.set(updateData);
    await item.save();
    
    return res.status(200).json({ success: true, message: 'Item updated successfully.', data: item });
  } catch (error) {
    console.error('Error updating item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a Charity Item (Admin only)
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = [];
    if (!isNaN(id)) query.push({ id: Number(id) });
    if (isObjectId) query.push({ _id: id });
    
    if (query.length === 0) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    
    const item = await db.item_location_master.findOne({ $or: query });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    
    await item.deleteOne();
    return res.status(200).json({ success: true, message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
