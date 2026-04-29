const { Scenes } = require("telegraf");
const { SCENE_IDS, USERS_TEXT } = require("../../constants");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { buildPaymentUrl } = require("../../utils/registration-link");
const {
  exitButton,
  getMainMenu,
  hideButtons,
} = require("../../components/buttons");

const payScene = new Scenes.WizardScene(SCENE_IDS.PAY, async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);

  if (!dbUser?.phone) {
    await ctx.reply(
      "Вы пока что не зарегистрированы в системе, пройдите регистрацию",
    );
  } else {
    const paymentUrl = buildPaymentUrl({
      phone: String(dbUser.phone).replace(/\D/g, ""),
    });

    await ctx.replyWithHTML(
      `Для оплаты подписки ВПН перейдите по ссылке ниже 👇👇👇
      \n<a href="${paymentUrl}">${paymentUrl}</a>`,
      {
        ...exitButton,
        link_preview_options: { is_disabled: false },
      },
    );
  }

  await ctx.scene.leave();
  await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
});

module.exports = { payScene };
