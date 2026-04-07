const { exitButton } = require("../../components/buttons");
const { DEVELOPER_CONTACT } = require("../../constants");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);

  if (dbUser) {
    await ctx.reply(
      `Если у вас возникли проблемы с подключением VPN, то посмотрите информацию из статьи ниже:\nhttps://naklokov.yonote.ru/share/95d8eb4c-7478-40a4-a674-d69429c7eb6a`,
    );

    await ctx.reply(
      `\nЕсли вы оплатили подписку, но не можете подключиться, то посмотрите информацию из статьи ниже:\nhttps://naklokov.yonote.ru/share/39f0bc0e-481f-4fe4-8485-51fb51b6e00e`,
    );

    await ctx.reply(
      `\nЕсли ваша проблема не решена, напишите нам 👉 ${DEVELOPER_CONTACT}`,
      exitButton,
    );

    await ctx.reply(
      `Для оперативного решения проблемы сразу укажите ваш логин \`${dbUser.phone}\` и на каком устройстве вы используете ВПН`,
      { parse_mode: "MarkdownV2" },
    );

    return;
  }

  await ctx.reply(
    `Если у вас возникли вопросы, пишите 👉 ${DEVELOPER_CONTACT}`,
    exitButton,
  );
};
