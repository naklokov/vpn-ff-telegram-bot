const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitButton } = require("../../components/buttons");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    await ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  await ctx.replyWithMarkdown(
    `Перешли ссылку ниже другу и получи месяц ВПН бесплатно!

Если зарегистрированный по ссылке пользователь продолжит использование ВПН после бесплатного периода, то ты автоматически получишь продление на месяц *бесплатно*!

Сообщение ниже можно переслать 👇
`,
  );

  await ctx.reply(
    `Держи крутой ВПН 😉
https://t.me/friendly_vpn_ff_bot?start=${user.phone}`,
    exitButton,
  );
};
