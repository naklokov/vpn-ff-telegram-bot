const { Scenes, Markup } = require("telegraf");
const { SCENE_IDS, ADMIN_CHAT_ID, CMD_TEXT } = require("../../constants");
const { exitButton } = require("../../components/buttons");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { checkPayment, sendAdminPaymentInfo } = require("./utils");
const { updateUserExpiredDate } = require("../extend/utils");
const { exitCommand } = require("../../components/exit");
const logger = require("../../utils/logger");

const payScene = new Scenes.WizardScene(
  SCENE_IDS.PAY,
  async (ctx) => {
    if (ctx.message.chat.id !== ADMIN_CHAT_ID) {
      ctx.scene.leave();
      return;
    }
    // инициализация формы пользователя
    ctx.wizard.state.extend = {};

    await ctx.reply("Введите количество оплаченных месяцев", {
      ...exitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    const payedMonthsCount = parseInt(ctx.message.text, 10);
    if (isNaN(payedMonthsCount)) {
      ctx.reply("Количество месяцев введено некорректно", { ...exitButton });
      return;
    }
    ctx.wizard.state.extend.months = payedMonthsCount;
    ctx.wizard.state.extend.tryCount = 0;

    ctx.reply("Прикрепите информацию об оплате как скриншот или изображение", {
      ...exitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const dbUser = await usersConnector.getUserByChatId(chatId);

    ctx.wizard.state.extend.login = dbUser.phone;

    const isPayCorrect = await checkPayment(ctx);

    logger.info("Разпознавание платежа успешно", dbUser.chatId);

    if (!isPayCorrect) {
      if (ctx.wizard.state.extend.tryCount > 0) {
        await ctx.reply("Произошла ошибка при оплате, свяжитесь с @naklokov");
        await sendAdminPaymentInfo(ctx, "⚠️ ОПЛАТА НЕ ПРОШЛА ⚠️");
        await exitCommand(ctx);
        ctx.scene.leave();
        return;
      }

      await ctx.reply(
        "Прикрепите корректное изображение или чек об оплате, проверьте что вы прикрепляете квитанцию как изображение",
        {
          ...exitButton,
        },
      );

      ctx.wizard.state.extend.tryCount = ctx.wizard.state.extend.tryCount + 1;

      logger.error("Произошла ошибка при распознавании платежа", dbUser.chatId);

      return;
    }

    try {
      await updateUserExpiredDate(ctx);

      // временная мера для проверки оплаты
      await sendAdminPaymentInfo(ctx, "Оплата прошла");
    } catch (error) {
      ctx.reply("Произошла ошибка при продлении периода");
      logger.error(
        "Произошла ошибка при продлении периода платежа" + error,
        dbUser.chatId,
      );
    } finally {
      await exitCommand(ctx);
      ctx.scene.leave();
    }
  },
);

payScene.hears(CMD_TEXT.exit, async (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { payScene };
