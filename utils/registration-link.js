const DEFAULT_UI_REGISTER_URL = "http://localhost/register";

const getRegisterPageBaseUrl = () =>
  (process.env.UI_REGISTER_URL || DEFAULT_UI_REGISTER_URL).trim();

const buildRegistrationUrl = (params = {}) => {
  const { referralUserLogin, chatId } = params;
  const baseUrl = getRegisterPageBaseUrl();
  if (!referralUserLogin && !chatId) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  if (referralUserLogin) {
    url.searchParams.set("referralUserLogin", referralUserLogin);
  }
  if (typeof chatId === "number" && Number.isFinite(chatId)) {
    url.searchParams.set("chatId", String(chatId));
  }
  return url.toString();
};

module.exports = {
  buildRegistrationUrl,
};
