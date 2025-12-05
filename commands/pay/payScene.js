const { Scenes, Markup } = require("telegraf");
const { SCENE_IDS, USERS_TEXT, DEVELOPER_CONTACT } = require("../../constants");
const { usersConnector, paymentConnector } = require("../../db");
const {
  getUserPersonalDataFromContext,
  isMenuCommand,
} = require("../../utils/common");
const { sendAdminPaymentInfo } = require("./utils");
const { extendUser } = require("../extend/utils");
const { checkPayment } = require("../../utils/recognize");
const logger = require("../../utils/logger");
const {
  exitButtonScene,
  getMainMenu,
  hideButtons,
} = require("../../components/buttons");

const PAYMENT_CALLBACK_QUERY = {
  ONE: "1_200",
  THREE: "3_500",
  SIX: "6_900",
};

const exitScene = async (ctx) => {
  await ctx.scene.leave();
  await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
};

const handlePaymentError = async (ctx, error) => {
  await ctx.reply(
    `Произошла ошибка при обработке платежа. Свяжитесь с ${DEVELOPER_CONTACT}`,
  );
  await exitScene(ctx);
  logger.error("Ошибка при обработке платежа:", error);
};

const payScene = new Scenes.WizardScene(
  SCENE_IDS.PAY,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);

    const dbUser = await usersConnector.getUserByChatId(chatId);

    if (!dbUser) {
      ctx.reply(
        `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
      );
      await exitScene(ctx);
      return;
    }

    await ctx.reply(
      "💰 Оплата VPN осуществляется путём продления подписки",
      exitButtonScene,
    );
    await ctx.reply(
      `🗓 Выберите количество месяцев для оплаты`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("1 мес / 200₽", PAYMENT_CALLBACK_QUERY.ONE),
          Markup.button.callback("3 мес / 500₽", PAYMENT_CALLBACK_QUERY.THREE),
        ],
        [Markup.button.callback("6 мес / 900₽", PAYMENT_CALLBACK_QUERY.SIX)],
      ]),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    // Проверяем, если пользователь нажал на команду меню, выходим из сцены
    if (ctx.callbackQuery?.data && isMenuCommand(ctx.callbackQuery.data)) {
      await exitScene(ctx);
      return;
    }

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
      `*Сумма к оплате:* ${amount}₽\n\n` +
        `📲 Оплату можно произвести переводом на карту по номеру телефона\n\n` +
        `❗️❗️ВНИМАНИЕ❗️❗️\n` +
        `Перевод *ТОЛЬКО на OZON банк*\n\n` +
        `В случае перевода на другой банк, платёж проведён *НЕ БУДЕТ*\n\n` +
        `📲*+79106174473*\n\n` +
        `После оплаты пришлите в ответном сообщении в бот квитанцию в формате PDF *(не скриншот)* 👇👇👇`,
      {
        parse_mode: "Markdown",
      },
      exitButtonScene,
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.callbackQuery?.data && isMenuCommand(ctx.callbackQuery.data)) {
      await exitScene(ctx);
      return;
    }

    if (!ctx.wizard.state?.extend) {
      await exitScene(ctx);
      return;
    }

    // Если пользователь щёлкает по периодам, то повторяем для него шаг оплаты
    if (
      Object.values(PAYMENT_CALLBACK_QUERY).includes(ctx?.callbackQuery?.data)
    ) {
      await ctx.wizard.back();
      await ctx.wizard.step(ctx);
      return;
    }

    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const dbUser = await usersConnector.getUserByChatId(chatId);

    ctx.wizard.state.extend.login = dbUser.phone;

    const period = ctx.wizard.state?.extend?.months ?? 0;
    const amount = ctx.wizard.state?.extend?.amount ?? 0;
    const isPayCorrect = await checkPayment(amount, ctx);

    logger.info("Разпознавание платежа успешно", dbUser.chatId);

    if (!isPayCorrect) {
      await sendAdminPaymentInfo(isPayCorrect, ctx);
      await handlePaymentError(ctx, "Оплата не прошла");
      return;
    }

    try {
      await extendUser(dbUser.phone, period, ctx);
      await paymentConnector.savePayment({
        chatId,
        period,
        amount,
        phone: dbUser.phone,
        date: new Date().toISOString(),
      });
      // дублирование сообщения админу об оплате
      await sendAdminPaymentInfo(isPayCorrect, ctx);
    } catch (error) {
      await handlePaymentError(ctx, error);
      throw Error(error);
    } finally {
      await exitScene(ctx);
    }
  },
);

payScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitScene(ctx);
});

module.exports = { payScene };
