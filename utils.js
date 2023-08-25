const { readFileSync } = require("fs");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");

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

function random(min, max) {
  return Math.floor(Math.random() * max) + min;
}

module.exports = {
  random,
  getMarkdownContentSync,
  getNotionPage,
};
