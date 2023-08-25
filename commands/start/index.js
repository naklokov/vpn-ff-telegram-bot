const { mainMenuButtons } = require("../../components/buttons");
const { getMarkdownContentSync } = require("../../utils");
const path = require("path");

module.exports = (ctx) => {
  const startReplyContent = getMarkdownContentSync(
    path.dirname(__filename) + "/content.md"
  );

  ctx.reply(startReplyContent, { ...mainMenuButtons });
};
