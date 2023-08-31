require("dotenv").config();
const { usersConnector } = require("../db");
const { secretsFileToUsers } = require("../utils/secrets");

const migrateFromSecretsFileToDb = async () => {
  const users = await secretsFileToUsers();

  console.log(users);

  users.forEach(async ({ login, password }) => {
    await usersConnector.addUser({ phone: login, password });
  });
};

migrateFromSecretsFileToDb();
