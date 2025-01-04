const axios = require("axios");
const https = require("https");
const logger = require("../utils/logger");

class ApiClient {
  constructor(baseURL) {
    // Создаем экземпляр axios с базовыми настройками
    this.client = axios.create({
      baseURL,
      headers: {
        Accept: "application/json",
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Отключение проверки SSL для разработки
      }),
      withCredentials: true, // Включить передачу cookies
    });
    this.cookie = null; // Хранилище для cookie
  }

  // Метод для логина
  async login(username, password) {
    try {
      const qs = new URLSearchParams();
      qs.append("username", username);
      qs.append("password", password);

      const response = await this.client.post("/login", qs.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      logger.info(`LOGIN success: ${username}`);

      // Обновление cookie из заголовков ответа
      const setCookie = response.headers["set-cookie"];
      if (setCookie) {
        this.cookie = setCookie?.[1] ?? "";
        this.client.defaults.headers["Cookie"] = this.cookie;
      }

      return response.data;
    } catch (error) {
      logger.error(
        `LOGIN failed: ${error.response ? error.response.data : error.message}`,
        error,
      );
      throw error;
    }
  }

  // Общий метод GET
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      logger.error(
        `GET failed: ${error.response ? error.response.data : error.message}`,
        error,
      );
      throw error;
    }
  }

  // Общий метод POST
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      logger.error(
        `POST failed: ${error.response ? error.response.data : error.message}`,
        error,
      );
      throw error;
    }
  }
}

module.exports = { ApiClient };
