const path = require("path");
const { CALLBACK_QUERY_DATA } = require("../../constants");
const { getMarkdownContentSync } = require("../../utils/common");

const ipsec = require("./ipsec");
const vless = require("./vless");

const instructionsIpsecCallbackQuery = async (ctx, queryData) => {
  if (queryData === CALLBACK_QUERY_DATA.instructionsAndroidIpsec) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-android-ipsec.md",
    );

    const filename = "vpn-android-npv.sswan";
    await ctx.telegram
      .sendDocument(ctx.from.id, {
        source: path.dirname(__filename) + "/reply/" + filename,
        filename,
      })
      .catch(function (error) {
        console.log(error);
      });

    await ctx.reply(startReplyContent);
  }

  if (queryData === CALLBACK_QUERY_DATA.instructionsIosIpsec) {
    const filename = "vpn-ios-npv.mobileconfig";
    await ctx.telegram
      .sendDocument(ctx.from.id, {
        source: path.dirname(__filename) + "/reply/" + filename,
        filename,
      })
      .catch(function (error) {
        console.log(error);
      });

    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-ios-ipsec.md",
    );

    await ctx.reply(startReplyContent);
  }
};

const instructionsVlessCallbackQuery = (ctx, queryData) => {
  if (queryData === CALLBACK_QUERY_DATA.instructionsAndroidVless) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-android.md",
    );

    ctx.reply(startReplyContent);
  }

  if (queryData === CALLBACK_QUERY_DATA.instructionsIosVless) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-ios.md",
    );
    ctx.reply(startReplyContent);
  }

  if (queryData === CALLBACK_QUERY_DATA.instructionsWindowsVless) {
    const startReplyContent = getMarkdownContentSync(
      path.dirname(__filename) + "/reply/instructions-windows.md",
    );
    ctx.reply(startReplyContent);
  }
};

const instructionsCallbackQuery = async (ctx, queryData) => {
  if (queryData === CALLBACK_QUERY_DATA.instructionsIpsec) {
    await ipsec(ctx);
  }

  if (queryData === CALLBACK_QUERY_DATA.instructionsVless) {
    await vless(ctx);
  }
};

const getAllQueries = (ctx, queryData) => ({
  ...instructionsCallbackQuery(ctx, queryData),
  ...instructionsIpsecCallbackQuery(ctx, queryData),
  ...instructionsVlessCallbackQuery(ctx, queryData),
});

module.exports = {
  instructionsCallbackQuery: getAllQueries,
};
