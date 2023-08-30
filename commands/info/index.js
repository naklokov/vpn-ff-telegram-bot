const { getMarkdownContentSync } = require("../../utils/common");
const path = require("path");

module.exports = (ctx) => {
  const infoReplyContent = getMarkdownContentSync(
    path.dirname(__filename) + "/content.md"
  );

  //  const infoReplyContent = getNotionPage(NOTION_PAGE_ID_MAP.IOS_INSTRUCTIONS);
  ctx.reply(infoReplyContent);
};
