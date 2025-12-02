const { Scenes } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  USERS_TEXT,
  DEVELOPER_CONTACT,
  REMNAWAVE_PREFIX,
} = require("../../constants");
const {
  getMainMenu,
  hideButtons,
  exitButtonScene,
} = require("../../components/buttons");
const { usersConnector } = require("../../db");
const logger = require("../../utils/logger");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const dayjs = require("dayjs");
const {
  addRemnawaveUser,
  getSubscriptionUrlByPhone,
} = require("../../utils/remnawave");

const exitScene = async (ctx) => {
  await ctx.scene.leave();
  await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
};

const migrateToSlaveScene = new Scenes.WizardScene(
  SCENE_IDS.MIGRATE_TO_SLAVE,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      ctx.reply("Вам сюда нельзя)");
      await exitScene(ctx);
      return;
    }

    ctx.reply(
      "Введите номер телефона пользователя для миграции на новый сервер",
      exitButtonScene,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const userPhone = ctx.message.text;

      if (!PHONE_REGEXP.test(userPhone)) {
        ctx.reply(
          "Номер телефона введён некорректно. Попробуйте снова.",
          exitButtonScene,
        );
        return;
      }

      // Получаем пользователя из базы данных
      const dbUser = await usersConnector.getUserByPhone(userPhone);

      if (!dbUser) {
        ctx.reply(
          `Пользователь с номером ${userPhone} не найден в базе данных.`,
        );
        await exitScene(ctx);
        return;
      }

      // Обновляем serverPrefix пользователя
      await usersConnector.updateUserByPhone(userPhone, {
        serverPrefix: process?.env?.NEW_USER_SERVER_PREFIX,
      });

      const expiryTime = dayjs(dbUser.expiredDate).toDate();

      if (dbUser?.serverPrefix === REMNAWAVE_PREFIX) {
        await ctx.reply("Пользователь уже добавлен в REMNAWAVE");
        return;
      }

      // Добавляем/обновляем пользователя в Remnawave
      try {
        await addRemnawaveUser({
          username: dbUser.phone,
          chatId: dbUser.chatId,
          description: dbUser.name,
          email: dbUser?.email ?? "",
          expiryTime,
        });
      } catch (createError) {
        logger.error(
          "Ошибка при миграции пользователя в Remnawave (migrateToSlave):",
          createError,
        );
      }

      // Отправляем уведомление пользователю
      if (dbUser.chatId) {
        const subscriptionUrl = await getSubscriptionUrlByPhone(dbUser.phone);
        await ctx.telegram.sendMessage(
          dbUser.chatId,
          "🔄 Вы мигрированы на новый сервер!\n" +
            "Просьба перейти на него в течение трёх дней.\n\n" +
            "Для настройки VPN перейдите по ссылке ниже 👇👇👇\n" +
            `${subscriptionUrl}\n\n` +
            "Если у вас возникли вопросы, пишите 👉 " +
            DEVELOPER_CONTACT,
        );
      }

      await ctx.reply(
        `✅ Пользователь ${userPhone} успешно мигрирован на новый сервер.\n` +
          `📱 Уведомление отправлено пользователю.`,
      );
    } catch (error) {
      logger.error("Ошибка при миграции пользователя:", error);
      ctx.reply("Произошла ошибка при миграции пользователя");
    } finally {
      await exitScene(ctx);
    }
  },
);

migrateToSlaveScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { migrateToSlaveScene };
