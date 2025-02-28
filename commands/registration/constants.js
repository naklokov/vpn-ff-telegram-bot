const { USERS_TEXT } = require("../../constants");

const getSuccessReply = () =>
  `Вы успешно зарегистрированы

Для настройки сервера выберите пункт ${USERS_TEXT.instructions}

Про стоимость и условия можно почитать в ${USERS_TEXT.info}`;

module.exports = { getSuccessReply };
