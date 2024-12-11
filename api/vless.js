const {
  env: { VPN_HOST, VPN_PORT, VPN_WEBBASEPATH, VPN_USERNAME, VPN_PASSWORD },
} = require("process");
const { ApiClient } = require("./client");
const { getVlessFullClient } = require("./utils");

const BASE_URL = `https://${VPN_HOST}:${VPN_PORT}${VPN_WEBBASEPATH}`;
// Установите базовый URL для API
const apiClient = new ApiClient(BASE_URL);

// Функция для получения списка Inbounds
async function getInbounds() {
  try {
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const response = await apiClient.get("/panel/inbound/list");
    console.log("Inbounds:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching inbounds:",
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
}

// Функция для добавления клиента в Inbound
async function addClientToInbound(
  inboundId,
  { id, chatId, email, expiryTime },
) {
  try {
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const newClient = getVlessFullClient({ chatId, email, expiryTime, id });
    const response = await apiClient.post("/panel/api/inbounds/addClient", {
      id: inboundId,
      settings: JSON.stringify(newClient),
    });
    console.log("Client added successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error adding client to inbound:",
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
}

// Функция для обновления клиента
async function updateClient(inboundId, { id, chatId, email, expiryTime }) {
  try {
    await apiClient.login(VPN_USERNAME, VPN_PASSWORD);
    const updatedClient = getVlessFullClient({ chatId, email, expiryTime, id });
    const response = await apiClient.post(
      `/panel/api/inbounds/updateClient/${id}`,
      {
        id: inboundId,
        settings: JSON.stringify(updatedClient),
      },
    );
    console.log("Client updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating client:",
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
}

module.exports = { addClientToInbound, updateClient, getInbounds };
