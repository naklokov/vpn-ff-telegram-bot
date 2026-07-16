const LOG_LEVEL_LEVELS = {
  INFO: "INFO",
  DEBUG: "DEBUG",
  WARN: "WARN",
  ERROR: "ERROR",
};

const getCurrentTime = () => new Date().toLocaleString("ru-RU");

const getLogMessage = (logLevel, chatId, message) => {
  const fullString = [getCurrentTime(), logLevel, chatId, message]
    .filter((i) => !!i)
    .join(" | ");
  return fullString;
};

const formatPayload = (payload) => {
  if (payload instanceof Error) {
    return payload.stack || payload.message;
  }
  if (typeof payload === "object" && payload !== null) {
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  }
  return String(payload);
};

const info = (message, chatId) => {
  console.log(getLogMessage(LOG_LEVEL_LEVELS.INFO, message, chatId));
};

const warn = (message, chatId) => {
  console.warn(getLogMessage(LOG_LEVEL_LEVELS.WARN, chatId, formatPayload(message)));
};

const error = (err, chatId) => {
  console.error(getLogMessage(LOG_LEVEL_LEVELS.ERROR, chatId, formatPayload(err)));
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
};

const debug = (message, chatId) => {
  console.log(getLogMessage(LOG_LEVEL_LEVELS.DEBUG, message, chatId));
};

module.exports = { info, warn, error, debug };
