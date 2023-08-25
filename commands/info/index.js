const { getMarkdownContentSync } = require("../../utils");
const path = require("path");

module.exports = (ctx) => {
  const infoReplyContent = getMarkdownContentSync(
    path.dirname(__filename) + "/content.md"
  );
  ctx.reply(infoReplyContent);
};
