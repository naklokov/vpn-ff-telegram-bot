const { usersConnector } = require("../../../server");
const { getUserPersonalDataFromContext } = require("../../../utils/common");
const { getSubscriptionUrlByPhone } = require("../../../utils/remnawave");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  const subscriptionUrl = await getSubscriptionUrlByPhone(user.phone);
  await ctx.reply(
    "В рамках вашей подписки вы можете подключить до 3х устройств включительно.\n\n" +
      "Для подключения устройства перейдите по ссылке ниже и следуйте пошаговой инструкции 👇👇👇\n" +
      `${subscriptionUrl}`,
  );
};
