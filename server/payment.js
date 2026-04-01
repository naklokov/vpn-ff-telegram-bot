const axios = require("axios");
const logger = require("../utils/logger");
const { VPN_SERVER_URL, API_TOKEN } = process.env;

if (!VPN_SERVER_URL || !API_TOKEN) {
  throw new Error(
    "VPN_SERVER_URL и API_TOKEN (или VPN_SERVER_API_TOKEN) должны быть заданы в .env",
  );
}

const serverClient = axios.create({
  baseURL: VPN_SERVER_URL,
  headers: {
    "x-api-token": API_TOKEN,
    Accept: "application/json",
  },
  timeout: 20000,
});

const savePayment = async ({ chatId, period, amount, phone, date }) => {
  try {
    const { data } = await serverClient.post("/api/payments", {
      chatId,
      period,
      amount,
      phone,
      date,
    });
    logger.info(`Платёж пользователя ${phone} добавлен в БД`);
    return data;
  } catch (error) {
    logger.info(
      `Произошла ошибка при добавлении платежа в БД ${phone}: ${error}`,
    );
    throw error;
  }
};

const checkPayment = async ({ amount, fileBase64, mimeType }) => {
  try {
    const { data } = await serverClient.post("/api/payments/check-payment", {
      amount,
      fileBase64,
      mimeType,
    });

    if (typeof data === "boolean") {
      return data;
    }

    return Boolean(data?.isPayCorrect);
  } catch (error) {
    logger.info(`Произошла ошибка при проверке платежа: ${error}`);
    throw error;
  }
};

module.exports = {
  savePayment,
  checkPayment,
};
