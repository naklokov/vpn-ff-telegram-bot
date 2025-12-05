const { Scenes } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  USERS_TEXT,
} = require("../../constants");
const {
  getMainMenu,
  hideButtons,
  exitButtonScene,
} = require("../../components/buttons");
const { usersConnector } = require("../../db");
const {
  getUserPersonalDataFromContext,
  getExpiredDate,
} = require("../../utils/common");
const {
  addRemnawaveUser,
  updateRemnawaveUserByPhone,
} = require("../../utils/remnawave");

const exitScene = async (ctx) => {
  ctx.scene.leave();
  ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
};

const migrateScene = new Scenes.WizardScene(
  SCENE_IDS.MIGRATE,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      ctx.reply("Вам сюда нельзя)");
      await exitScene(ctx);
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
        ctx.reply(`Пользователь с номером ${phone} отсутствует в БД`);
        await exitScene(ctx);
        return;
      }

      // изменение типа пользователя в БД (мигрирован на Remnawave)
      await usersConnector.updateUserByPhone(phone, { isVless: true });

      // добавление/обновление пользователя в Remnawave
      const expiredDate = getExpiredDate(dbUser?.expiredDate);

      try {
        // сначала пробуем обновить пользователя по username (phone)
        await updateRemnawaveUserByPhone(dbUser.phone, {
          expireAt: expiredDate.toISOString(),
        });
        ctx.reply("Пользователь успешно обновлён в Remnawave");
      } catch {
        // если ошибка (например, нет такого пользователя) – пробуем создать
        try {
          await addRemnawaveUser({
            username: dbUser.phone,
            chatId: dbUser.chatId,
            description: dbUser.name,
            email: dbUser.email,
            expireAt: expiredDate.toISOString(),
          });
          ctx.reply("Пользователь успешно добавлен в Remnawave");
        } catch (createError) {
          ctx.reply("Произошла ошибка при миграции пользователя в Remnawave");
          console.error("Remnawave migrate error:", createError);
        }
      }
    } catch (error) {
      ctx.reply("Произошла ошибка при миграции пользователя");
      console.error(error);
    } finally {
      await exitScene(ctx);
    }
  },
);

migrateScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { migrateScene };
