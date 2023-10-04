const { Scenes, Markup } = require("telegraf");
const dayjs = require("dayjs");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  CMD_TEXT,
} = require("../../constants");
const { exitCommand } = require("../registrationExit");
const { exitButton } = require("../../components/buttons");
const { usersConnector } = require("../../db");

const extendScene = new Scenes.WizardScene(
  SCENE_IDS.EXTEND,
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
    if (!PHONE_REGEXP.test(ctx.message.text)) {
      ctx.reply("Логин введён некорректно", { ...exitButton });
      return;
    }

    ctx.wizard.state.extend.login = ctx.message.text;

    ctx.reply("Введите количество месяцев для продления", {
      ...exitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!typeof +ctx.message.text === "number") {
      ctx.reply("Количество месяцев введено некорректно", { ...exitButton });
      return;
    }
    ctx.wizard.state.extend.months = ctx.message.text;
    try {
      const updatedExpiredDateJs = dayjs().add(
        +ctx.wizard.state.extend.months,
        "months"
      );

      await usersConnector.updateUserByPhone(ctx.wizard.state.extend.login, {
        expiredDate: updatedExpiredDateJs.toISOString(),
      });

      await ctx.reply(
        `Пользователь ${ctx.wizard.state.extend.login} успешно продлён на ${
          ctx.wizard.state.extend.months
        } мес до ${updatedExpiredDateJs.format("DD.MM.YYYY")}`
      );
    } catch (error) {
      ctx.reply("Произошла ошибка при продлении периода");
    } finally {
      exitCommand(ctx);
      ctx.scene.leave();
    }
  }
);

extendScene.hears(CMD_TEXT.exit, (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { extendScene };
