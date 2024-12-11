const {
  CMD,
  CALLBACK_QUERY_DATA,
  IOS_INSTRUCTIONS_LINK,
  ANDROID_INSTRUCTIONS_LINK,
} = require("../../constants");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { getVlessConnectionString } = require("../../utils/vless");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`,
    );
    return;
  }

  if (user.isVless) {
    const connectionString = await getVlessConnectionString(user.phone);

    await ctx.reply(
      "Для подключения скопируйте строку ниже, нажав на неё, и следуйте нужной инструкции",
    );
    await ctx.reply(`\`${connectionString}\``, {
      parse_mode: "MarkdownV2",
    });

    var vlessOptions = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "iOS (Macbook)",
              callback_data: CALLBACK_QUERY_DATA.instructionsIos,
            },
          ],
          [
            {
              text: "Android",
              callback_data: CALLBACK_QUERY_DATA.instructionsAndroid,
            },
          ],
          [
            {
              text: "Windows",
              callback_data: CALLBACK_QUERY_DATA.instructionsWindows,
            },
          ],
        ],
      }),
    };

    await ctx.reply("Инструкции по подключению VPN", vlessOptions);
    return;
  }

  var options = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "IOS (Apple)", url: IOS_INSTRUCTIONS_LINK }],
        [{ text: "Android", url: ANDROID_INSTRUCTIONS_LINK }],
      ],
    }),
  };
  await ctx.reply(
    `Логин и пароль ниже копируются по клику

логин: \`${user?.phone}\`
пароль: \`${user?.password}\``,
    { parse_mode: "MarkdownV2" },
  );
  await ctx.reply("Инструкции по подключению VPN", options);
};
