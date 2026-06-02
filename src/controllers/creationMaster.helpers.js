const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

const findByNumericId = async (model, id) => {
  return await model.findOne({ id: Number(id) });
};

module.exports = {
  getNextId,
  findByNumericId
};
