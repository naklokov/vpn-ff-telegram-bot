const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { CMD, FREE_PERIOD_DAYS } = require("../../constants");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`,
    );
    return;
  }

  ctx.replyWithMarkdown(
    `Перешли ссылку ниже другу и получи месяц ВПН бесплатно!

Если зарегистрированный по ссылке пользователь продолжит использование ВПН через ${FREE_PERIOD_DAYS} дней, то ты автоматически получишь продление на месяц бесплатно!

Сообщение ниже можно переслать 👇
`,
  );

  ctx.reply(
    `Держи крутой ВПН 😉
https://t.me/friendly_vpn_ff_bot?start=${user.phone}`,
  );
};
