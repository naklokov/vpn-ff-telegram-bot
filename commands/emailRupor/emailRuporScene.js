const { Scenes } = require("telegraf");
const { SCENE_IDS, ADMIN_CHAT_ID, USERS_TEXT } = require("../../constants");
const { exitButtonScene } = require("../../components/buttons");
const { usersConnector, mailConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitToMenu } = require("../../utils/scene-ui");
const logger = require("../../utils/logger");

const BROADCAST_DELAY_MS = 100;
const EMAIL_SUBJECT = "Сообщение от VPN FF";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hasValidEmail = (email) =>
  typeof email === "string" && email.includes("@");

const runEmailBroadcast = async (telegram, adminChatId, targets, messageText) => {
  let sent = 0;
  let failed = 0;

  try {
    for (const { email, phone } of targets) {
      try {
        await mailConnector.sendEmail({
          to: email,
          subject: EMAIL_SUBJECT,
          text: messageText,
        });
        sent++;
      } catch (error) {
        failed++;
        logger.warn(
          `emailRupor: не удалось отправить письмо пользователю ${phone} (${email}): ${error?.message || error}`,
        );
      }

      await sleep(BROADCAST_DELAY_MS);
    }
  } finally {
    try {
      await telegram.sendMessage(
        adminChatId || ADMIN_CHAT_ID,
        `Email-рассылка завершена.\n\nОтправлено: ${sent}\nОшибок: ${failed}\nВсего: ${targets.length}`,
      );
    } catch (error) {
      logger.error(error, adminChatId || ADMIN_CHAT_ID);
    }
  }
};

const emailRuporScene = new Scenes.WizardScene(
  SCENE_IDS.EMAIL_RUPOR,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      await ctx.reply("Вам сюда нельзя)");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    await ctx.reply(
      "Введите текст сообщения для рассылки на email всем пользователям с почтой",
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
      const targets = users
        .filter(({ email }) => hasValidEmail(email))
        .map(({ email, phone }) => ({
          email: String(email).trim().toLowerCase(),
          phone,
        }));

      if (targets.length === 0) {
        await ctx.reply("Нет пользователей с указанным email");
        await exitToMenu(ctx, { keepLastBotMessages: 1 });
        return;
      }

      await ctx.reply(
        `Запускаю email-рассылку для ${targets.length} пользователей. Отчёт пришлю по завершении.`,
      );

      const telegram = ctx.telegram;
      await exitToMenu(ctx, { keepLastBotMessages: 1 });

      void runEmailBroadcast(telegram, adminChatId, targets, messageText);
    } catch (error) {
      logger.error("emailRupor: ошибка при запуске рассылки", error);
      await ctx.reply("Произошла ошибка при отправке сообщения");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
    }
  },
);

emailRuporScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { emailRuporScene };
