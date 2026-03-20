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
  exitButton,
} = require("../../components/buttons");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const dayjs = require("dayjs");
const { getSubscriptionUrlByPhone } = require("../../utils/remnawave");

const exitScene = async (ctx) => {
  ctx.scene.leave();
  ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
};

const checkUserScene = new Scenes.WizardScene(
  SCENE_IDS.CHECK_USER,
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
      console.log("user", dbUser);
      const subscriptionUrl = await getSubscriptionUrlByPhone(phone);

      console.log("subscriptionUrl", subscriptionUrl);

      if (!dbUser) {
        ctx.reply(`Пользователь с номером ${phone} отсутствует в БД`);
        await exitScene(ctx);
        return;
      }

      const statusText = dbUser.isActive ? "🟢 Активен" : "🔴 Не активен";
      const server =
        dbUser?.serverPrefix?.substring(0, dbUser?.serverPrefix?.length - 1) ??
        "FIRST";
      const expiredDateText = `Дата окончания оплаченного периода: ${dayjs(
        dbUser.expiredDate,
      ).format("DD.MM.YYYY")}`;

      ctx.replyWithMarkdown(
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
      }
    } catch (error) {
      ctx.reply("Произошла ошибка при миграции пользователя");
      console.error(error);
    } finally {
      await exitScene(ctx);
    }
  },
);

checkUserScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { checkUserScene };
