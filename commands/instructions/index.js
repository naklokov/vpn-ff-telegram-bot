const {
  IOS_INSTRUCTIONS_LINK,
  ANDROID_INSTRUCTIONS_LINK,
} = require("../../constants");

module.exports = async (ctx) => {
  var options = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "IOS (Apple)", url: IOS_INSTRUCTIONS_LINK }],
        [{ text: "Android", url: ANDROID_INSTRUCTIONS_LINK }],
      ],
    }),
  };

  await ctx.reply("Инструкции по подключению VPN", options);
};
