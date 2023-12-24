const cron = require("node-cron");
const dayjs = require("dayjs");
const { usersConnector } = require("../../db");
const { MONTH_COST, ADMIN_CHAT_ID } = require("../../constants");

const getNotificationMessage = (expiredDate, phone, chatId) => `
Доброго времени суток! 👋  

Оплаченный период использования VPN подходит к концу
Если Вы хотите продолжить использование сервиса VPN - Вам необходимо внести оплату
Количество месяцев для оплаты за раз не ограничено, но не менее одного

Оплату необходимо произвести до ${dayjs(expiredDate)
  .endOf("day")
  .format("DD.MM.YYYY")}

💰 Стоимость месячной подписки - ${MONTH_COST}р
  
📲 Оплатить можно переводом на карту.
Карта привязана к номеру телефона:
+79106174473
Николай К
Тинькофф, Альфа, Сбер 

‼️ После оплаты необходимо отправить в личные сообщения ${
  process.env.DEVELOPER_CONTACT
}:
- ваш логин (${phone})
- чек/скрин об оплате

${
  !chatId
    ? "‼️ Также, пройдите пожалуйста регистрацию в боте @friendly_vpn_ff_bot. В дальнейшем он будет уведомлять вас об необходимости оплаты и помогать с использованием сервиса VPN"
    : ""
}
`;

const paymentNotificationSheduler = async (bot) => {
  const users = await usersConnector.getUsers();
  const currentDate = dayjs();

  users.forEach(({ expiredDate, chatId, phone, isActive, name }) => {
    if (isActive) {
      if (
        dayjs(expiredDate).subtract(2, "day").isBefore(currentDate.endOf("day"))
      ) {
        const sendedChatId = chatId ? chatId : ADMIN_CHAT_ID;
        console.log(`Пользователь ${phone} уведомлён об необходимости оплаты`);
        bot.telegram.sendMessage(
          sendedChatId,
          getNotificationMessage(expiredDate, phone, chatId)
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
