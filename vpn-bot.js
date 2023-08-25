const { Telegraf, Scenes, session } = require("telegraf");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const infoCommand = require("./commands/info");
const backMenuCommand = require("./commands/backMenu");
const instructionsCommand = require("./commands/instructions");
const { CMD_TEXT } = require("./constants");
const {
  registrationScene,
} = require("./commands/registration/registrationScene");

const bot = new Telegraf(process.env.BOT_TOKEN);

const setupBot = () => {
  bot.use((ctx, next) => {
    console.log(ctx);
    return next();
  });

  const stage = new Scenes.Stage([registrationScene]);
  bot.use(session());
  bot.use(stage.middleware());

  bot.start(startCommand);
  bot.hears(CMD_TEXT.registration, registrationCommand);
  bot.hears(CMD_TEXT.info, infoCommand);
  bot.hears(CMD_TEXT.instructions, instructionsCommand);
  bot.hears(CMD_TEXT.help, (ctx) => ctx.reply("@naklokov"));
  bot.hears(CMD_TEXT.menu, backMenuCommand);

  return bot;
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
