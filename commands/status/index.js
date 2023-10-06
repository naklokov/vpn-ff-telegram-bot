const dayjs = require("dayjs");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);
  const statusText = `Статус подключения: ${
    user.isActive ? "🟢 Активен" : "🔴 Не активен"
  }`;
  const expiredDateText = `Дата окончания оплаченного периода: ${dayjs(
    user.expiredDate
  ).format("DD.MM.YYYY")}`;

  ctx.replyWithMarkdown(`
*Данные для входа*
- Ваш логин: ${user.phone}
- Ваш пароль: ${user.password}

*Состояние подключения*
- ${statusText}
- ${expiredDateText}
`);
};
