// const { exitButton } = require("../../components/buttons");
// const { CALLBACK_QUERY_DATA } = require("../../constants");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const vless = require("./vless");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    await ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  await vless(ctx);

  // var optionsIpsec = {
  //   parse_mode: "MarkdownV2",
  //   reply_markup: JSON.stringify({
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "IPSEC инструкции",
  //           callback_data: CALLBACK_QUERY_DATA.instructionsIpsec,
  //         },
  //       ],
  //     ],
  //   }),
  // };
  // var optionsVless = {
  //   parse_mode: "MarkdownV2",
  //   reply_markup: JSON.stringify({
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "VLESS инструкции",
  //           callback_data: CALLBACK_QUERY_DATA.instructionsVless,
  //         },
  //       ],
  //     ],
  //   }),
  // };

  // await ctx.reply("Выберите сервер для настройки", exitButton);

  // user.isVless &&
  //   (await ctx.reply(
  //     `*VLESS* \\- основной ВПН, крайне редко блокируется провайдерами, легко настраивается`,
  //     optionsVless,
  //   ));

  // await ctx.reply(
  //   `*IPSEC* \\- лёгкий и быстрый ВПН, альтернатива если первый вариант работает плохо\\. Изначально первые пользователи использовали его`,
  //   optionsIpsec,
  // );
};
