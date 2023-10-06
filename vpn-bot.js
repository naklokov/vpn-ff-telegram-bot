const { Telegraf, Scenes, session } = require("telegraf");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const ruporCommand = require("./commands/rupor");
const extendCommand = require("./commands/extend");
const infoCommand = require("./commands/info");
const statusCommand = require("./commands/status");
const { CMD } = require("./constants");
const {
  registrationScene,
} = require("./commands/registration/registrationScene");
const { extendScene } = require("./commands/extend/extendScene");
const { ruporScene } = require("./commands/rupor/ruporScene");
const {
  runSyncActiveUserSheduler,
} = require("./utils/shedulers/synsActiveUser");
const {
  runPaymentNotificationSheduler,
} = require("./utils/shedulers/paymentNotification");
const {
  runToogleUserStatusSheduler,
} = require("./utils/shedulers/toogleUserStatus");

const bot = new Telegraf(process.env.BOT_TOKEN);

const setupBot = () => {
  runPaymentNotificationSheduler(bot);
  runToogleUserStatusSheduler();
  runSyncActiveUserSheduler();

  const stage = new Scenes.Stage([registrationScene, extendScene, ruporScene]);
  bot.use(session());
  bot.use(stage.middleware());

  bot.start(startCommand);
  bot.command(CMD.info, infoCommand);
  bot.command(CMD.status, statusCommand);
  bot.command(CMD.extend, extendCommand);
  bot.command(CMD.registration, registrationCommand);
  bot.command(CMD.rupor, ruporCommand);
  bot.command(CMD.help, (ctx) =>
    ctx.reply("Если у вас возникли вопросы, пишите разработчику @naklokov")
  );

  return bot;
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
