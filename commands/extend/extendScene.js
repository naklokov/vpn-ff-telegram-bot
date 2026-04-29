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
const logger = require("../../utils/logger");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { normalizeRuPhoneToMsisdn } = require("../../utils/phone");
const { usersConnector } = require("../../server");

const exitScene = async (ctx) => {
  await ctx.scene.leave();
  await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
};

const extendScene = new Scenes.WizardScene(
  SCENE_IDS.EXTEND,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    if (chatId !== ADMIN_CHAT_ID) {
      ctx.reply("Вам сюда нельзя)");
      await exitScene(ctx);
      return;
    }

    ctx.reply("Введите логин пользователя", exitButtonScene);
    return ctx.wizard.next();
  },
  async (ctx) => {
    // инициализация формы пользователя
    ctx.wizard.state.extend = {};
    const userPhone = normalizeRuPhoneToMsisdn(ctx.message?.text);
    if (!userPhone || !PHONE_REGEXP.test(userPhone)) {
      ctx.reply("Логин введён некорректно", exitButtonScene);
      return;
    }

    ctx.wizard.state.extend.login = userPhone;
    ctx.reply("Введите количество месяцев для продления", exitButtonScene);
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const payedMonths = parseInt(ctx.message.text, 10);
      if (isNaN(payedMonths)) {
        ctx.reply("Количество месяцев введено некорректно", exitButtonScene);
        return;
      }
      ctx.wizard.state.extend.months = payedMonths;
      const phone = ctx?.wizard?.state?.extend?.login;
      const months = payedMonths;

      if (!phone || !months) {
        throw Error("Некорректные данные для продления периода");
      }

      // Продление полностью выполняется на сервере.
      await usersConnector.extendUserByPhone(phone, months);
      await ctx.reply(`Пользователь ${phone} успешно продлён на ${months} мес`);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Произошла ошибка при продлении периода";
      ctx.reply(message);
      logger.error("Произошла ошибка при продлении периода");
      throw Error(error);
    } finally {
      await exitScene(ctx);
    }
  },
);

extendScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { extendScene };
