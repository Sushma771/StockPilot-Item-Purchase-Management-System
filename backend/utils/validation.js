function isValidId(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isValidDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function positiveInt(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function nonNegativeInt(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function normalizeActive(value) {
  if (value === true || value === 1 || value === "1" || value === "true") return 1;
  if (value === false || value === 0 || value === "0" || value === "false") return 0;
  return null;
}

module.exports = {
  isValidId,
  isValidDate,
  positiveInt,
  nonNegativeInt,
  normalizeActive
};
