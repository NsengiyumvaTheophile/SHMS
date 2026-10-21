const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\s-]{8,15}$/;
const PAYMENT_METHODS = ['CASH', 'MOBILE_MONEY', 'BANK', 'OTHER'];
const MAINTENANCE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const GENDERS = ['Male', 'Female'];

function isNonEmpty(value, min = 1) {
  return typeof value === 'string' && value.trim().length >= min;
}

function isEmail(value) {
  return isNonEmpty(value) && EMAIL_RE.test(value.trim());
}

function isPhone(value) {
  if (!value) return true;
  return PHONE_RE.test(String(value).trim());
}

function isPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

function isPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function isIntInRange(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

function hostelFitsStudent(hostel, student) {
  if (!hostel || !student) return true;
  const text = `${hostel.name} ${hostel.description || ''}`.toLowerCase();
  const gender = (student.gender || '').toLowerCase();
  if (gender.startsWith('f') && /\bboy|\bmale\b/.test(text) && !/\bfemale\b/.test(text)) return false;
  if (gender.startsWith('m') && /\bgirl|\bfemale\b/.test(text)) return false;
  return true;
}

module.exports = {
  EMAIL_RE,
  PHONE_RE,
  PAYMENT_METHODS,
  MAINTENANCE_STATUSES,
  GENDERS,
  isNonEmpty,
  isEmail,
  isPhone,
  isPassword,
  isPositiveNumber,
  isIntInRange,
  hostelFitsStudent,
};
