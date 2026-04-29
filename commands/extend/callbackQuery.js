const {
  CALLBACK_QUERY_DATA_DELIMETER,
  CALLBACK_QUERY_DATA,
} = require("../../constants");
const { getUserByChatId, extendUserByPhone } = require("../../server/users");
const logger = require("../../utils/logger");

const extendOnErrorCallbackQuery = async (ctx, queryData) => {
  const [callbackQueryDataType, chatId, months = 0] =
    queryData.split(CALLBACK_QUERY_DATA_DELIMETER) || [];

  if (callbackQueryDataType === CALLBACK_QUERY_DATA.extendOnError) {
    if (chatId) {
      const dbUser = await getUserByChatId(chatId);
      try {
        await extendUserByPhone(dbUser.phone, Number(months));
        await ctx.reply(`Пользователь ${dbUser.phone} успешно продлён на ${months} мес`);
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Произошла ошибка при продлении периода";
        ctx.reply(message);
        logger.error("Произошла ошибка при продлении периода");
        throw Error(error);
      }
    }
  }
};

module.exports = { extendOnErrorCallbackQuery };
