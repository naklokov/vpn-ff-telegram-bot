require("dotenv").config();
const { usersConnector } = require("../db");
// const { secretsFileToUsers } = require("../utils/secrets");
const {
  addVlessUser,
  isVlessUserExist,
  updateVlessUser,
} = require("../utils/vless");

const logger = require("../utils/logger");

// const migrateFromSecretsFileToDb = async () => {
//   const users = await secretsFileToUsers();

//   console.log("Пользователи для миграции", users);

//   users.forEach(async ({ login, password }) => {
//     await usersConnector.addUser({ phone: login, password });
//   });
// };

// migrateFromSecretsFileToDb();

const migrateFromDbToVless = async () => {
  try {
    const dbUsers = await usersConnector.getUsers();

    await dbUsers.forEach(async (dbUser) => {
      const isUserExist = await isVlessUserExist(dbUser.phone);

      // если пользователь существует, то обновляем его из БД, если не сушествует, то добавляем
      if (isUserExist) {
        logger.debug("Update user " + dbUser.phone);
        await updateVlessUser({
          phone: dbUser.phone,
          chatId: dbUser.chatId,
          expiryTime: dbUser.expiredDate,
        });
      } else {
        logger.debug("Add user " + dbUser.phone);
        await addVlessUser({
          phone: dbUser.phone,
          chatId: dbUser.chatId,
          expiryTime: dbUser.expiredDate,
        });
      }

      await usersConnector.updateUserByPhone(dbUser.phone, { isVless: true });
    });
    console.log("Миграция успешна");
  } catch (error) {
    console.error("Произошла ошибка во время миграции", error);
  }
};

migrateFromDbToVless();
