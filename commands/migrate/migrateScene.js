const { Scenes, Markup } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  CMD_TEXT,
} = require("../../constants");
const { exitButton } = require("../../components/buttons");
const { exitCommand } = require("../../components/exit");
const {
  addVlessUser,
  updateVlessUser,
  getVlessClient,
} = require("../../utils/vless");
const { usersConnector } = require("../../db");
const { convertToUnixDate } = require("../../utils/common");

const migrateScene = new Scenes.WizardScene(
  SCENE_IDS.MIGRATE,
  (ctx) => {
    if (ctx.message.chat.id !== ADMIN_CHAT_ID) {
      ctx.scene.leave();
      return;
    }
    // инициализация формы пользователя
    ctx.wizard.state.extend = {};

    ctx.reply("Введите логин пользователя", {
      ...exitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    const phone = ctx.message.text;
    if (!PHONE_REGEXP.test(phone)) {
      ctx.reply("Логин введён некорректно", { ...exitButton });
      return;
    }

    try {
      const dbUser = await usersConnector.getUserByPhone(phone);

      if (!dbUser) {
        ctx.reply(`Пользователь с номером ${phone} отсутствует в БД`);
        await exitCommand(ctx);
        await ctx.scene.leave();
        return;
      }

      // изменение типа пользователя в БД (мигрирован / не мигрирован)
      await usersConnector.updateUserByPhone(phone, { isVless: true });
      // добавление пользователя в консоль VPN
      const expiryTime = convertToUnixDate(new Date(dbUser?.expiredDate));

      // проверяем наличие пользователя в VLESS
      const isExist = await getVlessClient(dbUser.phone);
      if (isExist) {
        await updateVlessUser({
          chatId: dbUser.chatId,
          phone: dbUser.phone,
          expiryTime,
        });
      } else {
        await addVlessUser({
          chatId: dbUser.chatId,
          phone: dbUser.phone,
          expiryTime,
        });
      }

      ctx.reply("Пользователь успешно мигрирован");

      if (!dbUser.isVless) {
        await ctx.telegram.sendMessage(
          dbUser.chatId,
          'Перенёс вас на новый сервер, чтобы подключить новый ВПН нажмите на команду /instructions, или выберите внизу в "Меню" -> "Инструкции по подключению',
        );
      }
    } catch (error) {
      ctx.reply("Произошла ошибка при миграции пользователя");
      console.error(error);
    } finally {
      exitCommand(ctx);
      ctx.scene.leave();
    }
  },
);

migrateScene.hears(CMD_TEXT.exit, async (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { migrateScene };
