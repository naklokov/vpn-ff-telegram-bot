const dayjs = require("dayjs");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitButton } = require("../../components/buttons");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  const statusText = user.isActive ? "🟢 Активен" : "🔴 Не активен";
  const expiredDateText = `Дата окончания оплаченного периода: ${dayjs(
    user.expiredDate,
  ).format("DD.MM.YYYY")}`;

  ctx.replyWithMarkdown(
    `
*Инструкции по подключению*
/instructions

*Состояние подключения*
- ${statusText}
- ${expiredDateText}
`,
    exitButton,
  );
};
