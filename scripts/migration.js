require("dotenv").config();
const { getInbounds } = require("../api/vless");
const { usersConnector } = require("../db");
const { generatePassword } = require("../utils/common");
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
// const migrateFromDbToVless = async () => {
//   try {
//     const dbUsers = await usersConnector.getUsers();
//     const inbounds = await getInbounds();
//     const { clients } = JSON.parse(inbounds?.[0]?.settings ?? {});

//     await dbUsers.forEach(async (dbUser) => {
//       const isExist = clients?.find((client) => client.id === dbUser.phone);
//       console.log(`user ${dbUser.phone} - ${!!isExist}`);

//       // если пользователь существует, то обновляем его из БД, если не сушествует, то добавляем
//       await usersConnector.updateUserByPhone(dbUser.phone, {
//         isVless: !!isExist,
//       });
//     });
//     console.log("Миграция успешна");
//   } catch (error) {
//     console.error("Произошла ошибка во время миграции", error);
//   }
// };

const migrateFromVlessToDb = async () => {
  const dbUsers = await usersConnector.getUsers();
  const inbounds = await getInbounds();

  const { clients } = JSON.parse(inbounds?.[0]?.settings ?? {});
  console.log("client count: " + clients?.length);

  clients.forEach(async (vlessClient) => {
    const isExist = !!dbUsers.find(
      (dbUser) => dbUser.phone.toString() === vlessClient.id,
    );
    if (isExist) {
      await usersConnector.updateUserByPhone(vlessClient.id, {
        expiredDate: new Date(vlessClient.expiryTime).toISOString(),
        isVless: true,
      });
      return;
    }

    const password = generatePassword();
    const user = {
      email: "",
      name: "",
      password,
      phone: vlessClient.id,
      isVless: true,
      expiredDate: new Date(vlessClient.expiryTime).toISOString(),
      chatId: vlessClient?.tgId ?? "",
    };
    await usersConnector.addUser(user);
  });
};

// migrateFromDbToVless();
migrateFromVlessToDb();
