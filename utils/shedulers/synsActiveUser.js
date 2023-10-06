const cron = require("node-cron");
const { usersConnector } = require("../../db");
const { usersToSecretsFile } = require("../secrets");
const { restartService } = require("../../scripts/restart-service");

const syncActiveUserSheduler = async () => {
  const users = await usersConnector.getUsers();

  const activeUsers = users
    .filter(({ isActive }) => isActive)
    .map(({ phone, password }) => ({ login: phone, password }));

  try {
    await usersToSecretsFile(activeUsers);
    restartService();
    console.log("Синхронизация активных пользователей прошла успешно");
  } catch (error) {
    console.error(
      "Произошла ошибка при синхронизации активных пользователей ",
      error
    );
  }
};
const runSyncActiveUserSheduler = (interval = "0/15 * * * *") =>
  cron.schedule(interval, () => {
    syncActiveUserSheduler();
  });

module.exports = { runSyncActiveUserSheduler };
