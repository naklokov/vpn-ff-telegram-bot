const { Scenes } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  USERS_TEXT,
} = require("../../constants");
const { exitButtonScene } = require("../../components/buttons");
const { usersConnector } = require("../../server");
const {
  getUserPersonalDataFromContext,
  getExpiredDate,
} = require("../../utils/common");
const {
  addRemnawaveUser,
  updateRemnawaveUserByPhone,
} = require("../../utils/remnawave");
const { exitToMenu } = require("../../utils/scene-ui");

const migrateScene = new Scenes.WizardScene(
  SCENE_IDS.MIGRATE,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      ctx.reply("Вам сюда нельзя)");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }
    // инициализация формы пользователя
    ctx.wizard.state.extend = {};

    ctx.reply("Введите логин пользователя", exitButtonScene);
    return ctx.wizard.next();
  },
  async (ctx) => {
    const phone = ctx.message?.text;
    if (!PHONE_REGEXP.test(phone)) {
      ctx.reply("Логин введён некорректно", exitButtonScene);
      return;
    }

    try {
      const dbUser = await usersConnector.getUserByPhone(phone);

      if (!dbUser) {
        await ctx.reply(`Пользователь с номером ${phone} отсутствует в БД`);
        await exitToMenu(ctx, { keepLastBotMessages: 1 });
        return;
      }

      await usersConnector.updateUserByPhone(phone, { isVless: true });

      const expiredDate = getExpiredDate(dbUser?.expiredDate);

      try {
        await updateRemnawaveUserByPhone(dbUser.phone, {
          expireAt: expiredDate.toISOString(),
        });
        await ctx.reply("Пользователь успешно обновлён в Remnawave");
      } catch {
        try {
          await addRemnawaveUser({
            username: dbUser.phone,
            chatId: dbUser.chatId,
            description: dbUser.name,
            expireAt: expiredDate.toISOString(),
            email: dbUser?.email,
          });
          await ctx.reply("Пользователь успешно добавлен в Remnawave");
        } catch (createError) {
          await ctx.reply("Произошла ошибка при миграции пользователя в Remnawave");
          console.error("Remnawave migrate error:", createError);
        }
      }
    } catch (error) {
      await ctx.reply("Произошла ошибка при миграции пользователя");
      console.error(error);
    }

    await exitToMenu(ctx, { keepLastBotMessages: 1 });
  },
);

migrateScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { migrateScene };
