const { exitButton } = require("../../components/buttons");
const { DEVELOPER_CONTACT } = require("../../constants");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);

  await ctx.reply(
    `Если у вас возникли вопросы, пишите 👉 ${DEVELOPER_CONTACT}`,
    exitButton,
  );

  if (dbUser) {
    await ctx.reply(
      `Для оперативного решения проблемы сразу укажите ваш логин \`${dbUser.phone}\` и на каком устройстве вы используете ВПН`,
      { parse_mode: "MarkdownV2" },
    );
  }
};
