const cron = require("node-cron");
const dayjs = require("dayjs");
const { usersConnector } = require("../../db");
const { MONTH_COST, ADMIN_CHAT_ID } = require("../../constants");

const logger = require("../logger");

const getNotificationMessage = (expiredDate) => `
Доброго времени суток! 👋  

Оплаченный период использования VPN подходит к концу
Если Вы хотите продолжить использование сервиса VPN - Вам необходимо внести оплату

Оплату необходимо произвести до ${dayjs(expiredDate)
  .endOf("day")
  .format("DD.MM.YYYY")}

💰 Стоимость месячной подписки - ${MONTH_COST} ₽
Количество месяцев для оплаты за раз не ограничено, но не менее одного

📲 Оплату можно произвести переводом на карту по номеру телефона +79106174473
Яндекс пей, Тинькофф, Альфа, Сбер
  
Поcле оплаты необходимо провести оплату в боте через команду /pay или 
"Меню" выбрать пункт "Оплата"
`;

const paymentNotificationSheduler = async (bot) => {
  const users = await usersConnector.getUsers();
  const currentDate = dayjs();

  users.forEach(({ expiredDate, chatId, phone, isActive }) => {
    if (isActive) {
      if (
        dayjs(expiredDate).subtract(2, "day").isBefore(currentDate.endOf("day"))
      ) {
        const sendedChatId = chatId ? chatId : ADMIN_CHAT_ID;
        logger.info(`Пользователь ${phone} уведомлён об необходимости оплаты`);
        bot.telegram.sendMessage(
          sendedChatId,
          getNotificationMessage(expiredDate, phone, chatId),
        );
      }
    }
  });
};

const runPaymentNotificationSheduler = (bot, interval = "0 12 * * *") => {
  // каждый день в полдень
  cron.schedule(interval, () => {
    paymentNotificationSheduler(bot);
  });
};

module.exports = { runPaymentNotificationSheduler };
