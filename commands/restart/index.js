const { ADMIN_CHAT_ID } = require("../../constants");
const { restartBot } = require("../../scripts/restart-service");

const logger = require("../../utils/logger");

module.exports = async (ctx) => {
  if (ctx.message.chat.id !== ADMIN_CHAT_ID) {
    ctx.scene.leave();
    return;
  }
  try {
    restartBot();
    await ctx.reply("Бот перезагружен");
  } catch (error) {
    await ctx.reply("Произошла ошибка при перезагрузке бота");
    logger.error(error, ctx.message.chat.id);
  }
};
