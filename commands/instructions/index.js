const { CMD, CALLBACK_QUERY_DATA } = require("../../constants");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    await ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`,
    );
    return;
  }

  var options = {
    parse_mode: "MarkdownV2",
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "IPSEC",
            callback_data: CALLBACK_QUERY_DATA.instructionsIpsec,
          },
          {
            text: "VLESS",
            callback_data: CALLBACK_QUERY_DATA.instructionsVless,
          },
        ],
      ],
    }),
  };

  await ctx.reply(
    `Вам доступны на выбор два сервера выберите нужную вам инструкцию и настройте ВПН
    
*IPSEC* \\- лёгкий и быстрый ВПН, чаще работает шустрее чем VLESS, но иногда попадает под блокировки
*VLESS* \\- более зашифрованный ВПН, крайне редко блокируется провайдерами, но иногда работает чуть медленнее \\(особенно на ios\\)
    `,
    options,
  );
};
