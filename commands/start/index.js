const { getMarkdownContentSync } = require("../../utils/common");
const path = require("path");

module.exports = (ctx) => {
  const startReplyContent = getMarkdownContentSync(
    path.dirname(__filename) + "/content.md"
  );

  ctx.reply(startReplyContent);
};
