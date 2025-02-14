const { Scenes } = require("telegraf");
const { SCENE_IDS, ADMIN_CHAT_ID, USERS_TEXT } = require("../../constants");
const {
  hideButtons,
  getMainMenu,
  exitButtonScene,
} = require("../../components/buttons");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");

const exitScene = async (ctx) => {
  ctx.scene.leave();
  ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
};

const ruporScene = new Scenes.WizardScene(
  SCENE_IDS.RUPOR,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      await ctx.reply("Вам сюда нельзя)");
      await exitScene(ctx);
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
      await exitScene(ctx);
    }
  },
);

ruporScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { ruporScene };
