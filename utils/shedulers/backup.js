const cron = require("node-cron");
const dayjs = require("dayjs");
const { usersConnector } = require("../../db");
const { ADMIN_CHAT_ID } = require("../../constants");

const logger = require("../logger");

const backupSheduller = async (bot) => {
  const users = await usersConnector.getUsers();
  const currentDate = dayjs();

  const dbFilename = `db_users_${currentDate.format("YYYYMMDD")}.json`;

  await bot.telegram
    .sendDocument(ADMIN_CHAT_ID, {
      source: Buffer.from(JSON.stringify(users)),
      filename: dbFilename,
    })
    .catch(function (error) {
      logger.error(error);
    });
};

const runBackupSheduller = (bot, interval = "0 23 * * *") => {
  // каждый день в полдень
  cron.schedule(interval, () => {
    backupSheduller(bot);
  });
};

module.exports = { runBackupSheduller };
