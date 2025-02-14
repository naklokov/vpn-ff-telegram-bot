const { getMainMenu } = require("../../components/buttons");
const { PHONE_REGEXP } = require("../../constants");
const { getMarkdownContentSync } = require("../../utils/common");
const path = require("path");

module.exports = async (ctx) => {
  const startReplyContent = getMarkdownContentSync(
    path.dirname(__filename) + "/content.md",
  );

  // прихраниваем логин пригласившего пользователя
  const referralUserLogin = ctx?.startPayload;
  if (referralUserLogin) {
    if (PHONE_REGEXP.test(referralUserLogin)) {
      ctx.session.referralUserLogin = referralUserLogin;
    } else {
      ctx.reply(
        "⚠️ Ваша реферральная ссылка некорректна, обратитесь к человеку кто вам её отправил",
      );
    }
  }

  await ctx.reply(startReplyContent, await getMainMenu(ctx));
};
