const { exitButton } = require("../../components/buttons");
const { buildRegistrationUrl } = require("../../utils/registration-link");
const { getUserPersonalDataFromContext } = require("../../utils/common");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const registrationUrl = buildRegistrationUrl({ chatId });
  await ctx.reply(
    `Для регистрации откройте страницу:\n${registrationUrl}`,
    exitButton,
  );
};
