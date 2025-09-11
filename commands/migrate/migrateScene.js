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
const {
  addVlessUser,
  updateVlessUser,
  getVlessClient,
} = require("../../utils/vless");
const { usersConnector } = require("../../db");
const {
  convertToUnixDate,
  getUserPersonalDataFromContext,
} = require("../../utils/common");

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

      // изменение типа пользователя в БД (мигрирован / не мигрирован)
      await usersConnector.updateUserByPhone(phone, { isVless: true });
      // добавление пользователя в консоль VPN
      const expiryTime = convertToUnixDate(new Date(dbUser?.expiredDate));
      const isVlessExist = await getVlessClient(dbUser.phone);

      if (isVlessExist) {
        await updateVlessUser({
          chatId: dbUser.chatId,
          phone: dbUser.phone,
          serverPrefix: dbUser.serverPrefix,
          expiryTime,
        });
      } else {
        await addVlessUser({
          chatId: dbUser.chatId,
          phone: dbUser.phone,
          serverPrefix: dbUser.serverPrefix,
          expiryTime,
        });
      }

      if (isVlessExist) {
        ctx.reply("Пользователь успешно изменён в x-ui");
      } else {
        ctx.reply("Пользователь успешно добавлен в x-ui");
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
