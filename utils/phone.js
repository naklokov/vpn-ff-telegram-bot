/**
 * Normalizes RU phone to MSISDN-like format: 7XXXXXXXXXX.
 * Returns null when value cannot be normalized.
 */
const normalizeRuPhoneToMsisdn = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  return null;
};

module.exports = {
  normalizeRuPhoneToMsisdn,
};
