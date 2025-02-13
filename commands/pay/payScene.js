const { Scenes, Markup } = require("telegraf");
const { SCENE_IDS, CMD_TEXT, CMD } = require("../../constants");
const { exitButton } = require("../../components/buttons");
const { usersConnector } = require("../../db");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { sendAdminPaymentInfo } = require("./utils");
const { extendUser } = require("../extend/utils");
const { exitCommand } = require("../../components/exit");
const { checkPayment } = require("../../utils/recognize");
const logger = require("../../utils/logger");

const exitScene = async (ctx) => {
  await exitCommand(ctx);
  ctx.scene.leave();
};

const handlePaymentError = async (ctx, error) => {
  await ctx.reply(
    "Произошла ошибка при обработке платежа. Свяжитесь с @naklokov.",
  );
  logger.error("Ошибка при обработке платежа:", error);
};

const payScene = new Scenes.WizardScene(
  SCENE_IDS.PAY,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const dbUser = await usersConnector.getUserByChatId(chatId);

    if (!dbUser) {
      ctx.reply(
        `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`,
      );
      await exitScene(ctx);
      return;
    }

    await ctx.reply(
      `💰 Выберите количество месяцев для оплаты`,
      Markup.inlineKeyboard([
        [Markup.button.callback("1 мес / 200 руб", "1_200")],
        [Markup.button.callback("3 мес / 500 руб", "3_500")],
        [Markup.button.callback("6 мес / 900 руб", "6_900")],
      ]),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    const [payedMonthsCount, amount] =
      ctx.callbackQuery?.data?.split("_") ?? [];

    if (!payedMonthsCount || !amount) {
      await ctx.reply("Некорректно выбран период оплаты. Попробуйте снова.");
      return ctx.wizard.back(); // Возврат на предыдущий шаг для повторного выбора
    }

    // инициализация формы пользователя
    ctx.wizard.state.extend = {};
    ctx.wizard.state.extend.months = parseInt(payedMonthsCount, 10);
    ctx.wizard.state.extend.amount = parseInt(amount, 10);

    await ctx.reply(
      `*Сумма к оплате:* ${amount} руб\n\n` +
        `📲 Оплату можно произвести переводом на карту по номеру телефона +79106174473\n` +
        `*Яндекс пей, Тинькофф, Альфа, Сбер*\n\n` +
        `После оплаты пришлите в ответном сообщении квитанцию или чек об оплате`,
      { reply_markup: exitButton, parse_mode: "Markdown" },
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.wizard.state?.extend) {
      ctx.scene.leave();
      return;
    }

    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const dbUser = await usersConnector.getUserByChatId(chatId);

    ctx.wizard.state.extend.login = dbUser.phone;

    const amount = ctx.wizard.state?.extend?.amount ?? 0;
    const isPayCorrect = await checkPayment(amount, ctx);

    logger.info("Разпознавание платежа успешно", dbUser.chatId);

    if (!isPayCorrect) {
      await sendAdminPaymentInfo(isPayCorrect, ctx);
      await handlePaymentError(ctx, "Оплата не прошла");
      return;
    }

    try {
      await extendUser(dbUser.phone, ctx.wizard.state.extend.months, ctx);
      // дублирование сообщения админу об оплате
      await sendAdminPaymentInfo(isPayCorrect, ctx);
    } catch (error) {
      await handlePaymentError(ctx, error);
    } finally {
      await exitScene(ctx);
    }
  },
);

payScene.hears(CMD_TEXT.exit, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { payScene };
