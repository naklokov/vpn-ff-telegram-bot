const { Scenes } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  USERS_TEXT,
  DEVELOPER_CONTACT,
  REMNAWAVE_PREFIX,
} = require("../../constants");
const { exitButtonScene } = require("../../components/buttons");
const { usersConnector } = require("../../server");
const logger = require("../../utils/logger");
const {
  getUserPersonalDataFromContext,
  getExpiredDate,
} = require("../../utils/common");
const {
  addRemnawaveUser,
  getSubscriptionUrlByPhone,
} = require("../../utils/remnawave");
const { exitToMenu } = require("../../utils/scene-ui");

const migrateToSlaveScene = new Scenes.WizardScene(
  SCENE_IDS.MIGRATE_TO_SLAVE,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      ctx.reply("Вам сюда нельзя)");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    ctx.reply(
      "Введите номер телефона пользователя для миграции на новый сервер",
      exitButtonScene,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    let keepLastBotMessages = 1;

    try {
      const userPhone = ctx.message.text;

      if (!PHONE_REGEXP.test(userPhone)) {
        await ctx.reply(
          "Номер телефона введён некорректно. Попробуйте снова.",
          exitButtonScene,
        );
        return;
      }

      const dbUser = await usersConnector.getUserByPhone(userPhone);

      if (!dbUser) {
        await ctx.reply(
          `Пользователь с номером ${userPhone} не найден в базе данных.`,
        );
        await exitToMenu(ctx, { keepLastBotMessages: 1 });
        return;
      }

      await usersConnector.updateUserByPhone(userPhone, {
        serverPrefix: process?.env?.NEW_USER_SERVER_PREFIX,
      });

      const expiredDate = getExpiredDate(dbUser.expiredDate);

      if (dbUser?.serverPrefix === REMNAWAVE_PREFIX) {
        await ctx.reply("Пользователь уже добавлен в REMNAWAVE");
        await exitToMenu(ctx, { keepLastBotMessages: 1 });
        return;
      }

      try {
        await addRemnawaveUser({
          username: dbUser.phone,
          chatId: dbUser.chatId,
          description: dbUser.name,
          expiredAt: expiredDate.toISOString(),
          email: dbUser?.email,
        });
      } catch (createError) {
        logger.error(
          "Ошибка при миграции пользователя в Remnawave (migrateToSlave):",
          createError,
        );
      }

      if (dbUser.chatId) {
        const subscriptionUrl = await getSubscriptionUrlByPhone(dbUser.phone);
        await ctx.telegram.sendMessage(
          dbUser.chatId,
          "Доброго времени суток!\n\n" +
            "Перенёс вас на новый сервер, вам необходимо обновить настройки\n" +
            "Как это сделать описано по ссылке ниже 👇👇👇\n" +
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
      await ctx.reply("Произошла ошибка при миграции пользователя");
    }

    await exitToMenu(ctx, { keepLastBotMessages });
  },
);

migrateToSlaveScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { migrateToSlaveScene };
