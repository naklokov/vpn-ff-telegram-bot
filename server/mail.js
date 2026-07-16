const axios = require("axios");
const logger = require("../utils/logger");
const { VPN_SERVER_URL, API_TOKEN } = process.env;

const serverClient = axios.create({
  baseURL: VPN_SERVER_URL,
  headers: {
    "x-api-token": API_TOKEN,
    Accept: "application/json",
  },
  timeout: 20000,
});

const sendEmail = async ({ to, subject, text }) => {
  try {
    const { data } = await serverClient.post("/api/mail/send", {
      to,
      subject,
      text,
    });
    return data;
  } catch (error) {
    const serverMessage = error?.response?.data?.message;
    logger.error(
      `Ошибка при отправке письма на ${to}: ${serverMessage || error?.message || error}`,
    );
    throw new Error(serverMessage || error?.message || "Ошибка при отправке письма");
  }
};

module.exports = {
  sendEmail,
};
