const { Markup } = require("telegraf");
const { CMD_TEXT } = require("../constants");

const registrationExitButton = Markup.keyboard([
  [CMD_TEXT.registrationExit],
]).resize();

module.exports = { registrationExitButton };
