const {
  CALLBACK_QUERY_DATA,
  IOS_INSTRUCTIONS_LINK,
  ANDROID_INSTRUCTIONS_LINK,
} = require("../../../constants");
const { usersConnector } = require("../../../db");
const { getUserPersonalDataFromContext } = require("../../../utils/common");
const { getVlessConnectionString } = require("../../../utils/vless");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  if (user.isVless) {
    const connectionString = await getVlessConnectionString(
      user.phone,
      user?.serverPrefix ?? "",
    );

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
              text: "iPhone (Macbook)",
              callback_data: CALLBACK_QUERY_DATA.instructionsIosVless,
            },
            {
              text: "Android",
              callback_data: CALLBACK_QUERY_DATA.instructionsAndroidVless,
            },
          ],
          [
            {
              text: "Windows",
              callback_data: CALLBACK_QUERY_DATA.instructionsWindowsVless,
            },
            {
              text: "Keenetic",
              callback_data: CALLBACK_QUERY_DATA.instructionsKeeneticVless,
            },
          ],
        ],
      }),
    };

    await ctx.reply("Инструкции по подключению VPN VLESS", vlessOptions);
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
