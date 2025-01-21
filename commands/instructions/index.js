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

  var optionsIpsec = {
    parse_mode: "MarkdownV2",
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "IPSEC инструкции",
            callback_data: CALLBACK_QUERY_DATA.instructionsIpsec,
          },
        ],
      ],
    }),
  };
  var optionsVless = {
    parse_mode: "MarkdownV2",
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "VLESS инструкции",
            callback_data: CALLBACK_QUERY_DATA.instructionsVless,
          },
        ],
      ],
    }),
  };
  await ctx.reply("Выберите сервер для настройки");
  await ctx.reply(
    `*IPSEC* \\- лёгкий и быстрый ВПН, чаще работает шустрее чем VLESS, но иногда попадает под блокировки`,
    optionsIpsec,
  );

  user.isVless &&
    (await ctx.reply(
      `*VLESS* \\- более зашифрованный ВПН, крайне редко блокируется провайдерами, но иногда работает чуть медленнее \\(особенно на ios\\)`,
      optionsVless,
    ));
};
