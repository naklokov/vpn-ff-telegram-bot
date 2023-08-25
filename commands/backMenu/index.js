const { mainMenuButtons } = require("../../components/buttons");

module.exports = (ctx) =>
  ctx.reply("Вы находитесь в меню", { ...mainMenuButtons });
