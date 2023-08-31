const { Telegraf, Scenes, session } = require("telegraf");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const infoCommand = require("./commands/info");
const { CMD } = require("./constants");
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
  bot.command(CMD.info, infoCommand);
  bot.command(CMD.registration, registrationCommand);
  bot.command(CMD.help, (ctx) =>
    ctx.reply("Если у вас возникли вопросы, пишите разработчику @naklokov")
  );

  return bot;
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
