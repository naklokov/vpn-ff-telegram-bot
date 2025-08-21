const { env } = require("process");
const { ApiClient } = require("./client");
const { getVlessFullClient } = require("./utils");
const logger = require("../utils/logger");

function createApiClient(serverPrefix = "") {
  const VPN_HOST = serverPrefix ? env[`${serverPrefix}VPN_HOST`] : env.VPN_HOST;
  const VPN_PORT = serverPrefix ? env[`${serverPrefix}VPN_PORT`] : env.VPN_PORT;
  const VPN_WEBBASEPATH = serverPrefix
    ? env[`${serverPrefix}VPN_WEBBASEPATH`]
    : env.VPN_WEBBASEPATH;
  const BASE_URL = `https://${VPN_HOST}:${VPN_PORT}${VPN_WEBBASEPATH}`;
  return new ApiClient(BASE_URL);
}

// Функция для получения списка Inbounds
async function getInbounds(serverPrefix = "") {
  try {
    const apiClient = createApiClient(serverPrefix);
    const VPN_USERNAME = serverPrefix
      ? env[`${serverPrefix}VPN_USERNAME`]
      : env.VPN_USERNAME;
    const VPN_PASSWORD = serverPrefix
      ? env[`${serverPrefix}VPN_PASSWORD`]
      : env.VPN_PASSWORD;

    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const response = await apiClient.get("/panel/api/inbounds/list");
    return response.obj;
  } catch (error) {
    logger.error(error);
    throw Error(error);
  }
}

// Функция для создания бекапа
async function getBackup(serverPrefix = "") {
  try {
    const apiClient = createApiClient(serverPrefix);
    const VPN_USERNAME = env[`${serverPrefix}VPN_USERNAME`] ?? env.VPN_USERNAME;
    const VPN_PASSWORD = env[`${serverPrefix}VPN_PASSWORD`] ?? env.VPN_PASSWORD;
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const response = await apiClient.get("/panel/api/inbounds/createbackup");
    return response.obj;
  } catch (error) {
    logger.error(error);
    throw Error(error);
  }
}

// Функция для получения списка Inbounds
async function getInbound(id, serverPrefix = "") {
  try {
    const apiClient = createApiClient(serverPrefix);
    const VPN_USERNAME = serverPrefix
      ? env[`${serverPrefix}VPN_USERNAME`]
      : env.VPN_USERNAME;
    const VPN_PASSWORD = serverPrefix
      ? env[`${serverPrefix}VPN_PASSWORD`]
      : env.VPN_PASSWORD;
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const response = await apiClient.get(`/panel/api/inbounds/get/${id}`);
    return response?.obj ?? {};
  } catch (error) {
    logger.error(error);
    throw Error(error);
  }
}

// Функция для добавления клиента в Inbound
async function addClientToInbound(
  inboundId,
  { id, chatId, email, expiryTime, serverPrefix },
) {
  try {
    const apiClient = createApiClient(serverPrefix);
    const VPN_USERNAME = serverPrefix
      ? env[`${serverPrefix}VPN_USERNAME`]
      : env.VPN_USERNAME;
    const VPN_PASSWORD = serverPrefix
      ? env[`${serverPrefix}VPN_PASSWORD`]
      : env.VPN_PASSWORD;
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const newClient = getVlessFullClient({ chatId, email, expiryTime, id });

    const response = await apiClient.post("/panel/api/inbounds/addClient", {
      id: inboundId,
      settings: JSON.stringify({ clients: [newClient] }),
    });
    logger.info(`Client added successfully ${id}`);
    return response.data;
  } catch (error) {
    logger.error(error);
    throw Error(error);
  }
}

// Функция для обновления клиента
async function updateClient(
  inboundId,
  { id, chatId, email, expiryTime, serverPrefix },
) {
  try {
    const apiClient = createApiClient(serverPrefix);
    const VPN_USERNAME = env[`${serverPrefix}VPN_USERNAME`];
    const VPN_PASSWORD = env[`${serverPrefix}VPN_PASSWORD`];
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const updatedClient = getVlessFullClient({ chatId, email, expiryTime, id });
    const response = await apiClient.post(
      `/panel/api/inbounds/updateClient/${id}`,
      {
        id: inboundId,
        settings: JSON.stringify({ clients: [updatedClient] }),
      },
    );
    logger.info(`Client updated successfully ${id}`);
    return response.data;
  } catch (error) {
    logger.info(
      `Error updating client: ${error.response ? error.response.data : error.message}`,
    );
    throw error;
  }
}

module.exports = {
  addClientToInbound,
  updateClient,
  getInbounds,
  getInbound,
  getBackup,
};
