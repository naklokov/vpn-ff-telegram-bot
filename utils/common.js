const { readFileSync } = require("fs");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { FREE_PERIOD_MONTH } = require("../constants");

const getMarkdownContentSync = (filename) => readFileSync(filename, "utf-8");

const getNotionPage = async (pageId) => {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);

  return mdString;
};

const generatePassword = (length = 6) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
  return new Date(
    curDate.setMonth(curDate.getMonth() + FREE_PERIOD_MONTH)
  ).toISOString();
};

module.exports = {
  getMarkdownContentSync,
  getNotionPage,
  generatePassword,
  getUserPersonalDataFromContext,
  getExpiredDate,
  getRegistrationDate,
};
