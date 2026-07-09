const { Scenes } = require("telegraf");
const { SCENE_IDS, ADMIN_CHAT_ID, USERS_TEXT } = require("../../constants");
const { exitButtonScene } = require("../../components/buttons");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitToMenu } = require("../../utils/scene-ui");
const logger = require("../../utils/logger");

const BROADCAST_DELAY_MS = 50;
const BROADCAST_MAX_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendMessageWithRetry = async (telegram, chatId, text) => {
  for (let attempt = 0; attempt < BROADCAST_MAX_RETRIES; attempt++) {
    try {
      await telegram.sendMessage(chatId, text);
      return;
    } catch (error) {
      const retryAfter = Number(error?.response?.parameters?.retry_after);
      if (retryAfter > 0 && attempt < BROADCAST_MAX_RETRIES - 1) {
        await sleep(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
};

const runBroadcast = async (telegram, adminChatId, targets, messageText) => {
  let sent = 0;
  let failed = 0;

  for (const { chatId, phone } of targets) {
    try {
      await sendMessageWithRetry(telegram, chatId, messageText);
      sent++;
    } catch (error) {
      failed++;
      logger.warn(
        `rupor: не удалось отправить сообщение пользователю ${phone} (${chatId})`,
        error?.message || error,
      );
    }

    await sleep(BROADCAST_DELAY_MS);
  }

  try {
    await telegram.sendMessage(
      adminChatId,
      `Рассылка завершена.\n\nОтправлено: ${sent}\nОшибок: ${failed}\nВсего: ${targets.length}`,
    );
  } catch (error) {
    logger.error("rupor: не удалось отправить отчёт админу", error);
  }
};

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
    const { id: adminChatId } = getUserPersonalDataFromContext(ctx);
    const messageText = ctx.message?.text?.trim();

    if (!messageText) {
      await ctx.reply("Сообщение не может быть пустым");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    try {
      const users = await usersConnector.getUsers();
      const targets = users.filter(
        ({ chatId, isActive }) => chatId && isActive !== false,
      );

      await ctx.reply(
        `Запускаю рассылку для ${targets.length} пользователей. Отчёт пришлю по завершении.`,
      );

      const telegram = ctx.telegram;
      await exitToMenu(ctx, { keepLastBotMessages: 1 });

      void runBroadcast(telegram, adminChatId, targets, messageText);
    } catch (error) {
      logger.error("rupor: ошибка при запуске рассылки", error);
      await ctx.reply("Произошла ошибка при отправке сообщения");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
    }
  },
);

ruporScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { ruporScene };
