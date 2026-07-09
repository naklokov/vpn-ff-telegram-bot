const { Scenes } = require("telegraf");
const { SCENE_IDS, ADMIN_CHAT_ID, USERS_TEXT } = require("../../constants");
const { exitButtonScene } = require("../../components/buttons");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitToMenu } = require("../../utils/scene-ui");

const ruporScene = new Scenes.WizardScene(
  SCENE_IDS.RUPOR,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      await ctx.reply("Вам сюда нельзя)");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    await ctx.reply(
      "Введите текст сообщения всем пользователям",
      exitButtonScene,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const users = await usersConnector.getUsers();

      await users.forEach(async ({ chatId }) => {
        if (chatId && !!ctx.message.text) {
          await ctx.telegram.sendMessage(chatId, ctx.message.text);
        }
      });
    } catch (error) {
      ctx.reply("Произошла ошибка при отправке сообщения");
      console.error(error);
    } finally {
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
    }
  },
);

ruporScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { ruporScene };
