const db = require("../models");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID } = require("../config/defaults");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

// List all Departments
exports.list = async (req, res) => {
  try {
    const list = await db.item_department.find().sort({ deptname: 1 }).lean();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new Department
exports.create = async (req, res) => {
  try {
    const { deptcode, deptname, deptdesclong, status, company_id, location_id } = req.body;
    if (!deptname) {
      return res.status(400).json({ success: false, message: "Department Name is required" });
    }

    const nextId = await getNextId(db.item_department);
    const deptData = {
      id: nextId,
      deptcode: deptcode || `DEPT-${Math.floor(1000 + Math.random() * 9000)}`,
      deptname,
      itemdeptname: deptname,
      deptdesclong: deptdesclong || "",
      status: status !== undefined ? Number(status) : 1,
      company_id: company_id ? Number(company_id) : DEFAULT_COMPANY_ID,
      location_id: location_id ? Number(location_id) : DEFAULT_LOCATION_ID
    };
    if (req.file) {
      deptData.dept_image = req.file.filename;
    }
    const newDept = await db.item_department.create(deptData);

    res.status(201).json({ success: true, message: "Department created successfully", data: newDept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Department
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { deptcode, deptname, deptdesclong, status, company_id, location_id } = req.body;

    const dept = await db.item_department.findOne({ id: Number(id) });
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    if (deptcode) dept.deptcode = deptcode;
    if (deptname) {
      dept.deptname = deptname;
      dept.itemdeptname = deptname;
    }
    if (deptdesclong !== undefined) dept.deptdesclong = deptdesclong;
    if (status !== undefined) dept.status = Number(status);
    if (company_id) dept.company_id = Number(company_id);
    if (location_id) dept.location_id = Number(location_id);
    if (req.file) dept.dept_image = req.file.filename;

    await dept.save();
    res.status(200).json({ success: true, message: "Department updated successfully", data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Department
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.item_department.deleteOne({ id: Number(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
