// const { exitButton } = require("../../components/buttons");
// const { CALLBACK_QUERY_DATA } = require("../../constants");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const vless = require("./vless");
const remnawave = require("./remnawave");
const { REMNAWAVE_PREFIX } = require("../../constants");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    await ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  if (user.serverPrefix === REMNAWAVE_PREFIX) {
    await remnawave(ctx);
  } else {
    await vless(ctx);
  }
};
