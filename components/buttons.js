const { Markup } = require("telegraf");
const { CMD_TEXT } = require("../constants");

const mainMenu = Markup.keyboard([
  [CMD_TEXT.registration, CMD_TEXT.info, CMD_TEXT.help],
]).resize();

const backMenu = Markup.keyboard([[CMD_TEXT.menu]]);

module.exports = { mainMenu, backMenu };
