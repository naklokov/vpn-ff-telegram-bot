const axios = require("axios");
const logger = require("../utils/logger");
const { VPN_SERVER_URL, VPN_SERVER_API_TOKEN } = process.env;

if (!VPN_SERVER_URL || !VPN_SERVER_API_TOKEN) {
  throw new Error(
    "VPN_SERVER_URL и VPN_SERVER_API_TOKEN должны быть заданы в .env",
  );
}

const serverClient = axios.create({
  baseURL: VPN_SERVER_URL,
  headers: {
    "x-api-token": VPN_SERVER_API_TOKEN,
    Accept: "application/json",
  },
  timeout: 15000,
});

const addUser = async (user) => {
  try {
    console.log("user", user);
    const { data } = await serverClient.post("/api/users", user);
    logger.info(`Пользователь добавлен в БД ${user.phone}`);
    return data;
  } catch (error) {
    logger.info(
      `Произошла ошибка при добавлении пользователя в БД ${user.phone}: ${error}`,
    );
    throw error;
  }
};

const getUsers = async () => {
  try {
    const { data } = await serverClient.get("/api/users");
    return data;
  } catch (error) {
    logger.error(`Произошла ошибка при получении пользователей из БД`);
    throw Error(error);
  }
};

const getUserByChatId = async (chatId) => {
  try {
    const { data } = await serverClient.get(
      `/api/users/chat/${encodeURIComponent(chatId)}`,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    logger.error(
      `Произошла ошибка при получении пользователя по chatId ${chatId}`,
    );
    throw Error(error);
  }
};

const getUserByPhone = async (phone) => {
  try {
    const { data } = await serverClient.get(
      `/api/users/phone/${encodeURIComponent(phone)}`,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    logger.error(
      `Произошла ошибка при получении пользователя по телефону ${phone}`,
    );
    throw Error(error);
  }
};

const deleteUser = async (userId) => {
  try {
    const user = await getUserByChatId(userId);
    if (!user?.phone) {
      return;
    }
    await serverClient.patch(`/api/users/${encodeURIComponent(user.phone)}`, {
      isActive: false,
    });
  } catch (error) {
    logger.error(
      `Произошла ошибка при удалении пользователя по телефону ${userId}`,
    );
    throw Error(error);
  }
};

const updateUserById = async (userId, user) => {
  try {
    const dbUser = await getUserByChatId(userId);
    if (!dbUser?.phone) {
      return null;
    }
    const { data } = await serverClient.patch(
      `/api/users/${encodeURIComponent(dbUser.phone)}`,
      { ...user },
    );
    return data;
  } catch (error) {
    logger.error(
      `Произошла ошибка при обновлении пользователя по id ${userId}`,
    );
    throw Error(error);
  }
};

const updateUserByPhone = async (phone, user) => {
  try {
    const { data } = await serverClient.patch(
      `/api/users/${encodeURIComponent(phone)}`,
      { ...user },
    );
    return data;
  } catch (error) {
    logger.error(
      `Произошла ошибка при обновлении пользователя по телефону ${phone}`,
    );
    throw Error(error);
  }
};

module.exports = {
  addUser,
  deleteUser,
  updateUserById,
  updateUserByPhone,
  getUsers,
  getUserByChatId,
  getUserByPhone,
};
