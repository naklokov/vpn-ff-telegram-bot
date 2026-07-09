const { Scenes } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  USERS_TEXT,
} = require("../../constants");
const {
  exitButtonScene,
  exitButton,
} = require("../../components/buttons");
const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const dayjs = require("dayjs");
const { getSubscriptionUrlByPhone } = require("../../utils/remnawave");
const { normalizeRuPhoneToMsisdn } = require("../../utils/phone");
const { exitToMenu } = require("../../utils/scene-ui");

const checkUserScene = new Scenes.WizardScene(
  SCENE_IDS.CHECK_USER,
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
    const normalizedPhone = normalizeRuPhoneToMsisdn(ctx.message?.text);
    if (!normalizedPhone || !PHONE_REGEXP.test(normalizedPhone)) {
      ctx.reply("Логин введён некорректно", exitButtonScene);
      return;
    }

    let keepLastBotMessages = 1;

    try {
      const dbUser = await usersConnector.getUserByPhone(normalizedPhone);
      const subscriptionUrl = await getSubscriptionUrlByPhone(normalizedPhone);

      if (!dbUser) {
        await ctx.reply(`Пользователь с номером ${normalizedPhone} отсутствует в БД`);
        await exitToMenu(ctx, { keepLastBotMessages: 1 });
        return;
      }

      const statusText = dbUser.isActive ? "🟢 Активен" : "🔴 Не активен";
      const server =
        dbUser?.serverPrefix?.substring(0, dbUser?.serverPrefix?.length - 1) ??
        "FIRST";
      const expiredDateText = `Дата окончания оплаченного периода: ${dayjs(
        dbUser.expiredDate,
      ).format("DD.MM.YYYY")}`;

      await ctx.replyWithMarkdown(
        `
*Состояние подключения*
- ${statusText}
- ${expiredDateText}
- Сервер *${server}*
`,
        exitButton,
      );

      if (subscriptionUrl) {
        await ctx.reply(subscriptionUrl);
        keepLastBotMessages = 2;
      }
    } catch (error) {
      await ctx.reply("Произошла ошибка при миграции пользователя");
      console.error(error);
    }

    await exitToMenu(ctx, { keepLastBotMessages });
  },
);

checkUserScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { checkUserScene };
