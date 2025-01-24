const cron = require("node-cron");
const { usersConnector } = require("../../db");
const { usersToSecretsFile } = require("../secrets");
const { restartService } = require("../../scripts/restart-service");
const logger = require("../logger");

const syncActiveUserSheduler = async () => {
  const users = await usersConnector.getUsers();

  const activeUsers = users
    .filter(({ isActive }) => isActive)
    .map(({ phone, password }) => ({ login: phone, password }));

  try {
    await usersToSecretsFile(activeUsers);
    restartService();
    logger.debug("Синхронизация активных пользователей прошла успешно");
  } catch (error) {
    logger.error(`Произошла ошибка при синхронизации активных пользователей`);
    throw Error(error);
  }
};
const runSyncActiveUserSheduler = (interval = "* * * * *") =>
  cron.schedule(interval, () => {
    syncActiveUserSheduler();
  });

module.exports = { runSyncActiveUserSheduler };
