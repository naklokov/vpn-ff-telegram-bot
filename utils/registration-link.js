const DEFAULT_UI_REGISTER_URL = "http://localhost";

/**
 * Нормализует базовый URL UI: без хвостового `/`, с поддержкой legacy `…/register`.
 */
function normalizeUiBaseUrl(raw) {
  if (!raw || !String(raw).trim()) {
    return DEFAULT_UI_REGISTER_URL;
  }
  let s = String(raw).trim().replace(/\/+$/, "");
  s = s.replace(/\/register\/?$/i, "").replace(/\/+$/, "");
  return s || DEFAULT_UI_REGISTER_URL;
}

const getUiBaseUrl = () =>
  normalizeUiBaseUrl(process.env.UI_REGISTER_URL || DEFAULT_UI_REGISTER_URL);

const buildRegistrationUrl = (params = {}) => {
  const { referralUserLogin, chatId } = params;
  const base = getUiBaseUrl();
  const url = new URL(`${base}/register`);

  if (!referralUserLogin && !chatId) {
    return url.toString();
  }

  if (referralUserLogin) {
    url.searchParams.set("referralUserLogin", referralUserLogin);
  }
  if (typeof chatId === "number" && Number.isFinite(chatId)) {
    url.searchParams.set("chatId", String(chatId));
  }
  return url.toString();
};

const buildPaymentUrl = (params = {}) => {
  const { phone } = params;
  const base = getUiBaseUrl();
  const url = new URL(`${base}/payment`);

  if (phone) {
    url.searchParams.set("phone", phone);
  }

  return url.toString();
};

module.exports = {
  buildRegistrationUrl,
  buildPaymentUrl,
};
