const { CALLBACK_QUERY_DATA } = require("../../../constants");
const { usersConnector } = require("../../../db");
const { getUserPersonalDataFromContext } = require("../../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    await ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  await ctx.replyWithMarkdown(`
      *Данные для входа* (_копируются по клику_)
- Ваш логин: \`${user.phone}\`
- Ваш пароль: \`${user.password}\`
`);

  var ipsecOptions = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "iOS",
            callback_data: CALLBACK_QUERY_DATA.instructionsIosIpsec,
          },
          {
            text: "Android",
            callback_data: CALLBACK_QUERY_DATA.instructionsAndroidIpsec,
          },
        ],
      ],
    }),
  };

  await ctx.reply("Инструкции по подключению VPN IPSEC", ipsecOptions);
};
