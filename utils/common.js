const { readFileSync } = require("fs");
const { FREE_PERIOD_MONTH } = require("../constants");

const getMarkdownContentSync = (filename) => readFileSync(filename, "utf-8");

const generatePassword = (length = 6) => {
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  let retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

const getUserPersonalDataFromContext = (ctx) => {
  const { username, first_name = "", last_name = "", id } = ctx.message.chat;
  const name = username || `${first_name} ${last_name}`;

  return { name, id };
};

const getRegistrationDate = () => new Date().toISOString();

const getExpiredDate = () => {
  const curDate = new Date();
  return new Date(curDate.setMonth(curDate.getMonth() + FREE_PERIOD_MONTH));
};

const convertToUnixDate = (date) => Math.floor(date.getTime());

const generateUuidv4 = () => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16),
  );
};

module.exports = {
  generateUuidv4,
  getMarkdownContentSync,
  generatePassword,
  getUserPersonalDataFromContext,
  convertToUnixDate,
  getExpiredDate,
  getRegistrationDate,
};
