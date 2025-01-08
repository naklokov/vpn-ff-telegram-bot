const path = require("path");
const { CALLBACK_QUERY_DATA } = require("../../constants");
const { getMarkdownContentSync } = require("../../utils/common");

const instructionsCallbackQuery = (ctx, queryData) => {
  if (queryData === CALLBACK_QUERY_DATA.instructionsAndroid) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-android.md",
    );

    ctx.reply(startReplyContent);
  }

  if (queryData === CALLBACK_QUERY_DATA.instructionsIos) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-ios.md",
    );
    ctx.reply(startReplyContent);
  }

  if (queryData === CALLBACK_QUERY_DATA.instructionsWindows) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-windows.md",
    );
    ctx.reply(startReplyContent);
  }
};

module.exports = { instructionsCallbackQuery };
