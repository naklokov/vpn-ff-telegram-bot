const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitButton } = require("../../components/buttons");
const { buildRegistrationUrl } = require("../../utils/registration-link");

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
    `Держи ссылку на регистрацию 😉
${buildRegistrationUrl(String(user.phone).replace(/\D/g, ""))}`,
    exitButton,
  );
};
