const { Scenes } = require("telegraf");
const {
  EMAIL_REGEXP,
  SCENE_IDS,
  USERS_TEXT,
  DEVELOPER_CONTACT,
} = require("../../constants");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const {
  exitButtonScene,
  hideButtons,
  getMainMenu,
} = require("../../components/buttons");

const FAIL_MESSAGE = `Вы уже заведены в системе, проверьте правильность введённых данных или обратитесь в поддержку ${DEVELOPER_CONTACT}`;

const bindEmailScene = new Scenes.WizardScene(
  SCENE_IDS.BIND_EMAIL,
  async (ctx) => {
    await ctx.reply(
      "Введите email, который указывали при регистрации:",
      exitButtonScene,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const email = (ctx.message?.text || "").trim().toLowerCase();
    if (!EMAIL_REGEXP.test(email)) {
      await ctx.reply("Введите корректный email.");
      return;
    }

    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const user = await usersConnector.getUserByEmail(email);

    if (!user?.phone || user.chatId) {
      await ctx.reply(FAIL_MESSAGE);
      await ctx.scene.leave();
      await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
      await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
      return;
    }

    await usersConnector.updateUserByPhone(user.phone, { chatId });
    await ctx.reply("Email успешно привязан к вашему Telegram аккаунту.");
    await ctx.scene.leave();
    await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
    await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
  },
);

bindEmailScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await ctx.scene.leave();
  await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
});

module.exports = { bindEmailScene };
