const LOG_LEVEL_LEVELS = {
  INFO: "INFO",
  DEBUG: "DEBUG",
  ERROR: "ERROR",
};

// const envLogLevel = process?.env?.LOG_LEVEL ?? LOG_LEVEL_LEVELS.INFO;

const getCurrentTime = () => new Date().toLocaleString("ru-RU");

const getLogMessage = (logLevel, chatId, message) => {
  const fullString = [getCurrentTime(), logLevel, chatId, message]
    .filter((i) => !!i)
    .join(" | ");
  return fullString;
};

const info = (message, chatId) => {
  console.log(getLogMessage(LOG_LEVEL_LEVELS.INFO, message, chatId));
};

const error = (error, chatId) => {
  console.error(getLogMessage(LOG_LEVEL_LEVELS.ERROR, chatId, error));
  console.log(error.stack);
};

const debug = (message, chatId) => {
  console.log(getLogMessage(LOG_LEVEL_LEVELS.DEBUG, message, chatId));
};

module.exports = { info, error, debug };
