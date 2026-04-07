const { exitButton } = require("../../components/buttons");
const { DEVELOPER_CONTACT } = require("../../constants");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);

  if (dbUser) {
    await ctx.reply(
      `Если у вас возникли проблемы с подключением VPN, то посмотрите информацию из статьи ниже:\nhttps://naklokov.yonote.ru/doc/ne-rabotaet-vpn-lgXCDKbWlQ`,
    );

    await ctx.reply(
      `\nЕсли вы оплатили подписку, но не можете подключиться, то посмотрите информацию из статьи ниже:\nhttps://naklokov.yonote.ru/doc/podpiska-okonchilas-zneDyM5lGo#b_91853_4cfea05a6980`,
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
