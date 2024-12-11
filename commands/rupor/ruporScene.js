const { Scenes, Markup } = require("telegraf");
const { SCENE_IDS, CMD_TEXT, ADMIN_CHAT_ID } = require("../../constants");
const { exitCommand } = require("../../components/exit");
const { exitButton } = require("../../components/buttons");
const { usersConnector } = require("../../db");

const ruporScene = new Scenes.WizardScene(
  SCENE_IDS.RUPOR,
  async (ctx) => {
    if (ctx.message.chat.id !== ADMIN_CHAT_ID) {
      ctx.scene.leave();
      return;
    }

    await ctx.reply("Введите текст сообщения всем пользователям", {
      ...exitButton,
    });
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
      exitCommand(ctx);
      ctx.scene.leave();
    }
  },
);

ruporScene.hears(CMD_TEXT.exit, async (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { ruporScene };
