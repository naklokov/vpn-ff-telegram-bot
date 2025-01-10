const {
  ADMIN_CHAT_ID,
  CALLBACK_QUERY_DATA_DELIMETER,
  CALLBACK_QUERY_DATA,
} = require("../../constants");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { usersConnector } = require("../../db");

const sendAdminPaymentInfo = async (isPayCorrect, ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);
  const months = ctx.wizard.state?.extend?.months ?? 0;

  const message = isPayCorrect ? "Оплата прошла" : "⚠️ ОПЛАТА НЕ ПРОШЛА";

  await ctx.forwardMessage(ADMIN_CHAT_ID, ctx.message.text);
  var extendOptions = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "Продлить",
            callback_data: `${CALLBACK_QUERY_DATA.extendOnError}${CALLBACK_QUERY_DATA_DELIMETER}${dbUser.chatId}${CALLBACK_QUERY_DATA_DELIMETER}${months}`,
          },
        ],
      ],
    }),
  };

  await ctx.telegram.sendMessage(
    ADMIN_CHAT_ID,
    `${message}
\`${dbUser.phone}\` ${months} мес`,
    { parse_mode: "MarkdownV2", ...(!isPayCorrect ? extendOptions : {}) },
  );
};

module.exports = { sendAdminPaymentInfo };
