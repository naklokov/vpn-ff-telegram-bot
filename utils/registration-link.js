const DEFAULT_UI_REGISTER_URL = "http://localhost:3002/register";

const getRegisterPageBaseUrl = () =>
  (process.env.UI_REGISTER_URL || DEFAULT_UI_REGISTER_URL).trim();

const buildRegistrationUrl = (referralUserLogin) => {
  const baseUrl = getRegisterPageBaseUrl();
  if (!referralUserLogin) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("referralUserLogin", referralUserLogin);
  return url.toString();
};

module.exports = {
  buildRegistrationUrl,
};
