const { PHONE_REGEXP } = require("../../constants");
const { showMainMenu } = require("../../utils/scene-ui");

module.exports = async (ctx) => {
  const referralUserLogin = ctx?.startPayload;
  if (referralUserLogin) {
    if (PHONE_REGEXP.test(referralUserLogin)) {
      if (!ctx.session) {
        ctx.session = {};
      }
      ctx.session.referralUserLogin = referralUserLogin;
    } else {
      ctx.reply(
        "⚠️ Ваша реферральная ссылка некорректна, обратитесь к человеку кто вам её отправил",
      );
    }
  }

  await showMainMenu(ctx, { forceNew: true });
};
