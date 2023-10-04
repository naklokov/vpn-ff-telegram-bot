const cron = require("node-cron");
const { usersConnector } = require("../../db");
const dayjs = require("dayjs");

const toogleUserStatusSheduler = async () => {
  const users = await usersConnector.getUsers();
  const currentDateJs = dayjs();

  users.forEach(async ({ isActive, expiredDate, phone }) => {
    const expiredDateJs = dayjs(expiredDate).endOf("day");

    const isExpired = currentDateJs.isAfter(expiredDateJs);

    if (isActive && isExpired) {
      console.log(`Пользователь ${phone} деактивирован`);
      await usersConnector.updateUserByPhone(phone, { isActive: false });
      return;
    }

    if (!isActive && !isExpired) {
      console.log(`Пользователь ${phone} активирован`);
      await usersConnector.updateUserByPhone(phone, { isActive: true });
      return;
    }
  });
};

const runToogleUserStatusSheduler = (interval = "0/15 * * * *") =>
  // каждый час
  cron.schedule(interval, () => {
    toogleUserStatusSheduler();
  });

module.exports = { runToogleUserStatusSheduler };
