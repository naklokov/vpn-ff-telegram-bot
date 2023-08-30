require("dotenv").config();

const vpnBot = require("./vpn-bot");

(async function () {
  try {
    await vpnBot().launch();
  } catch (error) {
    console.error("Ошибка запуска", error);
  }
})();
