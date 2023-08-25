const { Telegraf } = require("telegraf");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const infoCommand = require("./commands/info");

const bot = new Telegraf(process.env.BOT_TOKEN);

const setupBot = () => {
  bot.use((ctx, next) => {
    console.log(ctx);
    return next();
  });

  bot.start(startCommand);
  bot.command("registration", registrationCommand);
  bot.command("info", infoCommand);

  return bot;
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
