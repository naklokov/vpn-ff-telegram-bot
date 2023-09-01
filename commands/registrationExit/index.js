const { CMD_TEXT } = require("../../constants");

module.exports = {
  registrationExitCommand: (ctx) => {
    ctx.reply(CMD_TEXT.registrationExit, {
      reply_markup: { remove_keyboard: true },
    });
  },
};
