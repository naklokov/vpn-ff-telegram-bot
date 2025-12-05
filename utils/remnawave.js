const axios = require("axios");
const logger = require("./logger");
const { getExpiredDateIso } = require("./common");

const { REMNAWAVE_API_URL, REMNAWAVE_API_TOKEN } = process.env;

const getAuthHeaders = () => {
  if (!REMNAWAVE_API_URL || !REMNAWAVE_API_TOKEN) {
    throw new Error(
      "REMNAWAVE_API_URL или REMNAWAVE_API_TOKEN не заданы в .env",
    );
  }

  return {
    Authorization: `Bearer ${REMNAWAVE_API_TOKEN}`,
  };
};

/**
 * Получить первый internal squad (uuid) из Remnawave.
 * Использует GET /api/internal-squads и схему GetInternalSquadsResponseDto.
 */
async function getFirstInternalSquadUuid() {
  const headers = getAuthHeaders();

  try {
    const { data } = await axios.get(
      `${REMNAWAVE_API_URL}/api/internal-squads`,
      { headers },
    );

    const internalSquads =
      data?.response?.internalSquads &&
      Array.isArray(data.response.internalSquads)
        ? data.response.internalSquads
        : [];

    const first = internalSquads[0];

    if (!first?.uuid) {
      logger.warn("Remnawave: internal squads пусты или без uuid");
      return null;
    }

    return first.uuid;
  } catch (error) {
    logger.error(
      "Remnawave: ошибка при получении internal squads",
      error.response || error,
    );
    return null;
  }
}

/**
 * Добавление пользователя в Remnawave.
 *
 * По OpenAPI: CreateUserRequestDto
 * обязательные поля: username, expireAt
 */
async function addRemnawaveUser({
  username,
  chatId,
  description,
  email = "",
  expireAt,
}) {
  if (!REMNAWAVE_API_URL) {
    throw new Error("REMNAWAVE_API_URL не задан в .env");
  }

  // Пытаемся получить первый internal squad.
  const internalSquadUuid = await getFirstInternalSquadUuid();

  const payload = {
    description,
    email,
    expireAt: expireAt ? expireAt : getExpiredDateIso(),
    hwidDeviceLimit: 0,
    status: "ACTIVE",
    telegramId: Number(chatId),
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
    username: String(username), // телефон подходит под паттерн username
  };

  if (internalSquadUuid) {
    payload.activeInternalSquads = [internalSquadUuid];
  }

  try {
    const { data } = await axios.post(
      `${REMNAWAVE_API_URL}/api/users`,
      payload,
      {
        headers: getAuthHeaders(),
      },
    );

    logger.info(
      `Remnawave: пользователь успешно создан (${username}, chatId=${chatId})`,
    );
    return data;
  } catch (error) {
    logger.error(
      `Remnawave: ошибка при создании пользователя (${username}, chatId=${chatId})`,
      error.response || error,
    );
    throw error;
  }
}

/**
 * Получить полную ссылку на страницу подписки пользователя по username (phone).
 *
 * Использует GET /api/subscriptions/by-username/{username}
 * и поле response.subscriptionUrl из GetSubscriptionByUsernameResponseDto.
 */
async function getSubscriptionUrlByPhone(phone) {
  if (!REMNAWAVE_API_URL) {
    throw new Error("REMNAWAVE_API_URL не задан в .env");
  }

  const username = String(phone);

  try {
    const { data } = await axios.get(
      `${REMNAWAVE_API_URL}/api/subscriptions/by-username/${encodeURIComponent(
        username,
      )}`,
      {
        headers: getAuthHeaders(),
      },
    );

    const isFound = data?.response?.isFound;
    const subscriptionUrl = data?.response?.subscriptionUrl || null;

    if (!isFound || !subscriptionUrl) {
      logger.warn(
        `Remnawave: подписка для пользователя ${username} не найдена`,
      );
      return null;
    }

    return subscriptionUrl;
  } catch (error) {
    logger.error(
      `Remnawave: ошибка при получении подписки для пользователя ${username}`,
      error.response || error,
    );
    return "";
  }
}

/**
 * Обновить пользователя в Remnawave по username (phone).
 *
 * Uses PATCH /api/users with UpdateUserRequestDto.
 */
async function updateRemnawaveUserByPhone(phone, { expireAt }) {
  if (!REMNAWAVE_API_URL) {
    throw new Error("REMNAWAVE_API_URL не задан в .env");
  }

  const payload = {
    username: String(phone),
    expireAt,
  };

  try {
    const { data } = await axios.patch(
      `${REMNAWAVE_API_URL}/api/users`,
      payload,
      {
        headers: getAuthHeaders(),
      },
    );

    logger.info(
      `Remnawave: пользователь ${phone} успешно обновлён (expireAt=${payload.expireAt})`,
    );
    return data;
  } catch (error) {
    logger.error(
      `Remnawave: ошибка при обновлении пользователя ${phone}`,
      error.response || error,
    );
    throw error;
  }
}

module.exports = {
  addRemnawaveUser,
  getFirstInternalSquadUuid,
  getSubscriptionUrlByPhone,
  updateRemnawaveUserByPhone,
};
