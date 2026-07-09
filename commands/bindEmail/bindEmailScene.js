const { Scenes } = require("telegraf");
const {
  EMAIL_REGEXP,
  SCENE_IDS,
  USERS_TEXT,
  DEVELOPER_CONTACT,
} = require("../../constants");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitButtonScene } = require("../../components/buttons");
const { exitToMenu } = require("../../utils/scene-ui");

const FAIL_MESSAGE = `Проверьте что вы правильно ввели свой email, если у вас есть проблемы, обратитесь в поддержку ${DEVELOPER_CONTACT}`;

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
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    await usersConnector.updateUserByPhone(user.phone, { chatId });
    await ctx.reply("Email успешно привязан к вашему Telegram аккаунту.");
    await exitToMenu(ctx, { keepLastBotMessages: 1 });
  },
);

bindEmailScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { bindEmailScene };
