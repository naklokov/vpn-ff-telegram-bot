const axios = require("axios");
const https = require("https");

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

      console.log("Login successful:", response.data);

      // Обновление cookie из заголовков ответа
      const setCookie = response.headers["set-cookie"];
      if (setCookie) {
        this.cookie = setCookie?.[1] ?? "";
        this.client.defaults.headers["Cookie"] = this.cookie;
      }

      return response.data;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response ? error.response.data : error.message,
      );
      throw error;
    }
  }

  // Общий метод GET
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      console.log(`GET ${endpoint} successful:`, response.data);
      return response.data;
    } catch (error) {
      console.error(
        `GET ${endpoint} failed:`,
        error.response ? error.response.data : error.message,
      );
      throw error;
    }
  }

  // Общий метод POST
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      console.log(`POST ${endpoint} successful:`, response.data);
      return response.data;
    } catch (error) {
      console.error(
        `POST ${endpoint} failed:`,
        error.response ? error.response.data : error.message,
      );
      throw error;
    }
  }
}

module.exports = { ApiClient };
