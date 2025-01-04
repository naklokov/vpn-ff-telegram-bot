require("dotenv").config();
const { getInbound } = require("../api/vless");
const { DEFAULT_INBOUND_ID } = require("../constants");
const { usersConnector } = require("../db");
// const { secretsFileToUsers } = require("../utils/secrets");

// const migrateFromSecretsFileToDb = async () => {
//   const users = await secretsFileToUsers();

//   console.log("Пользователи для миграции", users);

//   users.forEach(async ({ login, password }) => {
//     await usersConnector.addUser({ phone: login, password });
//   });
// };

// migrateFromSecretsFileToDb();

// Выставление признака isVless для тех пользователей, кто уже зарегистрирован
const migrateFromDbToVless = async () => {
  try {
    const dbUsers = await usersConnector.getUsers();
    const { settings } = await getInbound(DEFAULT_INBOUND_ID);
    const { clients } = JSON.parse(settings);

    await dbUsers.forEach(async (dbUser) => {
      const isExist = clients?.find((client) => client.id === dbUser.phone);
      console.log(`user ${dbUser.phone} - ${!!isExist}`);

      // если пользователь существует, то обновляем его из БД, если не сушествует, то добавляем
      await usersConnector.updateUserByPhone(dbUser.phone, {
        isVless: !!isExist,
      });
    });
    console.log("Миграция успешна");
  } catch (error) {
    console.error("Произошла ошибка во время миграции", error);
  }
};

migrateFromDbToVless();
