require("dotenv").config();

const mongoose = require("mongoose");
const vpnBot = require("./vpn-ff-bot");

(async function () {
  try {
    // await mongoose.connect(process.env.BD_TOKEN, {
    //   dbName: "vpnBot",
    // });
    await vpnBot().launch();
  } catch (error) {
    console.error("Ошибка запуска", error);
  }
})();
