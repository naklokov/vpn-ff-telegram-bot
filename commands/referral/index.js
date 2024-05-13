const { usersConnector } = require('../../db');
const { getUserPersonalDataFromContext } = require('../../utils/common');
const { CMD } = require('../../constants');

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`
    );
    return;
  }

  ctx.replyWithMarkdown(
    `Отправь ссылку другу и получи месяц ВПН бесплатно!

Если зарегистрированный по этой ссылке пользователь продолжит использование ВПН через месяц, то ты автоматически получишь продление на месяц бесплатно!

\`Держи крутой ВПН 
https://t.me/friendly_vpn_ff_bot?start=${user.phone}\``
  );
};
