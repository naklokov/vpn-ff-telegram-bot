const { Scenes, Markup } = require("telegraf");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  CMD_TEXT,
} = require("../../constants");
const { exitButton } = require("../../components/buttons");
const { exitCommand } = require("../../components/exit");
const { extendUser } = require("./utils");
const logger = require("../../utils/logger");

const extendScene = new Scenes.WizardScene(
  SCENE_IDS.EXTEND,
  (ctx) => {
    if (ctx.message.chat.id !== ADMIN_CHAT_ID) {
      ctx.scene.leave();
      return;
    }

    ctx.reply("Введите логин пользователя", {
      ...exitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    // инициализация формы пользователя
    ctx.wizard.state.extend = {};
    const userPhone = ctx.message.text;
    if (!PHONE_REGEXP.test(userPhone)) {
      ctx.reply("Логин введён некорректно", { ...exitButton });
      return;
    }

    ctx.wizard.state.extend.login = userPhone;
    ctx.reply("Введите количество месяцев для продления", {
      ...exitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const payedMonths = parseInt(ctx.message.text, 10);
      if (isNaN(payedMonths)) {
        ctx.reply("Количество месяцев введено некорректно", { ...exitButton });
        return;
      }
      ctx.wizard.state.extend.months = payedMonths;
      const phone = ctx?.wizard?.state?.extend?.login;
      const months = payedMonths;

      if (!phone || !months) {
        throw Error("Некорректные данные для продления периода");
      }

      // продление пользователя в БД и ВПН сервере
      await extendUser(phone, months, ctx);

      // проверяем рефералку (если пользователь зарегистрирован менее месяца назад) и продлеваем
    } catch (error) {
      ctx.reply("Произошла ошибка при продлении периода");
      logger.error(error);
    } finally {
      exitCommand(ctx);
      ctx.scene.leave();
    }
  },
);

extendScene.hears(CMD_TEXT.exit, async (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { extendScene };
