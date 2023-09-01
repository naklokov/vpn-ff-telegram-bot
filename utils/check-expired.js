const { usersConnector } = require("../db");
const dayjs = require("dayjs");
const { removeUserFromSecrets } = require("./secrets");

const expiredNotificationSheduler = (bot) => {
  const users = usersConnector.getUsers();
  const currentDate = dayjs().startOf("day");

  users.forEach(({ expiredDate, chatId, phone, isActive }) => {
    if (isActive) {
      const expiredDateDayJs = dayjs(expiredDate).startOf("day");
      if (expiredDateDayJs.subtract(2, "days").isSame(currentDate)) {
        bot.telegram.sendMessage(
          ADMIN_CHAT_ID,
          "Скоро необходимо оплатить услуги для пользователя " + phone
        );
      }

      if (expiredDateDayJs.isBefore(currentDate)) {
        usersConnector.updateUserByPhone(phone, { isActive: false });
        removeUserFromSecrets(phone);
      }
    }
  });
};

module.exports = {
  expiredNotificationSheduler,
};
