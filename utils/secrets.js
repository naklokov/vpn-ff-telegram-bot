const fs = require("fs/promises");
const { SECRET_ROW_REGEXP } = require("../constants");
const { restartService } = require("../scripts/restart-service");

const { SECRETS_FILE_PATH } = process.env;

const FIRST_REQUIRED_ROW = 'v1538375.hosted-by-vdsina.ru : RSA "privkey.pem"\n';

const secretsFileToUsers = async () => {
  const data = await fs.readFile(SECRETS_FILE_PATH, {
    encoding: "utf-8",
  });

  const splitted = data.toString().split("\n");
  return splitted.reduce((acc, cur) => {
    const match = cur.match(SECRET_ROW_REGEXP);
    if (match && match[1] && match[2]) {
      return [...acc, { login: match[1], password: match[2] }];
    }

    return acc;
  }, []);
};

const usersToSecretsFile = async (users) => {
  const usersSecretsRow = users.reduce(
    (acc, cur) => acc + `${cur.login} : EAP "${cur.password}"\n`,
    "",
  );
  await fs.writeFile(SECRETS_FILE_PATH, FIRST_REQUIRED_ROW + usersSecretsRow);
};

const addUserToSecrets = async (login, password) => {
  try {
    const users = await secretsFileToUsers();
    await usersToSecretsFile([...users, { login, password }]);
    restartService();
  } catch (error) {
    console.log(
      "Произошла ошибка при добавлении пользователя в файл секретов " + login,
      error,
    );
    throw error;
  }
};

const removeUserFromSecrets = async (login) => {
  try {
    const users = await secretsFileToUsers();
    const filtered = users.filter((user) => user.login !== login);
    await usersToSecretsFile(filtered);
    restartService();
  } catch (error) {
    console.log(
      "Произошла ошибка при удалении из файла секретов " + login,
      error,
    );
    throw error;
  }
};

module.exports = {
  addUserToSecrets,
  removeUserFromSecrets,
  secretsFileToUsers,
  usersToSecretsFile,
};
