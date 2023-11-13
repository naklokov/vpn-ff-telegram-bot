const { Scenes, Markup } = require("telegraf");
const dayjs = require("dayjs");
const {
  SCENE_IDS,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  CMD_TEXT,
} = require("../../constants");
const { exitButton } = require("../../components/buttons");
const { exitCommand } = require("../../components/exit");
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
    const payedMonths = ctx.message.text;
    if (!typeof +payedMonths === "number") {
      ctx.reply("Количество месяцев введено некорректно", { ...exitButton });
      return;
    }
    ctx.wizard.state.extend.months = payedMonths;
    try {
      const user = await usersConnector.getUserByPhone(
        ctx.wizard.state.extend.login
      );
      const updatedExpiredDateJs = dayjs(
        user?.isActive ? user?.expiredDate : undefined
      ).add(+payedMonths, "months");

      await usersConnector.updateUserByPhone(ctx.wizard.state.extend.login, {
        expiredDate: updatedExpiredDateJs.toISOString(),
      });

      ctx.reply(
        `Пользователь ${ctx.wizard.state.extend.login} успешно продлён на ${
          ctx.wizard.state.extend.months
        } мес до ${updatedExpiredDateJs.format("DD.MM.YYYY")}`
      );
      if (user?.chatId) {
        ctx.telegram.sendMessage(
          user.chatId,
          `Ваш доступ успешно продлён на ${
            ctx.wizard.state.extend.months
          } мес до ${updatedExpiredDateJs.format(
            "DD.MM.YYYY"
          )}. Оплата может проходить до 20 минут. Приятного пользования!`
        );
      }
    } catch (error) {
      ctx.reply("Произошла ошибка при продлении периода");
    } finally {
      await exitCommand(ctx);
      ctx.scene.leave();
      return;
    }
  }
);

extendScene.hears(CMD_TEXT.exit, async (ctx) => {
  await ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
});

module.exports = { extendScene };
