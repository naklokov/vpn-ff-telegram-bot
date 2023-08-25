const { readFileSync } = require("fs");

const getMarkdownContentSync = (filename) => readFileSync(filename, "utf-8");

module.exports = {
  getMarkdownContentSync,
};
