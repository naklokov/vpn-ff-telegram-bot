const { CMD_TEXT } = require("../constants");

module.exports = {
  registrationExitCommand: async (ctx) => {
    await ctx.reply(CMD_TEXT.registrationExit, {
      reply_markup: { remove_keyboard: true },
    });
  },

  exitCommand: async (ctx) => {
    await ctx.reply(CMD_TEXT.exit, {
      reply_markup: { remove_keyboard: true },
    });
  },
};
