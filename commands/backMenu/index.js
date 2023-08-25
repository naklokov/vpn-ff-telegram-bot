const { mainMenu } = require("../../components/buttons");

module.exports = (ctx) => ctx.reply("Вы находитесь в меню", { ...mainMenu });
