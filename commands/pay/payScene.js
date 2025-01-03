const { Scenes, Markup } = require("telegraf");
const { SCENE_IDS, CMD_TEXT, MONTH_COST, CMD } = require("../../constants");
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
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    const dbUser = await usersConnector.getUserByChatId(chatId);

    if (!dbUser) {
      ctx.reply(
        `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`,
      );
      await exitCommand(ctx);
      ctx.scene.leave();
      return;
    }

    await ctx.reply(
      `💰 Стоимость подписки на VPN - ${MONTH_COST} руб / месяц

Оплата будет произведена на логин ${dbUser.phone}

Укажите количество месяцев, которые вы хотите оплатить`,
      {
        ...exitButton,
      },
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const payedMonthsCount = parseInt(ctx.message.text, 10);
    if (isNaN(payedMonthsCount)) {
      ctx.reply("Количество месяцев введено некорректно", { ...exitButton });
      return;
    }

    // инициализация формы пользователя
    ctx.wizard.state.extend = {};
    ctx.wizard.state.extend.months = payedMonthsCount;
    ctx.wizard.state.extend.tryCount = 0;

    const amount = payedMonthsCount * MONTH_COST;

    await ctx.reply(
      `Сумма к оплате ${amount} руб

📲 Оплату можно произвести переводом на карту по номеру телефона +79106174473
Яндекс пей, Тинькофф, Альфа, Сбер

После оплаты пришлите в ответном сообщение скриншот чека`,
      {
        ...exitButton,
      },
    );
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
        await ctx.reply("Оплата принята, ожидайте проведения платежа");
        await sendAdminPaymentInfo(ctx, "⚠️ ОПЛАТА НЕ ПРОШЛА ⚠️\n/extend");
        await exitCommand(ctx);
        ctx.scene.leave();
        return;
      }

      await ctx.reply(
        "Прикрепите корректное изображение квитанции (чека) об оплате. Проверьте, что вы прикрепляете изображение",
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
