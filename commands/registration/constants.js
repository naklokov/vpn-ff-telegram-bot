const { CMD } = require("../../constants");

const getSuccessReply = () =>
  `Вы успешно зарегистрированы

Вам доступны для использования два сервера, оба они входят в ваш тариф.
Попробуйте каждый и выберите какой вам больше подходит

Для подключения к серверу IPSEC 👉 /${CMD.instructionsIpsec}
Для подключения к серверу VLESS 👉 /${CMD.instructionsVless}

Про стоимость и условия можно почитать тут 👉 /info`;

module.exports = { getSuccessReply };
