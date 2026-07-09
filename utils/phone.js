/**
 * Normalizes RU mobile phone to MSISDN: 79XXXXXXXXX.
 * Returns null when value cannot be normalized.
 */
const normalizeRuPhoneToMsisdn = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");

  let normalized;
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    normalized = `7${digits.slice(1)}`;
  } else if (digits.length === 10) {
    normalized = `7${digits}`;
  } else {
    return null;
  }

  if (!/^79\d{9}$/.test(normalized)) {
    return null;
  }

  return normalized;
};

module.exports = {
  normalizeRuPhoneToMsisdn,
};
