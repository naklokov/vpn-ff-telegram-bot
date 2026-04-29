const { exitButton } = require("../../components/buttons");
const { buildRegistrationUrl } = require("../../utils/registration-link");

module.exports = async (ctx) => {
  const registrationUrl = buildRegistrationUrl();
  await ctx.reply(
    `Для регистрации откройте страницу:\n${registrationUrl}`,
    exitButton,
  );
};
