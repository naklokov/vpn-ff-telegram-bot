const cron = require("node-cron");
const dayjs = require("dayjs");
const { usersConnector } = require("../../server");
const { ADMIN_CHAT_ID, USERS_TEXT, CMD } = require("../../constants");

const logger = require("../logger");
const { Markup } = require("telegraf");

const getNotificationMessage = (expiredDate) => `
Доброго времени суток! 👋  

Оплаченный период использования VPN подходит к концу
Если Вы хотите продолжить использование сервиса VPN - Вам необходимо внести оплату

Оплату необходимо произвести до ${dayjs(expiredDate)
  .endOf("day")
  .format("DD.MM.YYYY")}
`;

/**
 * Сколько полных календарных дней осталось от сегодня (00:00 локального времени бота)
 * до даты окончания (берём календарный день из expiredDate).
 */
const getDaysLeftUntilExpiry = (expiredDate) => {
  const expiry = dayjs(expiredDate);
  if (!expiry.isValid()) {
    return null;
  }
  const today = dayjs().startOf("day");
  const expiryDay = expiry.startOf("day");
  return expiryDay.diff(today, "day");
};

const shouldNotifyAboutPayment = (expiredDate) => {
  const daysLeft = getDaysLeftUntilExpiry(expiredDate);
  if (daysLeft === null) {
    return false;
  }
  // Напоминание в последние 3 календарных дня включительно день окончания (0, 1, 2).
  return daysLeft >= 0 && daysLeft <= 2;
};

const paymentNotificationSheduler = async (bot) => {
  const users = await usersConnector.getUsers();
  for (const { expiredDate, chatId, phone, isActive } of users) {
    if (!isActive) {
      continue;
    }
    if (!shouldNotifyAboutPayment(expiredDate)) {
      continue;
    }
    if (!dayjs(expiredDate).isValid()) {
      logger.warn(
        `Напоминание об оплате пропущено: некорректная expiredDate у ${phone}`,
      );
      continue;
    }
    const sendedChatId = chatId ? chatId : ADMIN_CHAT_ID;
    const daysLeft = getDaysLeftUntilExpiry(expiredDate);
    try {
      logger.info(
        `Пользователь ${phone} уведомлён об необходимости оплаты (daysLeft=${daysLeft})`,
      );
      await bot.telegram.sendMessage(
        sendedChatId,
        getNotificationMessage(expiredDate),
        Markup.inlineKeyboard([
          Markup.button.callback(USERS_TEXT.pay, CMD.pay),
        ]).resize(),
      );
    } catch (error) {
      logger.error(
        `Ошибка отправки напоминания об оплате пользователю ${phone}`,
        error,
      );
    }
  }
};

const runPaymentNotificationSheduler = (bot, interval = "0 12 * * *") => {
  // каждый день в полдень
  cron.schedule(interval, () => {
    paymentNotificationSheduler(bot);
  });
};

module.exports = { runPaymentNotificationSheduler };
