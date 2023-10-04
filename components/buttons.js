const { Markup } = require("telegraf");
const { CMD_TEXT } = require("../constants");

const registrationExitButton = Markup.keyboard([
  [CMD_TEXT.registrationExit],
]).resize();

const exitButton = Markup.keyboard([[CMD_TEXT.exit]]).resize();

module.exports = { registrationExitButton, exitButton };
