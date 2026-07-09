const { Scenes, Markup } = require("telegraf");
const dayjs = require("dayjs");
const {
  SCENE_IDS,
  DEVELOPER_CONTACT,
  SUBSRIBE_COST,
} = require("../../constants");
const { usersConnector, paymentConnector } = require("../../server");
const {
  getUserPersonalDataFromContext,
  isMenuCommand,
} = require("../../utils/common");
const { sendAdminPaymentInfo } = require("./utils");
const { checkPayment } = require("../../utils/recognize");
const logger = require("../../utils/logger");
const { withClientWaiting } = require("../../utils/client-waiting");
const { exitButtonScene } = require("../../components/buttons");
const { exitToMenu, showSceneExitKeyboard } = require("../../utils/scene-ui");

const PAYMENT_CALLBACK_QUERY = {
  ONE: `1_${SUBSRIBE_COST[1]}`,
  THREE: `3_${SUBSRIBE_COST[3]}`,
  SIX: `6_${SUBSRIBE_COST[6]}`,
};

const PAYMENT_ERROR_TEXT = `Произошла ошибка при обработке платежа. Свяжитесь с ${DEVELOPER_CONTACT}`;

const notifyUserAfterPayment = async (ctx, dbUser, period, paymentResult) => {
  const updatedUser = await usersConnector.getUserByPhone(dbUser.phone);
  const expiredDateFormatted = dayjs(updatedUser?.expiredDate).format(
    "DD.MM.YYYY",
  );

  if (paymentResult?.isMigratedToRemnawave && paymentResult?.subscriptionUrl) {
    await ctx.telegram.sendMessage(
      dbUser.chatId,
      "❗️ Перенёс вас на новый сервер ❗️",
    );
    await ctx.telegram.sendMessage(
      dbUser.chatId,
      "Для настройки VPN перейдите по ссылке ниже 👇👇👇\n" +
        `${paymentResult.subscriptionUrl}`,
    );
  }

  await ctx.telegram.sendMessage(
    dbUser.chatId,
    `Ваш доступ успешно продлён на ${period} мес до ${expiredDateFormatted}
Приятного пользования!`,
  );
};

const payScene = new Scenes.WizardScene(
  SCENE_IDS.PAY,
  async (ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);

    const dbUser = await usersConnector.getUserByChatId(chatId);

    if (!dbUser?.phone) {
      await ctx.reply(
        `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
      );
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    await showSceneExitKeyboard(ctx, "🗓 Выберите количество месяцев для оплаты");
    await ctx.reply(
      "Период подписки:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `1 мес / ${SUBSRIBE_COST[1]}₽`,
            PAYMENT_CALLBACK_QUERY.ONE,
          ),
          Markup.button.callback(
            `3 мес / ${SUBSRIBE_COST[3]}₽`,
            PAYMENT_CALLBACK_QUERY.THREE,
          ),
        ],
        [
          Markup.button.callback(
            `6 мес / ${SUBSRIBE_COST[6]}₽`,
            PAYMENT_CALLBACK_QUERY.SIX,
          ),
        ],
      ]),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.callbackQuery?.data && isMenuCommand(ctx.callbackQuery.data)) {
      await exitToMenu(ctx);
      return;
    }

    const [payedMonthsCount, amount] =
      ctx.callbackQuery?.data?.split("_") ?? [];
    if (!payedMonthsCount || !amount) {
      await ctx.reply(
        "Некорректно выбран период оплаты. Попробуйте снова.",
        exitButtonScene,
      );
      return ctx.wizard.back();
    }

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
      await exitToMenu(ctx);
      return;
    }

    if (!ctx.wizard.state?.extend) {
      await exitToMenu(ctx);
      return;
    }

    if (
      Object.values(PAYMENT_CALLBACK_QUERY).includes(ctx?.callbackQuery?.data)
    ) {
      await ctx.wizard.back();
      await ctx.wizard.step(ctx);
      return;
    }

    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const dbUser = await usersConnector.getUserByChatId(chatId);

    if (!dbUser?.phone) {
      await ctx.reply(
        "Пользователь не найден. Попробуйте зарегистрироваться заново.",
      );
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    ctx.wizard.state.extend.login = dbUser.phone;

    const period = ctx.wizard.state?.extend?.months ?? 0;
    const amount = ctx.wizard.state?.extend?.amount ?? 0;
    const isPayCorrect = await checkPayment(amount, ctx);

    logger.info("Разпознавание платежа успешно", dbUser.chatId);

    if (!isPayCorrect) {
      await sendAdminPaymentInfo(isPayCorrect, ctx);
      await ctx.reply(PAYMENT_ERROR_TEXT);
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    try {
      let paymentResult;
      await withClientWaiting(
        ctx,
        "⏳ Подтверждаю оплату и продлеваю подписку...",
        async () => {
          paymentResult = await paymentConnector.savePayment({
            chatId,
            period,
            amount,
            phone: dbUser.phone,
            date: new Date().toISOString(),
          });
          await notifyUserAfterPayment(ctx, dbUser, period, paymentResult);
        },
      );
      await sendAdminPaymentInfo(isPayCorrect, ctx);
    } catch (error) {
      await ctx.reply(PAYMENT_ERROR_TEXT);
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      logger.error("Ошибка при обработке платежа:", error);
      throw Error(error);
    }

    await exitToMenu(ctx);
  },
);

module.exports = { payScene };
