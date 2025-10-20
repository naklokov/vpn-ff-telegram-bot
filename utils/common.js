const { readFileSync } = require("fs");
const { FREE_PERIOD_DAYS, CMD } = require("../constants");
const dayjs = require("dayjs");
const pdfjsLib = require("pdfjs-dist");

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
  // берём данные из чата
  const messageChat = ctx?.message?.chat ?? {};
  const chat = ctx?.chat ?? {};
  // берём данные из callbackQuery потому что в чате их нет
  const callbackQueryChat = ctx?.update?.callback_query?.message?.chat;
  const callbackQueryFrom = ctx?.update?.callback_query?.from?.id;
  const fromId = ctx.message?.from?.id;
  const name = chat?.username || callbackQueryChat?.username;
  const id =
    chat?.id ||
    callbackQueryChat?.id ||
    callbackQueryFrom?.id ||
    fromId ||
    messageChat?.id;

  return { name, id };
};

const getRegistrationDateIso = () => new Date().toISOString();
const getExpiredDateIso = () => getExpiredDate().toISOString();

const getExpiredDate = () => {
  const curDate = new Date();
  return dayjs(curDate).add(FREE_PERIOD_DAYS, "days").endOf("day").toDate();
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

async function getTextFromPDF(path) {
  let doc = await pdfjsLib.getDocument(path).promise;
  let page1 = await doc.getPage(1);
  let content = await page1.getTextContent();
  let strings = content.items.map(function (item) {
    return item.str;
  });
  return strings;
}

// Функция для проверки, является ли callback query командой меню
const isMenuCommand = (callbackData) => {
  const menuCommands = Object.values(CMD);
  return menuCommands.includes(callbackData);
};

module.exports = {
  generateUuidv4,
  getMarkdownContentSync,
  generatePassword,
  getUserPersonalDataFromContext,
  convertToUnixDate,
  getExpiredDate,
  getRegistrationDateIso,
  getExpiredDateIso,
  getTextFromPDF,
  isMenuCommand,
};
