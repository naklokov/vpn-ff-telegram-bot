const {
  CALLBACK_QUERY_DATA_DELIMETER,
  CALLBACK_QUERY_DATA,
} = require("../../constants");
const { getUserByChatId } = require("../../db/users");
const { extendUser } = require("./utils");
const logger = require("../../utils/logger");

const extendOnErrorCallbackQuery = async (ctx, queryData) => {
  const [callbackQueryDataType, chatId, months = 0] =
    queryData.split(CALLBACK_QUERY_DATA_DELIMETER) || [];

  if (callbackQueryDataType === CALLBACK_QUERY_DATA.extendOnError) {
    if (chatId) {
      const dbUser = await getUserByChatId(chatId);
      try {
        await extendUser(dbUser.phone, months, ctx);
      } catch (error) {
        ctx.reply("Произошла ошибка при продлении периода");
        logger.error("Произошла ошибка при продлении периода");
        throw Error(error);
      }
    }
  }
};

module.exports = { extendOnErrorCallbackQuery };
