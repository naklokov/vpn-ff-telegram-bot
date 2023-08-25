const { Telegraf, Scenes } = require("telegraf");
const { session } = require("telegraf-session-mongodb");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const infoCommand = require("./commands/info");
const backMenuCommand = require("./commands/backMenu");
const { CMD_TEXT } = require("./constants");

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([]);

const setupBot = () => {
  bot.use((ctx, next) => {
    console.log(ctx);
    return next();
  });

  // bot.use(session({ collectionName: "sessions" }));
  bot.use(stage.middleware());

  bot.start(startCommand);
  bot.hears(CMD_TEXT.registration, registrationCommand);
  bot.hears(CMD_TEXT.info, infoCommand);
  bot.hears(CMD_TEXT.help, (ctx) => ctx.reply("@naklokov"));
  bot.hears(CMD_TEXT.menu, backMenuCommand);

  return bot;
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
